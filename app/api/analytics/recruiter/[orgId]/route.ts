import { NextRequest, NextResponse } from "next/server";
import { db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

const FIRESTORE_IN_LIMIT = 30;

type SessionRecord = {
  studentId: string;
  status?: string;
};

type RankingSnapshotRecord = {
  id: string;
  orgId: string;
  driveId: string;
  studentId: string;
  reportId?: string;
  sessionId?: string | null;
  rank: number;
  percentile: number;
  weightedScore: number;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  recommendation: string;
  branch: string;
  collegeId: string | null;
  evaluatedAt: Date | null;
  version: number;
  generatedAt: Date | null;
};

type ReadinessRecord = {
  driveId: string;
  studentId: string;
  readinessScore: number;
  level: "High" | "Medium" | "Low";
  confidence: number;
  version: number;
};

type Aggregate = {
  count: number;
  technicalSum: number;
  communicationSum: number;
  overallSum: number;
  selectedCount: number;
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      const dt = candidate.toDate();
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toFiniteNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function normalizeRecommendation(value: unknown): string {
  return String(value || "not-recommended").toLowerCase();
}

function isCompletedStatus(value: unknown): boolean {
  return String(value || "").toLowerCase() === "completed";
}

function isSelectedRecommendation(rec: string): boolean {
  return rec === "highly-recommended" || rec === "recommended";
}

function getLatestVersionByDrive<T extends { driveId: string; version: number }>(records: T[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const record of records) {
    const current = map.get(record.driveId) ?? 0;
    if (record.version > current) {
      map.set(record.driveId, record.version);
    }
  }

  return map;
}

function buildEmptyAnalytics() {
  return {
    status: "not_finalized",
    summary: {
      totalCandidates: 0,
      totalInterviewSessions: 0,
      completedInterviewSessions: 0,
      interviewCompletionRate: 0,
      evaluatedCandidates: 0,
      selectedCandidates: 0,
      selectionRate: 0,
      averageScores: {
        technical: 0,
        communication: 0,
        overall: 0,
      },
    },
    distributions: {
      overallScoreBuckets: {
        "0-9": 0,
        "10-19": 0,
        "20-29": 0,
        "30-39": 0,
        "40-49": 0,
        "50-59": 0,
        "60-69": 0,
        "70-79": 0,
        "80-89": 0,
        "90-100": 0,
      },
      recommendationBreakdown: {
        "highly-recommended": 0,
        recommended: 0,
        consider: 0,
        "not-recommended": 0,
      },
      readinessLevels: {
        High: 0,
        Medium: 0,
        Low: 0,
      },
      readinessScoreBuckets: {
        "0-24": 0,
        "25-49": 0,
        "50-74": 0,
        "75-100": 0,
      },
    },
    rankings: [] as Array<{
      rank: number;
      percentile: number;
      studentId: string;
      reportId: string | null;
      sessionId: string | null;
      driveId: string;
      weightedScore: number;
      overallScore: number;
      technicalScore: number;
      communicationScore: number;
      problemSolvingScore: number;
      recommendation: string;
      branch: string;
      collegeId: string | null;
      evaluatedAt: string | null;
      readinessScore: number | null;
      readinessLevel: "High" | "Medium" | "Low" | null;
      readinessConfidence: number | null;
      version: number;
      generatedAt: string | null;
    }>,
    comparisons: {
      branchWisePerformance: [] as Array<{
        branch: string;
        candidates: number;
        averageTechnicalScore: number;
        averageCommunicationScore: number;
        averageOverallScore: number;
        selectionRate: number;
      }>,
      collegeWisePerformance: [] as Array<{
        collegeId: string;
        candidates: number;
        averageTechnicalScore: number;
        averageCommunicationScore: number;
        averageOverallScore: number;
        selectionRate: number;
      }>,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const ownershipError = await requireOrganizationOwnership(authResult.context, orgId);
    if (ownershipError) return ownershipError;

    const drivesSnapshot = await db
      .collection("interview_drives")
      .where("organizationId", "==", orgId)
      .get();

    const driveIds = drivesSnapshot.docs.map((doc) => doc.id);
    if (driveIds.length === 0) {
      return NextResponse.json(buildEmptyAnalytics());
    }

    const driveChunks = chunkArray(driveIds, FIRESTORE_IN_LIMIT);

    const [sessionSnapshots, rankingSnapshots, readinessSnapshots] = await Promise.all([
      Promise.all(
        driveChunks.map((ids) =>
          db.collection("interview_sessions").where("driveId", "in", ids).get()
        )
      ),
      Promise.all(
        driveChunks.map((ids) =>
          db.collection("ranking_snapshots").where("driveId", "in", ids).where("orgId", "==", orgId).get()
        )
      ),
      Promise.all(
        driveChunks.map((ids) =>
          db.collection("placement_readiness").where("driveId", "in", ids).where("orgId", "==", orgId).get()
        )
      ),
    ]);

    const sessions: SessionRecord[] = sessionSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          studentId: String(data.studentId || ""),
          status: data.status ? String(data.status) : undefined,
        };
      })
    );

    const rankingRecordsRaw: RankingSnapshotRecord[] = rankingSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          orgId: String(data.orgId || ""),
          driveId: String(data.driveId || ""),
          studentId: String(data.studentId || ""),
          reportId: data.reportId ? String(data.reportId) : undefined,
          sessionId: data.sessionId ? String(data.sessionId) : null,
          rank: toFiniteNumber(data.rank),
          percentile: toFiniteNumber(data.percentile),
          weightedScore: toFiniteNumber(data.weightedScore),
          technicalScore: toFiniteNumber(data.technicalScore),
          communicationScore: toFiniteNumber(data.communicationScore),
          problemSolvingScore: toFiniteNumber(data.problemSolvingScore),
          overallScore: toFiniteNumber(data.overallScore),
          recommendation: normalizeRecommendation(data.recommendation),
          branch: data.branch ? String(data.branch) : "Unknown",
          collegeId: data.collegeId ? String(data.collegeId) : null,
          evaluatedAt: toDate(data.evaluatedAt),
          version: toFiniteNumber(data.version),
          generatedAt: toDate(data.generatedAt),
        };
      })
    );

    const readinessRecordsRaw: ReadinessRecord[] = readinessSnapshots.flatMap((snapshot) =>
      snapshot.docs.map((doc) => {
        const data = doc.data() || {};
        const levelRaw = String(data.level || "Low") as "High" | "Medium" | "Low";
        const level = levelRaw === "High" || levelRaw === "Medium" ? levelRaw : "Low";

        return {
          driveId: String(data.driveId || ""),
          studentId: String(data.studentId || ""),
          readinessScore: toFiniteNumber(data.readinessScore),
          level,
          confidence: toFiniteNumber(data.confidence),
          version: toFiniteNumber(data.version),
        };
      })
    );

    const latestRankingVersionByDrive = getLatestVersionByDrive(rankingRecordsRaw);
    const latestReadinessVersionByDrive = getLatestVersionByDrive(readinessRecordsRaw);

    const rankingRecords = rankingRecordsRaw.filter(
      (record) => record.version === (latestRankingVersionByDrive.get(record.driveId) ?? 0)
    );

    const readinessRecords = readinessRecordsRaw.filter(
      (record) => record.version === (latestReadinessVersionByDrive.get(record.driveId) ?? 0)
    );

    // If no ranking snapshots found, return not_finalized status
    if (rankingRecords.length === 0) {
      return NextResponse.json({
        ...buildEmptyAnalytics(),
        message: "No finalized results found. Generate results from interview drive details page.",
      });
    }

    const readinessByDriveStudent = new Map<string, ReadinessRecord>();
    readinessRecords.forEach((record) => {
      readinessByDriveStudent.set(`${record.driveId}::${record.studentId}`, record);
    });

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter((s) => isCompletedStatus(s.status)).length;
    const completionRate =
      totalSessions > 0 ? Number(((completedSessions / totalSessions) * 100).toFixed(2)) : 0;

    const totalCandidates = new Set(
      sessions.map((session) => session.studentId).filter(Boolean)
    ).size;

    let technicalSum = 0;
    let communicationSum = 0;
    let overallSum = 0;
    let selectedCandidates = 0;

    const overallScoreBuckets: Record<string, number> = {
      "0-9": 0,
      "10-19": 0,
      "20-29": 0,
      "30-39": 0,
      "40-49": 0,
      "50-59": 0,
      "60-69": 0,
      "70-79": 0,
      "80-89": 0,
      "90-100": 0,
    };

    const recommendationBreakdown: Record<string, number> = {
      "highly-recommended": 0,
      recommended: 0,
      consider: 0,
      "not-recommended": 0,
    };

    const readinessLevels: Record<"High" | "Medium" | "Low", number> = {
      High: 0,
      Medium: 0,
      Low: 0,
    };

    const readinessScoreBuckets: Record<string, number> = {
      "0-24": 0,
      "25-49": 0,
      "50-74": 0,
      "75-100": 0,
    };

    const branchAgg = new Map<string, Aggregate>();
    const collegeAgg = new Map<string, Aggregate>();

    for (const record of rankingRecords) {
      technicalSum += record.technicalScore;
      communicationSum += record.communicationScore;
      overallSum += record.overallScore;

      if (!(record.recommendation in recommendationBreakdown)) {
        recommendationBreakdown[record.recommendation] = 0;
      }
      recommendationBreakdown[record.recommendation] += 1;

      if (isSelectedRecommendation(record.recommendation)) {
        selectedCandidates += 1;
      }

      const boundedScore = Math.max(0, Math.min(100, Math.floor(record.overallScore)));
      const bucketStart = boundedScore >= 90 ? 90 : Math.floor(boundedScore / 10) * 10;
      const bucketEnd = bucketStart === 90 ? 100 : bucketStart + 9;
      overallScoreBuckets[`${bucketStart}-${bucketEnd}`] += 1;

      const branchKey = record.branch || "Unknown";
      const branchState = branchAgg.get(branchKey) || {
        count: 0,
        technicalSum: 0,
        communicationSum: 0,
        overallSum: 0,
        selectedCount: 0,
      };
      branchState.count += 1;
      branchState.technicalSum += record.technicalScore;
      branchState.communicationSum += record.communicationScore;
      branchState.overallSum += record.overallScore;
      if (isSelectedRecommendation(record.recommendation)) {
        branchState.selectedCount += 1;
      }
      branchAgg.set(branchKey, branchState);

      if (record.collegeId) {
        const collegeState = collegeAgg.get(record.collegeId) || {
          count: 0,
          technicalSum: 0,
          communicationSum: 0,
          overallSum: 0,
          selectedCount: 0,
        };
        collegeState.count += 1;
        collegeState.technicalSum += record.technicalScore;
        collegeState.communicationSum += record.communicationScore;
        collegeState.overallSum += record.overallScore;
        if (isSelectedRecommendation(record.recommendation)) {
          collegeState.selectedCount += 1;
        }
        collegeAgg.set(record.collegeId, collegeState);
      }
    }

    for (const readiness of readinessRecords) {
      readinessLevels[readiness.level] += 1;
      if (readiness.readinessScore < 25) {
        readinessScoreBuckets["0-24"] += 1;
      } else if (readiness.readinessScore < 50) {
        readinessScoreBuckets["25-49"] += 1;
      } else if (readiness.readinessScore < 75) {
        readinessScoreBuckets["50-74"] += 1;
      } else {
        readinessScoreBuckets["75-100"] += 1;
      }
    }

    const evaluatedCandidates = new Set(
      rankingRecords.map((record) => `${record.driveId}::${record.studentId}`)
    ).size;

    const selectionRate =
      evaluatedCandidates > 0
        ? Number(((selectedCandidates / evaluatedCandidates) * 100).toFixed(2))
        : 0;

    const averageScores = {
      technical:
        evaluatedCandidates > 0 ? Number((technicalSum / evaluatedCandidates).toFixed(2)) : 0,
      communication:
        evaluatedCandidates > 0 ? Number((communicationSum / evaluatedCandidates).toFixed(2)) : 0,
      overall:
        evaluatedCandidates > 0 ? Number((overallSum / evaluatedCandidates).toFixed(2)) : 0,
    };

    const rankings = [...rankingRecords]
      .sort((a, b) => {
        if (a.weightedScore !== b.weightedScore) return b.weightedScore - a.weightedScore;
        if (a.technicalScore !== b.technicalScore) return b.technicalScore - a.technicalScore;
        if (a.problemSolvingScore !== b.problemSolvingScore) return b.problemSolvingScore - a.problemSolvingScore;
        const aDate = a.evaluatedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bDate = b.evaluatedAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return aDate - bDate;
      })
      .slice(0, 10)
      .map((record) => {
        const readiness = readinessByDriveStudent.get(`${record.driveId}::${record.studentId}`);

        return {
          rank: record.rank,
          percentile: record.percentile,
          studentId: record.studentId,
          reportId: record.reportId || null,
          sessionId: record.sessionId || null,
          driveId: record.driveId,
          weightedScore: record.weightedScore,
          overallScore: record.overallScore,
          technicalScore: record.technicalScore,
          communicationScore: record.communicationScore,
          problemSolvingScore: record.problemSolvingScore,
          recommendation: record.recommendation,
          branch: record.branch,
          collegeId: record.collegeId,
          evaluatedAt: record.evaluatedAt ? record.evaluatedAt.toISOString() : null,
          readinessScore: readiness ? readiness.readinessScore : null,
          readinessLevel: readiness ? readiness.level : null,
          readinessConfidence: readiness ? readiness.confidence : null,
          version: record.version,
          generatedAt: record.generatedAt ? record.generatedAt.toISOString() : null,
        };
      });

    const branchWisePerformance = Array.from(branchAgg.entries())
      .map(([branch, agg]) => ({
        branch,
        candidates: agg.count,
        averageTechnicalScore: Number((agg.technicalSum / agg.count).toFixed(2)),
        averageCommunicationScore: Number((agg.communicationSum / agg.count).toFixed(2)),
        averageOverallScore: Number((agg.overallSum / agg.count).toFixed(2)),
        selectionRate: Number(((agg.selectedCount / agg.count) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.averageOverallScore - a.averageOverallScore);

    const collegeWisePerformance = Array.from(collegeAgg.entries())
      .map(([collegeId, agg]) => ({
        collegeId,
        candidates: agg.count,
        averageTechnicalScore: Number((agg.technicalSum / agg.count).toFixed(2)),
        averageCommunicationScore: Number((agg.communicationSum / agg.count).toFixed(2)),
        averageOverallScore: Number((agg.overallSum / agg.count).toFixed(2)),
        selectionRate: Number(((agg.selectedCount / agg.count) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.averageOverallScore - a.averageOverallScore);

    return NextResponse.json({
      status: "finalized",
      summary: {
        totalCandidates,
        totalInterviewSessions: totalSessions,
        completedInterviewSessions: completedSessions,
        interviewCompletionRate: completionRate,
        evaluatedCandidates,
        selectedCandidates,
        selectionRate,
        averageScores,
      },
      distributions: {
        overallScoreBuckets,
        recommendationBreakdown,
        readinessLevels,
        readinessScoreBuckets,
      },
      rankings,
      comparisons: {
        branchWisePerformance,
        collegeWisePerformance,
      },
    });
  } catch (error) {
    console.error("Error fetching recruiter analytics:", error);
    return NextResponse.json({ error: "Failed to fetch recruiter analytics" }, { status: 500 });
  }
}
