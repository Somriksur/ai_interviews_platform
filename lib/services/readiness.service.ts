import { db } from "@/firebase/admin";

export interface ReadinessAttempt {
  reportId: string;
  studentId: string;
  orgId: string;
  driveId: string | null;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  evaluatedAt: Date | null;
}

export interface PlacementReadinessResult {
  studentId: string;
  orgId: string;
  driveId: string | null;
  readinessScore: number;
  level: "High" | "Medium" | "Low";
  confidence: number;
  breakdown: {
    technical: number;
    communication: number;
    problemSolving: number;
    consistency: number;
    attempts: number;
  };
  attemptsCount: number;
  sourceReportIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ReadinessSnapshotMeta {
  version: number;
  generatedAt: Date;
}

const READINESS_BATCH_LIMIT = 450;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeAttempt(attempt: ReadinessAttempt): ReadinessAttempt {
  return {
    ...attempt,
    technicalScore: clamp(safeNumber(attempt.technicalScore), 0, 100),
    communicationScore: clamp(safeNumber(attempt.communicationScore), 0, 100),
    problemSolvingScore: clamp(safeNumber(attempt.problemSolvingScore), 0, 100),
    evaluatedAt:
      attempt.evaluatedAt && !Number.isNaN(attempt.evaluatedAt.getTime())
        ? attempt.evaluatedAt
        : null,
  };
}

function sortAttemptsChronologically(attempts: ReadinessAttempt[]): ReadinessAttempt[] {
  return [...attempts].sort((a, b) => {
    const aTime = a.evaluatedAt?.getTime() ?? Number.MIN_SAFE_INTEGER;
    const bTime = b.evaluatedAt?.getTime() ?? Number.MIN_SAFE_INTEGER;
    return aTime - bTime;
  });
}

function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  let weightedSum = 0;
  let totalWeight = 0;

  values.forEach((value, index) => {
    const weight = index + 1;
    weightedSum += value * weight;
    totalWeight += weight;
  });

  return weightedSum / totalWeight;
}

function computeCompositeScore(attempt: ReadinessAttempt): number {
  return attempt.technicalScore * 0.5 + attempt.communicationScore * 0.2 + attempt.problemSolvingScore * 0.3;
}

function computeConsistencyScore(attempts: ReadinessAttempt[]): number {
  if (attempts.length <= 1) return 100;

  const compositeScores = attempts.map((attempt) => computeCompositeScore(attempt));
  const mean = compositeScores.reduce((sum, score) => sum + score, 0) / compositeScores.length;
  const variance =
    compositeScores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / compositeScores.length;
  const stdDev = Math.sqrt(variance);

  return Number(clamp(100 - stdDev * 2, 0, 100).toFixed(2));
}

function computeAttemptScore(attemptsCount: number): number {
  const score = 100 - (attemptsCount - 1) * 8;
  return Number(clamp(score, 50, 100).toFixed(2));
}

function computeConfidence(attempts: ReadinessAttempt[], consistencyScore: number): number {
  const attemptsCount = attempts.length;
  const evidence = clamp((attemptsCount / 6) * 100, 20, 100);

  const firstComposite = computeCompositeScore(attempts[0]);
  const lastComposite = computeCompositeScore(attempts[attempts.length - 1]);
  const trendDelta = lastComposite - firstComposite;
  const trendConfidence = clamp(50 + trendDelta * 2, 0, 100);

  const confidence = consistencyScore * 0.45 + evidence * 0.35 + trendConfidence * 0.2;
  return Number(clamp(confidence, 0, 100).toFixed(2));
}

function getReadinessLevel(score: number): "High" | "Medium" | "Low" {
  if (score >= 75) return "High";
  if (score >= 55) return "Medium";
  return "Low";
}

export function computePlacementReadiness(
  attemptsInput: ReadinessAttempt[]
): Omit<PlacementReadinessResult, "createdAt" | "updatedAt"> {
  if (attemptsInput.length === 0) {
    throw new Error("Cannot compute readiness without attempts");
  }

  const attempts = sortAttemptsChronologically(attemptsInput.map(normalizeAttempt));
  const attemptsCount = attempts.length;

  const technical = Number(weightedAverage(attempts.map((a) => a.technicalScore)).toFixed(2));
  const communication = Number(weightedAverage(attempts.map((a) => a.communicationScore)).toFixed(2));
  const problemSolving = Number(weightedAverage(attempts.map((a) => a.problemSolvingScore)).toFixed(2));

  const consistency = computeConsistencyScore(attempts);
  const attemptScore = computeAttemptScore(attemptsCount);

  const readinessScore = Number(
    clamp(
      technical * 0.4 +
        communication * 0.2 +
        problemSolving * 0.2 +
        consistency * 0.1 +
        attemptScore * 0.1,
      0,
      100
    ).toFixed(2)
  );

  const confidence = computeConfidence(attempts, consistency);

  return {
    studentId: attempts[0].studentId,
    orgId: attempts[0].orgId,
    driveId: attempts[0].driveId,
    readinessScore,
    level: getReadinessLevel(readinessScore),
    confidence,
    breakdown: {
      technical,
      communication,
      problemSolving,
      consistency,
      attempts: attemptScore,
    },
    attemptsCount,
    sourceReportIds: attempts.map((a) => a.reportId),
  };
}

export function computePlacementReadinessBatch(
  attemptsByStudent: Record<string, ReadinessAttempt[]>
): Omit<PlacementReadinessResult, "createdAt" | "updatedAt">[] {
  return Object.values(attemptsByStudent)
    .filter((attempts) => attempts.length > 0)
    .map((attempts) => computePlacementReadiness(attempts));
}

export async function persistPlacementReadiness(
  readinessResults: Omit<PlacementReadinessResult, "createdAt" | "updatedAt">[],
  meta: ReadinessSnapshotMeta
): Promise<void> {
  if (readinessResults.length === 0) return;

  for (let i = 0; i < readinessResults.length; i += READINESS_BATCH_LIMIT) {
    const chunk = readinessResults.slice(i, i + READINESS_BATCH_LIMIT);
    const batch = db.batch();

    for (const result of chunk) {
      const ref = db.collection("placement_readiness").doc();

      batch.set(ref, {
        orgId: result.orgId,
        driveId: result.driveId,
        studentId: result.studentId,
        readinessScore: result.readinessScore,
        level: result.level,
        confidence: result.confidence,
        breakdown: result.breakdown,
        attemptsCount: result.attemptsCount,
        sourceReportIds: result.sourceReportIds,
        version: meta.version,
        generatedAt: meta.generatedAt,
        createdAt: new Date(),
      });
    }

    await batch.commit();
  }
}

export async function computeAndStorePlacementReadiness(
  attemptsByStudent: Record<string, ReadinessAttempt[]>,
  meta: ReadinessSnapshotMeta
): Promise<Omit<PlacementReadinessResult, "createdAt" | "updatedAt">[]> {
  const results = computePlacementReadinessBatch(attemptsByStudent);
  await persistPlacementReadiness(results, meta);
  return results;
}
