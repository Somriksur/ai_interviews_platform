// Campus Recruitment System Types

export interface Organization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  adminId: string;
  createdAt: Date;
  settings: {
    allowBulkInterviews: boolean;
    maxColleges: number;
    maxStudentsPerDrive: number;
  };
}

export interface College {
  id: string;
  organizationId: string;
  name: string;
  normalizedName: string; // Lowercase, trimmed version for case-insensitive lookups
  location: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string;
  createdAt: Date;
  stats: {
    totalStudents: number;
    pendingRegistrations: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}

export interface Student {
  id: string;
  collegeId: string;
  collegeName: string; // Original casing for display
  normalizedCollegeName: string; // Lowercase for lookups
  organizationId: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  cgpa: number;
  skills: string[];
  userId?: string; // Firebase Auth UID (linked after first login)
  registrationStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface InterviewDrive {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  role: string;
  colleges: string[]; // Deprecated: kept for backward compatibility
  taggedColleges: string[]; // Array of normalized college names
  taggedStudents: Array<{
    studentId: string;
    normalizedCollegeName: string; // College the student belongs to
    taggedAt: Date;
  }>;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  completedAt: Date | null;
  stats: {
    totalStudents: number;
    completedInterviews: number;
    averageScore: number;
    byCollege: {
      [normalizedCollegeName: string]: {
        totalStudents: number;
        completedInterviews: number;
        averageScore: number;
      };
    };
  };
}

export interface PlacementReport {
  id: string;
  driveId: string;
  organizationId: string;
  collegeId: string;
  studentId: string;
  skillInsights: {
    technical: string[];
    communication: string[];
    problemSolving: string[];
    leadership: string[];
  };
  strengths: string[];
  weaknesses: string[];
  communicationRating: number;
  technicalScore: number;
  overallScore: number;
  evaluationSummary: string;
  recommendedJobs: string[];
  salaryBand: 'high' | 'medium' | 'low';
  placementCategory: string;
  generatedAt: Date;
  pdfUrl: string;
}

export interface JobProfile {
  id: string;
  organizationId: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: string;
  minimumScore: number;
  communicationRequirement: number;
  salaryBand: {
    min: number;
    max: number;
    category: 'high' | 'medium' | 'low';
  };
  createdAt: Date;
}

export interface StudentJobMatch {
  id: string;
  studentId: string;
  driveId: string;
  matches: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    matchScore: number;
    salaryBand: string;
    reasons: string[];
  }>;
  recommendedCategory: 'high' | 'medium' | 'low';
  generatedAt: Date;
}

export type UserRole = 'recruiter' | 'candidate' | 'organization_admin' | 'college_admin' | 'student';

/**
 * Tagged student for interview drive
 */
export interface TaggedStudent {
  studentId: string;
  normalizedCollegeName: string;
  taggedAt: Date;
}

/**
 * College stats for interview drive
 */
export interface DriveCollegeStats {
  totalStudents: number;
  completedInterviews: number;
  averageScore: number;
}

/**
 * Creates a new interview drive with empty college associations
 */
export function createInterviewDrive(data: {
  name: string;
  description: string;
  role: string;
  organizationId: string;
  status?: 'pending' | 'in-progress' | 'completed';
}): Omit<InterviewDrive, 'id' | 'createdAt'> {
  return {
    organizationId: data.organizationId,
    name: data.name,
    description: data.description,
    role: data.role,
    colleges: [], // Deprecated
    taggedColleges: [],
    taggedStudents: [],
    status: data.status || 'pending',
    completedAt: null,
    stats: {
      totalStudents: 0,
      completedInterviews: 0,
      averageScore: 0,
      byCollege: {},
    },
  };
}

/**
 * Tags colleges for an interview drive
 */
export function tagCollegesForDrive(
  drive: InterviewDrive,
  normalizedCollegeNames: string[]
): InterviewDrive {
  const newTaggedColleges = [...new Set([...drive.taggedColleges, ...normalizedCollegeNames])];
  
  // Initialize stats for new colleges
  const newByCollege = { ...drive.stats.byCollege };
  normalizedCollegeNames.forEach((collegeName) => {
    if (!newByCollege[collegeName]) {
      newByCollege[collegeName] = {
        totalStudents: 0,
        completedInterviews: 0,
        averageScore: 0,
      };
    }
  });

  return {
    ...drive,
    taggedColleges: newTaggedColleges,
    stats: {
      ...drive.stats,
      byCollege: newByCollege,
    },
  };
}

/**
 * Tags a student for an interview drive
 */
export function tagStudentForDrive(
  drive: InterviewDrive,
  studentId: string,
  normalizedCollegeName: string
): InterviewDrive {
  // Check if student is already tagged
  const isAlreadyTagged = drive.taggedStudents.some(
    (ts) => ts.studentId === studentId
  );

  if (isAlreadyTagged) {
    return drive;
  }

  // Check if college is tagged for this drive
  if (!drive.taggedColleges.includes(normalizedCollegeName)) {
    throw new Error('College is not tagged for this interview drive');
  }

  const newTaggedStudents = [
    ...drive.taggedStudents,
    {
      studentId,
      normalizedCollegeName,
      taggedAt: new Date(),
    },
  ];

  // Update stats
  const collegeStats = drive.stats.byCollege[normalizedCollegeName] || {
    totalStudents: 0,
    completedInterviews: 0,
    averageScore: 0,
  };

  const newByCollege = {
    ...drive.stats.byCollege,
    [normalizedCollegeName]: {
      ...collegeStats,
      totalStudents: collegeStats.totalStudents + 1,
    },
  };

  return {
    ...drive,
    taggedStudents: newTaggedStudents,
    stats: {
      ...drive.stats,
      totalStudents: drive.stats.totalStudents + 1,
      byCollege: newByCollege,
    },
  };
}

/**
 * Gets students tagged for a specific college
 */
export function getStudentsByCollege(
  drive: InterviewDrive,
  normalizedCollegeName: string
): TaggedStudent[] {
  return drive.taggedStudents.filter(
    (ts) => ts.normalizedCollegeName === normalizedCollegeName
  );
}

/**
 * Gets all colleges with tagged students
 */
export function getCollegesWithStudents(drive: InterviewDrive): string[] {
  const colleges = new Set(
    drive.taggedStudents.map((ts) => ts.normalizedCollegeName)
  );
  return Array.from(colleges);
}

/**
 * Gets stats for a specific college
 */
export function getCollegeStats(
  drive: InterviewDrive,
  normalizedCollegeName: string
): DriveCollegeStats | null {
  return drive.stats.byCollege[normalizedCollegeName] || null;
}

/**
 * Updates interview completion for a student
 */
export function updateInterviewCompletion(
  drive: InterviewDrive,
  studentId: string,
  score: number
): InterviewDrive {
  const taggedStudent = drive.taggedStudents.find(
    (ts) => ts.studentId === studentId
  );

  if (!taggedStudent) {
    throw new Error('Student is not tagged for this interview drive');
  }

  const collegeName = taggedStudent.normalizedCollegeName;
  const collegeStats = drive.stats.byCollege[collegeName];

  if (!collegeStats) {
    throw new Error('College stats not found');
  }

  // Update college stats
  const newCompletedInterviews = collegeStats.completedInterviews + 1;
  const newAverageScore =
    (collegeStats.averageScore * collegeStats.completedInterviews + score) /
    newCompletedInterviews;

  const newByCollege = {
    ...drive.stats.byCollege,
    [collegeName]: {
      ...collegeStats,
      completedInterviews: newCompletedInterviews,
      averageScore: newAverageScore,
    },
  };

  // Update overall stats
  const newOverallCompleted = drive.stats.completedInterviews + 1;
  const newOverallAverage =
    (drive.stats.averageScore * drive.stats.completedInterviews + score) /
    newOverallCompleted;

  return {
    ...drive,
    stats: {
      ...drive.stats,
      completedInterviews: newOverallCompleted,
      averageScore: newOverallAverage,
      byCollege: newByCollege,
    },
  };
}

/**
 * Checks if a student is tagged for the drive
 */
export function isStudentTagged(
  drive: InterviewDrive,
  studentId: string
): boolean {
  return drive.taggedStudents.some((ts) => ts.studentId === studentId);
}

/**
 * Checks if a college is tagged for the drive
 */
export function isCollegeTagged(
  drive: InterviewDrive,
  normalizedCollegeName: string
): boolean {
  return drive.taggedColleges.includes(normalizedCollegeName);
}
