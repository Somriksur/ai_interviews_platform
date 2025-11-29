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
  location: string;
  contactEmail: string;
  contactPhone: string;
  adminId: string;
  createdAt: Date;
  stats: {
    totalStudents: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}

export interface Student {
  id: string;
  collegeId: string;
  organizationId: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  cgpa: number;
  skills: string[];
  createdAt: Date;
}

export interface InterviewDrive {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  role: string;
  colleges: string[];
  taggedStudents: string[];
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  completedAt: Date | null;
  stats: {
    totalStudents: number;
    completedInterviews: number;
    averageScore: number;
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
