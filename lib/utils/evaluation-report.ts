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

/**
 * Recursively remove undefined values from an object
 * Firestore doesn't allow undefined values
 */
function removeUndefinedValues(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedValues(item)).filter(item => item !== undefined);
  }

  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = removeUndefinedValues(value);
        }
      }
    }
    return cleaned;
  }

  return obj;
}

export function withCanonicalScores(report: any): any {
  const canonical = getCanonicalScores(report);
  const result = {
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
  
  // Remove all undefined values to prevent Firestore errors
  return removeUndefinedValues(result);
}
