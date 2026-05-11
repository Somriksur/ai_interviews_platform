import { db } from "@/firebase/admin";

/**
 * Check if a drive should be auto-finalized and trigger finalization if ready.
 * 
 * A drive is ready for auto-finalization when:
 * 1. It has not been finalized yet
 * 2. All tagged students have completed their interviews
 * 3. All completed sessions have evaluation reports
 * 
 * @param driveId - The interview drive ID
 * @returns Promise<boolean> - true if finalization was triggered, false otherwise
 */
export async function checkAndAutoFinalize(driveId: string): Promise<boolean> {
  try {
    // Get drive data
    const driveDoc = await db.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      console.log(`⚠️ Drive ${driveId} not found`);
      return false;
    }

    const driveData = driveDoc.data() || {};

    // Check if already finalized
    if (driveData.finalized === true) {
      console.log(`✅ Drive ${driveId} already finalized`);
      return false;
    }

    // Get all sessions for this drive
    const sessionsSnapshot = await db
      .collection("interview_sessions")
      .where("driveId", "==", driveId)
      .get();

    if (sessionsSnapshot.empty) {
      console.log(`⚠️ No sessions found for drive ${driveId}`);
      return false;
    }

    // Check if all sessions are completed
    const sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const completedSessions = sessions.filter(
      (session) => session.status === "completed"
    );

    if (completedSessions.length === 0) {
      console.log(`⚠️ No completed sessions for drive ${driveId}`);
      return false;
    }

    // Check if all completed sessions have evaluation reports
    const reportsSnapshot = await db
      .collection("evaluation_reports")
      .where("driveId", "==", driveId)
      .get();

    const reportSessionIds = new Set(
      reportsSnapshot.docs.map((doc) => doc.data().sessionId).filter(Boolean)
    );

    const allCompletedHaveReports = completedSessions.every((session) =>
      reportSessionIds.has(session.id)
    );

    if (!allCompletedHaveReports) {
      console.log(
        `⚠️ Not all completed sessions have reports for drive ${driveId}`
      );
      console.log(
        `Completed: ${completedSessions.length}, Reports: ${reportSessionIds.size}`
      );
      return false;
    }

    // All conditions met - trigger auto-finalization
    console.log(`🎯 Auto-finalizing drive ${driveId}...`);

    // Import and call finalization logic
    const { generateRankings, getRankingConfig, persistRankingSnapshot } =
      await import("./ranking.service");
    const { computeAndStorePlacementReadiness } = await import(
      "./readiness.service"
    );
    const { withCanonicalScores } = await import("../utils/evaluation-report");

    // Build ranking inputs from reports
    const rankingInputs: any[] = [];
    const readinessAttemptsByStudent: Record<string, any[]> = {};

    const sessionsById = new Map(
      sessions.map((s) => [s.id, s])
    );

    reportsSnapshot.docs.forEach((doc) => {
      const canonical = withCanonicalScores(doc.data());
      const linkedSession = canonical.sessionId
        ? sessionsById.get(String(canonical.sessionId))
        : undefined;
      const studentId = canonical.studentId
        ? String(canonical.studentId)
        : linkedSession?.studentId || "";

      if (!studentId) return;

      const evaluatedAt =
        canonical.aiMetadata?.evaluatedAt ||
        canonical.createdAt ||
        canonical.updatedAt;

      const rankingInput = {
        orgId: String(driveData.organizationId || ""),
        driveId,
        studentId,
        reportId: doc.id,
        sessionId: canonical.sessionId
          ? String(canonical.sessionId)
          : linkedSession?.id || null,
        technicalScore: Number(canonical.technicalScore || 0),
        communicationScore: Number(canonical.communicationScore || 0),
        problemSolvingScore: Number(
          canonical.problemSolvingScore ?? canonical.scores?.problemSolving ?? 0
        ),
        overallScore: Number(canonical.overallScore || 0),
        recommendation: String(canonical.recommendation || "not-recommended"),
        evaluatedAt: evaluatedAt instanceof Date ? evaluatedAt : new Date(evaluatedAt),
        collegeId:
          linkedSession?.collegeId ||
          (canonical.sentTo?.collegeId
            ? String(canonical.sentTo.collegeId)
            : null) ||
          (canonical.collegeId ? String(canonical.collegeId) : null),
        branch: canonical.branch
          ? String(canonical.branch)
          : linkedSession?.branch || "Unknown",
      };

      rankingInputs.push(rankingInput);

      if (!readinessAttemptsByStudent[studentId]) {
        readinessAttemptsByStudent[studentId] = [];
      }

      readinessAttemptsByStudent[studentId].push({
        reportId: doc.id,
        studentId,
        orgId: String(driveData.organizationId || ""),
        driveId,
        technicalScore: rankingInput.technicalScore,
        communicationScore: rankingInput.communicationScore,
        problemSolvingScore: rankingInput.problemSolvingScore,
        evaluatedAt: rankingInput.evaluatedAt,
      });
    });

    if (rankingInputs.length === 0) {
      console.log(`⚠️ No valid ranking inputs for drive ${driveId}`);
      return false;
    }

    // Get next version
    const [rankingVersionSnap, readinessVersionSnap] = await Promise.all([
      db
        .collection("ranking_snapshots")
        .where("orgId", "==", driveData.organizationId)
        .where("driveId", "==", driveId)
        .orderBy("version", "desc")
        .limit(1)
        .get(),
      db
        .collection("placement_readiness")
        .where("orgId", "==", driveData.organizationId)
        .where("driveId", "==", driveId)
        .orderBy("version", "desc")
        .limit(1)
        .get(),
    ]);

    const rankingVersion = rankingVersionSnap.empty
      ? 0
      : Number(rankingVersionSnap.docs[0].data()?.version || 0);
    const readinessVersion = readinessVersionSnap.empty
      ? 0
      : Number(readinessVersionSnap.docs[0].data()?.version || 0);

    const version = Math.max(rankingVersion, readinessVersion) + 1;
    const generatedAt = new Date();

    // Get ranking config and generate rankings
    const rankingConfig = await getRankingConfig(
      String(driveData.organizationId),
      driveId
    );
    const rankings = generateRankings(rankingInputs, rankingConfig);

    // Persist rankings and readiness
    await Promise.all([
      persistRankingSnapshot(rankings, { version, generatedAt }),
      computeAndStorePlacementReadiness(readinessAttemptsByStudent, {
        version,
        generatedAt,
      }),
    ]);

    // Mark drive as finalized
    await db.collection("interview_drives").doc(driveId).update({
      finalized: true,
      finalizedAt: generatedAt,
      finalizedVersion: version,
      autoFinalized: true,
    });

    console.log(
      `✅ Auto-finalized drive ${driveId} - Rankings: ${rankings.length}, Version: ${version}`
    );

    return true;
  } catch (error) {
    console.error(`❌ Error auto-finalizing drive ${driveId}:`, error);
    return false;
  }
}
