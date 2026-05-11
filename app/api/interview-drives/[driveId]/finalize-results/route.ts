import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { withCanonicalScores } from "@/lib/utils/evaluation-report";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership, requireRole } from "@/lib/security/guards";
import {
  generateRankings,
  getRankingConfig,
  persistRankingSnapshot,
  type RankingInput,
} from "@/lib/services/ranking.service";
import {
  computeAndStorePlacementReadiness,
  type ReadinessAttempt,
} from "@/lib/services/readiness.service";

type SessionLookup = {
  id: string;
  studentId: string;
  driveId: string;
  collegeId: string | null;
  branch: string | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      const date = candidate.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toFiniteNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

async function getNextVersion(orgId: string, driveId: string): Promise<number> {
  const [rankingVersionSnap, readinessVersionSnap] = await Promise.all([
    db
      .collection("ranking_snapshots")
      .where("orgId", "==", orgId)
      .where("driveId", "==", driveId)
      .orderBy("version", "desc")
      .limit(1)
      .get(),
    db
      .collection("placement_readiness")
      .where("orgId", "==", orgId)
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

  return Math.max(rankingVersion, readinessVersion) + 1;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization"]);
    if (roleError) return roleError;

    const { driveId } = await params;

    const driveDoc = await db.collection("interview_drives").doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Interview drive not found" }, { status: 404 });
    }

    const driveData = driveDoc.data() || {};
    const orgId = String(driveData.organizationId || "");

    if (!orgId) {
      return NextResponse.json(
        { error: "Drive organizationId is missing" },
        { status: 400 }
      );
    }

    // Check if already finalized
    if (driveData.finalized === true) {
      return NextResponse.json(
        { 
          error: "Drive results already finalized",
          version: driveData.finalizedVersion,
          finalizedAt: driveData.finalizedAt,
        },
        { status: 400 }
      );
    }

    const ownershipError = await requireOrganizationOwnership(authResult.context, orgId);
    if (ownershipError) return ownershipError;

    const [reportsSnapshot, sessionsSnapshot] = await Promise.all([
      db.collection("evaluation_reports").where("driveId", "==", driveId).get(),
      db.collection("interview_sessions").where("driveId", "==", driveId).get(),
    ]);

    if (reportsSnapshot.empty) {
      return NextResponse.json(
        { error: "No evaluation reports found for this drive" },
        { status: 404 }
      );
    }

    const sessionsById = new Map<string, SessionLookup>();
    sessionsSnapshot.docs.forEach((doc) => {
      const data = doc.data() || {};
      sessionsById.set(doc.id, {
        id: doc.id,
        studentId: String(data.studentId || ""),
        driveId: String(data.driveId || ""),
        collegeId: data.collegeId ? String(data.collegeId) : null,
        branch: data.branch ? String(data.branch) : null,
      });
    });

    const rankingInputs: RankingInput[] = [];
    const readinessAttemptsByStudent: Record<string, ReadinessAttempt[]> = {};

    reportsSnapshot.docs.forEach((doc) => {
      const canonical = withCanonicalScores(doc.data());
      const linkedSession = canonical.sessionId ? sessionsById.get(String(canonical.sessionId)) : undefined;
      const studentId = canonical.studentId
        ? String(canonical.studentId)
        : linkedSession?.studentId || "";

      if (!studentId) return;

      const evaluatedAt =
        toDate(canonical.aiMetadata?.evaluatedAt) ||
        toDate(canonical.createdAt) ||
        toDate(canonical.updatedAt);

      const rankingInput: RankingInput = {
        orgId,
        driveId,
        studentId,
        reportId: doc.id,
        sessionId: canonical.sessionId ? String(canonical.sessionId) : linkedSession?.id || null,
        technicalScore: toFiniteNumber(canonical.technicalScore),
        communicationScore: toFiniteNumber(canonical.communicationScore),
        problemSolvingScore: toFiniteNumber(
          canonical.problemSolvingScore ?? canonical.scores?.problemSolving ?? 0
        ),
        overallScore: toFiniteNumber(canonical.overallScore),
        recommendation: String(canonical.recommendation || "not-recommended"),
        evaluatedAt,
        collegeId:
          linkedSession?.collegeId ||
          (canonical.sentTo?.collegeId ? String(canonical.sentTo.collegeId) : null) ||
          (canonical.collegeId ? String(canonical.collegeId) : null),
        branch: canonical.branch ? String(canonical.branch) : linkedSession?.branch || "Unknown",
      };

      rankingInputs.push(rankingInput);

      if (!readinessAttemptsByStudent[studentId]) {
        readinessAttemptsByStudent[studentId] = [];
      }

      readinessAttemptsByStudent[studentId].push({
        reportId: doc.id,
        studentId,
        orgId,
        driveId,
        technicalScore: rankingInput.technicalScore,
        communicationScore: rankingInput.communicationScore,
        problemSolvingScore: rankingInput.problemSolvingScore,
        evaluatedAt,
      });
    });

    if (rankingInputs.length === 0) {
      return NextResponse.json(
        { error: "No valid ranking inputs could be derived from reports" },
        { status: 400 }
      );
    }

    const [version, rankingConfig] = await Promise.all([
      getNextVersion(orgId, driveId),
      getRankingConfig(orgId, driveId),
    ]);

    const generatedAt = new Date();
    const rankings = generateRankings(rankingInputs, rankingConfig);

    const [_, readinessResults] = await Promise.all([
      persistRankingSnapshot(rankings, { version, generatedAt }),
      computeAndStorePlacementReadiness(readinessAttemptsByStudent, { version, generatedAt }),
    ]);

    // Mark drive as finalized
    await db.collection("interview_drives").doc(driveId).update({
      finalized: true,
      finalizedAt: generatedAt,
      finalizedVersion: version,
    });

    return NextResponse.json({
      success: true,
      orgId,
      driveId,
      version,
      generatedAt: generatedAt.toISOString(),
      rankingConfigSource: rankingConfig.source,
      rankingCount: rankings.length,
      readinessCount: readinessResults.length,
    });
  } catch (error) {
    console.error("Error finalizing drive results:", error);
    return NextResponse.json({ error: "Failed to finalize drive results" }, { status: 500 });
  }
}
