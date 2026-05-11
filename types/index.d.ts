interface Feedback {
  id: string;
  interviewId: string;
  candidateId: string;
  organizationId: string;
  totalScore: number;
  categoryScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  transcript: Array<{
    role: string;
    content: string;
    timestamp?: string;
  }>;
  duration?: number;
  createdAt: string;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  organizationId: string;
  type: string;
  status: "draft" | "assigned" | "in-progress" | "completed";
  candidateEmail?: string;
  candidateId?: string;
  vapiAssistantId?: string;
  coverImage?: string;
  assignedAt?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  feedbackId?: string;
}

interface User {
  name: string;
  email: string;
  id: string;
  role: "organization" | "college" | "student" | "candidate";
  organizationId?: string;
  collegeId?: string;
  createdAt?: string;
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
  uid?: string;
  name?: string;
  role?: "organization" | "college" | "student" | "candidate";
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  role: "organization" | "college" | "student" | "candidate";
}

type FormType = "sign-in" | "sign-up";

interface InterviewFormProps {
  interviewId: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  amount: number;
}

interface TechIconProps {
  techStack: string[];
}

interface StudentReport {
  technicalScore: number;
  communicationRating: number;
  overallScore: number;
  skillInsights: {
    technical: string[];
    communication: string[];
    problemSolving: string[];
    leadership: string[];
  };
}

interface JobRequirement {
  id: string;
  role: string;
  skills: string[];
  salaryRange: {
    min: number;
    max: number;
    category: 'high' | 'mid' | 'low';
  };
  minScore?: number;
}

interface JobMatch {
  jobId: string;
  role: string;
  matchScore: number;
  salaryCategory: 'high' | 'mid' | 'low';
  reasons: string[];
}
