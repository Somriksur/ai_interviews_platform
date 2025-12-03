/**
 * Notification Service
 * 
 * Handles creation of notifications for college admins and students
 */

import { db } from '@/firebase/admin';

export interface CollegeNotification {
  type: 'registration_request' | 'job_posting' | 'interview_drive' | 'message';
  collegeId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
  metadata?: {
    requestId?: string;
    jobId?: string;
    driveId?: string;
    studentEmail?: string;
    studentName?: string;
  };
}

export interface StudentNotification {
  type: 'registration_approved' | 'registration_rejected' | 'interview_assignment' | 'message';
  studentId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
  createdAt: Date;
  metadata?: {
    requestId?: string;
    driveId?: string;
    rejectionReason?: string;
  };
}

/**
 * Create a notification for college admin about a new registration request
 */
export async function notifyCollegeOfRegistrationRequest(params: {
  collegeId: string;
  requestId: string;
  studentName: string;
  studentEmail: string;
  collegeName: string;
}): Promise<string> {
  const notification: CollegeNotification = {
    type: 'registration_request',
    collegeId: params.collegeId,
    title: 'New Student Registration Request',
    message: `${params.studentName} (${params.studentEmail}) has requested to join ${params.collegeName}`,
    priority: 'medium',
    read: false,
    createdAt: new Date(),
    metadata: {
      requestId: params.requestId,
      studentEmail: params.studentEmail,
      studentName: params.studentName,
    },
  };

  const docRef = await db.collection('college_notifications').add(notification);
  return docRef.id;
}

/**
 * Create a notification for student about registration approval
 */
export async function notifyStudentOfApproval(params: {
  studentId: string;
  collegeName: string;
  requestId: string;
}): Promise<string> {
  const notification: StudentNotification = {
    type: 'registration_approved',
    studentId: params.studentId,
    title: 'Registration Approved',
    message: `Your registration request for ${params.collegeName} has been approved. You can now access interview opportunities.`,
    priority: 'high',
    read: false,
    createdAt: new Date(),
    metadata: {
      requestId: params.requestId,
    },
  };

  const docRef = await db.collection('student_notifications').add(notification);
  return docRef.id;
}

/**
 * Create a notification for student about registration rejection
 */
export async function notifyStudentOfRejection(params: {
  email: string;
  collegeName: string;
  requestId: string;
  rejectionReason?: string;
}): Promise<string> {
  // For rejected students who don't have a studentId yet, we'll store by email
  // and they can check their status using the registration request endpoint
  const notification = {
    type: 'registration_rejected',
    email: params.email,
    title: 'Registration Request Declined',
    message: `Your registration request for ${params.collegeName} has been declined.${
      params.rejectionReason ? ` Reason: ${params.rejectionReason}` : ''
    }`,
    priority: 'medium',
    read: false,
    createdAt: new Date(),
    metadata: {
      requestId: params.requestId,
      rejectionReason: params.rejectionReason,
    },
  };

  const docRef = await db.collection('registration_notifications').add(notification);
  return docRef.id;
}

/**
 * Get pending registration requests count for a college
 */
export async function getPendingRegistrationCount(collegeId: string): Promise<number> {
  const snapshot = await db
    .collection('registration_requests')
    .where('collegeId', '==', collegeId)
    .where('status', '==', 'pending')
    .get();

  return snapshot.size;
}

/**
 * Mark a college notification as read
 */
export async function markCollegeNotificationAsRead(notificationId: string): Promise<void> {
  await db.collection('college_notifications').doc(notificationId).update({
    read: true,
    readAt: new Date(),
  });
}

/**
 * Get unread notification count for a college
 */
export async function getUnreadCollegeNotificationCount(collegeId: string): Promise<number> {
  const snapshot = await db
    .collection('college_notifications')
    .where('collegeId', '==', collegeId)
    .where('read', '==', false)
    .get();

  return snapshot.size;
}
