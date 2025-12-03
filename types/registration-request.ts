/**
 * Student Registration Request Type Definitions
 * 
 * Handles student self-registration with college approval workflow
 */

export interface RegistrationRequest {
  id: string;
  studentName: string;
  email: string;
  collegeName: string; // Original casing for display
  normalizedCollegeName: string; // Normalized for lookups
  collegeId: string; // Firestore college document ID
  organizationId: string; // Parent organization ID
  rollNumber?: string;
  branch?: string;
  year?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string; // College admin ID who reviewed
  rejectionReason?: string;
}

/**
 * Creates a registration request with normalized college name
 */
export function createRegistrationRequest(params: {
  studentName: string;
  email: string;
  collegeName: string;
  normalizedCollegeName: string;
  collegeId: string;
  organizationId: string;
  rollNumber?: string;
  branch?: string;
  year?: number;
}): Omit<RegistrationRequest, 'id'> {
  return {
    studentName: params.studentName,
    email: params.email,
    collegeName: params.collegeName,
    normalizedCollegeName: params.normalizedCollegeName,
    collegeId: params.collegeId,
    organizationId: params.organizationId,
    rollNumber: params.rollNumber,
    branch: params.branch,
    year: params.year,
    status: 'pending',
    submittedAt: new Date(),
  };
}

/**
 * Validates registration request data
 */
export function validateRegistrationRequest(data: {
  studentName: string;
  email: string;
  collegeName: string;
  rollNumber?: string;
  branch?: string;
  year?: number;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.studentName || data.studentName.trim().length < 2) {
    errors.push('Student name must be at least 2 characters');
  }

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.collegeName || data.collegeName.trim().length < 3) {
    errors.push('College name must be at least 3 characters');
  }

  if (data.year !== undefined && (data.year < 1 || data.year > 5)) {
    errors.push('Year must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
