// Evaluation Report Data Models
// Defines the structure for AI-generated interview evaluation reports

export interface EvaluationScores {
  technical: number; // 0-100
  communication: number; // 0-100
  problemSolving: number; // 0-100
  overall: number; // 0-100
}

export interface QuestionResponse {
  question: string;
  response: string;
  score: number; // 0-100
  feedback: string;
}

export interface EvaluationFeedback {
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  questionResponses: QuestionResponse[];
}

export interface AIMetadata {
  groqModel: string;
  nlpVersion: string;
  evaluatedAt: Date;
  processingTime: number; // milliseconds
}

export interface ReportDistribution {
  collegeId: string | null;
  organizationId: string | null;
  sentAt: Date;
}

export type RecommendationLevel = 
  | 'highly-recommended' 
  | 'recommended' 
  | 'consider' 
  | 'not-recommended';

export interface EvaluationReport {
  id: string;
  sessionId: string;
  driveId: string;
  studentId: string;
  
  // Evaluation scores
  scores: EvaluationScores;
  
  // Detailed feedback
  feedback: EvaluationFeedback;
  
  // Recommendation level
  recommendation: RecommendationLevel;
  
  // AI processing metadata
  aiMetadata: AIMetadata;
  
  // Distribution tracking
  sentTo: ReportDistribution;
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

// Firestore collection name
export const EVALUATION_REPORTS_COLLECTION = 'evaluation_reports';

// Validation helpers
export function validateEvaluationReport(report: Partial<EvaluationReport>): string[] {
  const errors: string[] = [];

  if (!report.sessionId) errors.push('sessionId is required');
  if (!report.driveId) errors.push('driveId is required');
  if (!report.studentId) errors.push('studentId is required');

  if (report.scores) {
    const { technical, communication, problemSolving, overall } = report.scores;
    if (technical < 0 || technical > 100) errors.push('technical score must be 0-100');
    if (communication < 0 || communication > 100) errors.push('communication score must be 0-100');
    if (problemSolving < 0 || problemSolving > 100) errors.push('problemSolving score must be 0-100');
    if (overall < 0 || overall > 100) errors.push('overall score must be 0-100');
  } else {
    errors.push('scores are required');
  }

  if (!report.feedback) {
    errors.push('feedback is required');
  } else {
    if (!report.feedback.strengths || report.feedback.strengths.length === 0) {
      errors.push('at least one strength is required');
    }
    if (!report.feedback.detailedAnalysis) {
      errors.push('detailedAnalysis is required');
    }
  }

  if (!report.recommendation) {
    errors.push('recommendation is required');
  } else {
    const validRecommendations: RecommendationLevel[] = [
      'highly-recommended',
      'recommended',
      'consider',
      'not-recommended'
    ];
    if (!validRecommendations.includes(report.recommendation)) {
      errors.push('invalid recommendation level');
    }
  }

  return errors;
}

// Helper to get recommendation badge color
export function getRecommendationColor(recommendation: RecommendationLevel): string {
  switch (recommendation) {
    case 'highly-recommended':
      return 'green';
    case 'recommended':
      return 'blue';
    case 'consider':
      return 'yellow';
    case 'not-recommended':
      return 'red';
    default:
      return 'gray';
  }
}

// Helper to get recommendation display text
export function getRecommendationText(recommendation: RecommendationLevel): string {
  switch (recommendation) {
    case 'highly-recommended':
      return 'Highly Recommended';
    case 'recommended':
      return 'Recommended';
    case 'consider':
      return 'Consider';
    case 'not-recommended':
      return 'Not Recommended';
    default:
      return 'Unknown';
  }
}

// Helper to format score with color
export function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 65) return 'blue';
  if (score >= 50) return 'yellow';
  return 'red';
}

// Helper to get score grade
export function getScoreGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}
