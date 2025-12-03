/**
 * Job Posting Type Definitions
 * 
 * Enhanced with minimum score threshold for student selection recommendations
 */

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  requirements?: string[];
  skills?: string[];
  location?: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  
  // Selection criteria
  minimumScore?: number; // Minimum overall interview score required (0-100)
  scoreWeights?: {
    technical: number;
    communication: number;
    behavioral: number;
  };
  
  // Status and metadata
  status: 'draft' | 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
  closingDate?: Date;
  
  // College tagging (normalized college names)
  taggedColleges: string[]; // Array of normalized college names
  collegeApprovals: {
    [normalizedCollegeName: string]: {
      status: 'pending' | 'approved' | 'rejected';
      respondedAt?: Date;
      notes?: string;
    };
  };
}

/**
 * Validates minimum score value
 */
export function validateMinimumScore(score: number | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (score === undefined || score === null) {
    return { isValid: true }; // Optional field
  }

  if (typeof score !== 'number') {
    return { isValid: false, error: 'Minimum score must be a number' };
  }

  if (score < 0 || score > 100) {
    return { isValid: false, error: 'Minimum score must be between 0 and 100' };
  }

  if (!Number.isInteger(score)) {
    return { isValid: false, error: 'Minimum score must be an integer' };
  }

  return { isValid: true };
}

/**
 * College approval status for job postings
 */
export interface CollegeApproval {
  status: 'pending' | 'approved' | 'rejected';
  respondedAt?: Date;
  notes?: string;
}

/**
 * Creates a new job posting with empty college tagging
 */
export function createJobPosting(data: {
  title: string;
  description: string;
  organizationId: string;
  requirements?: string[];
  skills?: string[];
  location?: string;
  salary?: { min: number; max: number; currency: string };
  minimumScore?: number;
  status?: 'draft' | 'active' | 'closed';
}): Omit<JobPosting, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: data.title,
    description: data.description,
    organizationId: data.organizationId,
    requirements: data.requirements,
    skills: data.skills,
    location: data.location,
    salary: data.salary,
    minimumScore: data.minimumScore,
    status: data.status || 'draft',
    taggedColleges: [],
    collegeApprovals: {},
  };
}

/**
 * Adds colleges to a job posting's tagged list
 */
export function tagCollegesForJob(
  jobPosting: JobPosting,
  normalizedCollegeNames: string[]
): JobPosting {
  const newTaggedColleges = [...new Set([...jobPosting.taggedColleges, ...normalizedCollegeNames])];
  const newApprovals = { ...jobPosting.collegeApprovals };

  // Initialize approval status for new colleges
  normalizedCollegeNames.forEach((collegeName) => {
    if (!newApprovals[collegeName]) {
      newApprovals[collegeName] = {
        status: 'pending',
      };
    }
  });

  return {
    ...jobPosting,
    taggedColleges: newTaggedColleges,
    collegeApprovals: newApprovals,
    updatedAt: new Date(),
  };
}

/**
 * Updates college approval status
 */
export function updateCollegeApproval(
  jobPosting: JobPosting,
  normalizedCollegeName: string,
  status: 'approved' | 'rejected',
  notes?: string
): JobPosting {
  if (!jobPosting.taggedColleges.includes(normalizedCollegeName)) {
    throw new Error('College is not tagged for this job posting');
  }

  return {
    ...jobPosting,
    collegeApprovals: {
      ...jobPosting.collegeApprovals,
      [normalizedCollegeName]: {
        status,
        respondedAt: new Date(),
        notes,
      },
    },
    updatedAt: new Date(),
  };
}

/**
 * Gets colleges by approval status
 */
export function getCollegesByStatus(
  jobPosting: JobPosting,
  status: 'pending' | 'approved' | 'rejected'
): string[] {
  return jobPosting.taggedColleges.filter(
    (collegeName) => jobPosting.collegeApprovals[collegeName]?.status === status
  );
}

/**
 * Checks if a college has approved the job posting
 */
export function hasCollegeApproved(
  jobPosting: JobPosting,
  normalizedCollegeName: string
): boolean {
  return jobPosting.collegeApprovals[normalizedCollegeName]?.status === 'approved';
}
