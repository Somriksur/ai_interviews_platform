/**
 * Job Notification Type Definitions
 * 
 * Types for job posting notifications sent to colleges
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Job notification document stored in Firestore
 */
export interface JobNotification {
  id: string;
  jobPostingId: string;
  collegeId: string; // Kept for backward compatibility
  normalizedCollegeName: string; // Primary key for college lookup
  organizationId: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'job_posting';
  createdAt: Timestamp | Date;
  respondedAt?: Timestamp | Date | null;
  notes?: string;
}

/**
 * Creates a new job notification
 */
export function createJobNotification(data: {
  jobPostingId: string;
  collegeId: string;
  normalizedCollegeName: string;
  organizationId: string;
}): Omit<JobNotification, 'id'> {
  return {
    jobPostingId: data.jobPostingId,
    collegeId: data.collegeId,
    normalizedCollegeName: data.normalizedCollegeName,
    organizationId: data.organizationId,
    status: 'pending',
    type: 'job_posting',
    createdAt: new Date(),
    respondedAt: null,
  };
}

/**
 * Updates job notification status
 */
export function updateJobNotificationStatus(
  notification: JobNotification,
  status: 'approved' | 'rejected',
  notes?: string
): JobNotification {
  return {
    ...notification,
    status,
    respondedAt: new Date(),
    notes,
  };
}

/**
 * Checks if notification is pending
 */
export function isNotificationPending(notification: JobNotification): boolean {
  return notification.status === 'pending';
}

/**
 * Checks if notification is approved
 */
export function isNotificationApproved(notification: JobNotification): boolean {
  return notification.status === 'approved';
}

/**
 * Checks if notification is rejected
 */
export function isNotificationRejected(notification: JobNotification): boolean {
  return notification.status === 'rejected';
}

/**
 * Job notification status constants
 */
export const JobNotificationStatus = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

/**
 * Response action type for job notification responses
 */
export type JobNotificationAction = 'approve' | 'reject';

/**
 * Validates job notification action
 */
export function isValidJobNotificationAction(
  action: string
): action is JobNotificationAction {
  return action === 'approve' || action === 'reject';
}

/**
 * Converts action to status
 */
export function actionToJobNotificationStatus(
  action: JobNotificationAction
): 'approved' | 'rejected' {
  return action === 'approve' ? 'approved' : 'rejected';
}
