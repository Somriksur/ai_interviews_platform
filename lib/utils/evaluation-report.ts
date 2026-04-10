export interface CanonicalEvaluationScores {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  overallScore: number;
  recommendation: string;
}

export function getCanonicalScores(report: any): CanonicalEvaluationScores {
  const scores = report?.scores || {};

  const technicalScore = Number(
    report?.technicalScore ?? scores.technical ?? 0
  );
  const communicationScore = Number(
    report?.communicationScore ?? scores.communication ?? 0
  );
  const problemSolvingScore = Number(
    report?.problemSolvingScore ?? scores.problemSolving ?? 0
  );
  const overallScore = Number(report?.overallScore ?? scores.overall ?? 0);
  const recommendation = String(report?.recommendation || "not-recommended");

  return {
    technicalScore,
    communicationScore,
    problemSolvingScore,
    overallScore,
    recommendation,
  };
}

export function withCanonicalScores(report: any): any {
  const canonical = getCanonicalScores(report);
  return {
    ...report,
    ...canonical,
    scores: {
      ...(report?.scores || {}),
      technical: canonical.technicalScore,
      communication: canonical.communicationScore,
      problemSolving: canonical.problemSolvingScore,
      overall: canonical.overallScore,
    },
  };
}
