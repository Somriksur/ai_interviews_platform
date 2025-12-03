/**
 * Student Selection Type Definitions
 * 
 * Enhanced with threshold tracking and recommendation override
 */

export interface StudentSelection {
  id: string;
  studentId: string;
  jobPostingId: string;
  organizationId: string;
  collegeId: string;
  
  // Selection status
  status: 'select' | 'shortlist' | 'reject';
  
  // Score tracking (NEW)
  scoreAtSelection: number; // Student's overall score when selected
  meetsThreshold: boolean; // Whether score met minimum threshold
  recommendationOverride?: boolean; // True if selected despite not meeting threshold
  
  // Metadata
  selectedBy: string; // User ID who made the selection
  selectedAt: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Creates a student selection with score tracking
 */
export function createStudentSelection(params: {
  studentId: string;
  jobPostingId: string;
  organizationId: string;
  collegeId: string;
  status: 'select' | 'shortlist' | 'reject';
  overallScore: number;
  minimumScore?: number;
  selectedBy: string;
  notes?: string;
}): Omit<StudentSelection, 'id' | 'createdAt' | 'updatedAt'> {
  const meetsThreshold = params.minimumScore !== undefined
    ? params.overallScore >= params.minimumScore
    : true;

  const recommendationOverride = params.minimumScore !== undefined
    ? params.status === 'select' && !meetsThreshold
    : undefined;

  return {
    studentId: params.studentId,
    jobPostingId: params.jobPostingId,
    organizationId: params.organizationId,
    collegeId: params.collegeId,
    status: params.status,
    scoreAtSelection: params.overallScore,
    meetsThreshold,
    recommendationOverride,
    selectedBy: params.selectedBy,
    selectedAt: new Date(),
    notes: params.notes,
  };
}

/**
 * Calculates selection statistics for a job posting
 */
export function calculateSelectionStats(selections: StudentSelection[]): {
  total: number;
  selected: number;
  shortlisted: number;
  rejected: number;
  meetingThreshold: number;
  belowThreshold: number;
  overrides: number;
} {
  return {
    total: selections.length,
    selected: selections.filter((s) => s.status === 'select').length,
    shortlisted: selections.filter((s) => s.status === 'shortlist').length,
    rejected: selections.filter((s) => s.status === 'reject').length,
    meetingThreshold: selections.filter((s) => s.meetsThreshold).length,
    belowThreshold: selections.filter((s) => !s.meetsThreshold).length,
    overrides: selections.filter((s) => s.recommendationOverride === true).length,
  };
}
