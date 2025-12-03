/**
 * Drive Notification Type Definitions
 * 
 * Types for interview drive notifications sent to colleges
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Drive notification document stored in Firestore
 */
export interface DriveNotification {
  id: string;
  driveId: string;
  collegeId: string;
  organizationId: string;
  status: 'pending' | 'confirmed' | 'declined';
  type: 'interview_drive';
  createdAt: Timestamp | Date;
  respondedAt: Timestamp | Date | null;
}

/**
 * Interview drive details for notification display
 */
export interface InterviewDriveDetails {
  id: string;
  name: string;
  role: string;
  description: string;
  interviewConfig?: {
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  };
  questions?: Array<{
    text: string;
    order: number;
    generatedBy: string;
  }>;
}

/**
 * Organization details for notification display
 */
export interface OrganizationDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Job posting details for notification display
 */
export interface JobPostingDetails {
  id: string;
  role: string;
  skills: string[];
  vacancies: number;
  salaryRange: {
    min: number;
    max: number;
    category: string;
  };
  description: string;
}

/**
 * Unified notification that can be either a job posting or interview drive
 */
export interface UnifiedNotification {
  id: string;
  type: 'job_posting' | 'interview_drive';
  status: 'pending' | 'confirmed' | 'declined';
  createdAt: Date | Timestamp;
  respondedAt?: Date | Timestamp | null;
  
  // For job postings
  jobPosting?: JobPostingDetails;
  
  // For interview drives
  interviewDrive?: InterviewDriveDetails;
  
  // Common fields
  organization: OrganizationDetails;
}

/**
 * Type guard to check if notification is a drive notification
 */
export function isDriveNotification(
  notification: UnifiedNotification
): notification is UnifiedNotification & { interviewDrive: InterviewDriveDetails } {
  return notification.type === 'interview_drive' && !!notification.interviewDrive;
}

/**
 * Type guard to check if notification is a job posting notification
 */
export function isJobPostingNotification(
  notification: UnifiedNotification
): notification is UnifiedNotification & { jobPosting: JobPostingDetails } {
  return notification.type === 'job_posting' && !!notification.jobPosting;
}

/**
 * Notification type constants
 */
export const NotificationType = {
  JOB_POSTING: 'job_posting' as const,
  INTERVIEW_DRIVE: 'interview_drive' as const,
} as const;

/**
 * Notification status constants
 */
export const NotificationStatus = {
  PENDING: 'pending' as const,
  CONFIRMED: 'confirmed' as const,
  DECLINED: 'declined' as const,
} as const;

/**
 * Response action type for notification responses
 */
export type NotificationAction = 'confirm' | 'decline';

/**
 * Validates notification action
 */
export function isValidNotificationAction(action: string): action is NotificationAction {
  return action === 'confirm' || action === 'decline';
}

/**
 * Converts action to status
 */
export function actionToStatus(action: NotificationAction): 'confirmed' | 'declined' {
  return action === 'confirm' ? 'confirmed' : 'declined';
}
