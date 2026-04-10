import { db } from "@/firebase/admin";

export interface RankingInput {
  orgId: string;
  driveId: string | null;
  studentId: string;
  reportId: string;
  sessionId: string | null;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  recommendation: string;
  evaluatedAt: Date | null;
  collegeId: string | null;
  branch: string;
}

export interface RankingWeights {
  technicalWeight: number;
  communicationWeight: number;
  problemSolvingWeight: number;
  highRecommendationBonus: number;
  notRecommendationPenalty: number;
}

export interface RankingConfig {
  weights: RankingWeights;
  source: "drive" | "organization" | "default";
}

export interface RankedCandidate extends RankingInput {
  weightedScore: number;
  rank: number;
  percentile: number;
}

export interface RankingSnapshotMeta {
  version: number;
  generatedAt: Date;
}

const BATCH_WRITE_LIMIT = 450;

const DEFAULT_WEIGHTS: RankingWeights = {
  technicalWeight: 0.5,
  communicationWeight: 0.2,
  problemSolvingWeight: 0.3,
  highRecommendationBonus: 5,
  notRecommendationPenalty: -5,
};

function normalizeRecommendation(value: unknown): string {
  return String(value || "not-recommended").toLowerCase();
}

function safeNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function getDateEpoch(date: Date | null): number {
  if (!date) return Number.MAX_SAFE_INTEGER;
  const value = date.getTime();
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value;
}

function sanitizeWeights(weights: Partial<RankingWeights> | undefined): RankingWeights {
  const merged: RankingWeights = {
    ...DEFAULT_WEIGHTS,
    ...(weights || {}),
  };

  const weightSum = merged.technicalWeight + merged.communicationWeight + merged.problemSolvingWeight;

  if (weightSum <= 0) {
    return { ...DEFAULT_WEIGHTS };
  }

  return {
    technicalWeight: merged.technicalWeight / weightSum,
    communicationWeight: merged.communicationWeight / weightSum,
    problemSolvingWeight: merged.problemSolvingWeight / weightSum,
    highRecommendationBonus: safeNumber(merged.highRecommendationBonus),
    notRecommendationPenalty: safeNumber(merged.notRecommendationPenalty),
  };
}

function recommendationAdjustment(recommendation: string, weights: RankingWeights): number {
  if (recommendation === "highly-recommended") return weights.highRecommendationBonus;
  if (recommendation === "not-recommended") return weights.notRecommendationPenalty;
  return 0;
}

function calculateWeightedScore(input: RankingInput, weights: RankingWeights): number {
  const technicalScore = safeNumber(input.technicalScore);
  const communicationScore = safeNumber(input.communicationScore);
  const problemSolvingScore = safeNumber(input.problemSolvingScore);
  const normalizedRecommendation = normalizeRecommendation(input.recommendation);

  const baseWeighted =
    technicalScore * weights.technicalWeight +
    communicationScore * weights.communicationWeight +
    problemSolvingScore * weights.problemSolvingWeight;

  return Number((baseWeighted + recommendationAdjustment(normalizedRecommendation, weights)).toFixed(2));
}

function compareRankingPriority(a: RankedCandidate, b: RankedCandidate): number {
  if (a.weightedScore !== b.weightedScore) return b.weightedScore - a.weightedScore;

  const aTechnical = safeNumber(a.technicalScore);
  const bTechnical = safeNumber(b.technicalScore);
  if (aTechnical !== bTechnical) return bTechnical - aTechnical;

  const aProblem = safeNumber(a.problemSolvingScore);
  const bProblem = safeNumber(b.problemSolvingScore);
  if (aProblem !== bProblem) return bProblem - aProblem;

  return getDateEpoch(a.evaluatedAt) - getDateEpoch(b.evaluatedAt);
}

function toRankedCandidate(input: RankingInput, weights: RankingWeights): RankedCandidate {
  return {
    ...input,
    recommendation: normalizeRecommendation(input.recommendation),
    weightedScore: calculateWeightedScore(input, weights),
    rank: 0,
    percentile: 0,
  };
}

function pickBestAttemptPerStudent(inputs: RankingInput[], weights: RankingWeights): RankedCandidate[] {
  const bestByStudent = new Map<string, RankedCandidate>();

  for (const input of inputs) {
    const candidate = toRankedCandidate(input, weights);
    const existing = bestByStudent.get(candidate.studentId);

    if (!existing) {
      bestByStudent.set(candidate.studentId, candidate);
      continue;
    }

    if (compareRankingPriority(candidate, existing) < 0) {
      bestByStudent.set(candidate.studentId, candidate);
    }
  }

  return Array.from(bestByStudent.values());
}

function assignRankAndPercentile(candidates: RankedCandidate[]): RankedCandidate[] {
  const total = candidates.length;

  return candidates
    .sort(compareRankingPriority)
    .map((candidate, index) => {
      const rank = index + 1;
      const percentile =
        total <= 1
          ? 100
          : Number((((total - rank) / (total - 1)) * 100).toFixed(2));

      return {
        ...candidate,
        rank,
        percentile,
      };
    });
}

export async function getRankingConfig(orgId: string, driveId: string | null): Promise<RankingConfig> {
  if (driveId) {
    const driveConfigDoc = await db.collection("ranking_config").doc(`drive_${driveId}`).get();
    if (driveConfigDoc.exists) {
      return {
        weights: sanitizeWeights(driveConfigDoc.data()?.weights),
        source: "drive",
      };
    }
  }

  const orgConfigDoc = await db.collection("ranking_config").doc(`org_${orgId}`).get();
  if (orgConfigDoc.exists) {
    return {
      weights: sanitizeWeights(orgConfigDoc.data()?.weights),
      source: "organization",
    };
  }

  const defaultConfigDoc = await db.collection("ranking_config").doc("default").get();
  if (defaultConfigDoc.exists) {
    return {
      weights: sanitizeWeights(defaultConfigDoc.data()?.weights),
      source: "default",
    };
  }

  return {
    weights: { ...DEFAULT_WEIGHTS },
    source: "default",
  };
}

export function generateRankings(
  inputs: RankingInput[],
  config?: RankingConfig
): RankedCandidate[] {
  if (inputs.length === 0) return [];
  const weights = sanitizeWeights(config?.weights);
  const bestAttempts = pickBestAttemptPerStudent(inputs, weights);
  return assignRankAndPercentile(bestAttempts);
}

export async function persistRankingSnapshot(
  rankings: RankedCandidate[],
  meta: RankingSnapshotMeta
): Promise<void> {
  if (rankings.length === 0) return;

  for (let i = 0; i < rankings.length; i += BATCH_WRITE_LIMIT) {
    const chunk = rankings.slice(i, i + BATCH_WRITE_LIMIT);
    const batch = db.batch();

    for (const ranking of chunk) {
      const snapshotRef = db.collection("ranking_snapshots").doc();
      batch.set(snapshotRef, {
        orgId: ranking.orgId,
        driveId: ranking.driveId,
        studentId: ranking.studentId,
        reportId: ranking.reportId,
        sessionId: ranking.sessionId,
        rank: ranking.rank,
        percentile: ranking.percentile,
        weightedScore: ranking.weightedScore,
        technicalScore: ranking.technicalScore,
        communicationScore: ranking.communicationScore,
        problemSolvingScore: ranking.problemSolvingScore,
        overallScore: ranking.overallScore,
        recommendation: ranking.recommendation,
        collegeId: ranking.collegeId,
        branch: ranking.branch,
        evaluatedAt: ranking.evaluatedAt,
        version: meta.version,
        generatedAt: meta.generatedAt,
        createdAt: new Date(),
      });
    }

    await batch.commit();
  }
}
