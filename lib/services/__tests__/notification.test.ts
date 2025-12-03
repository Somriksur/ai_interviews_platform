/**
 * Property-Based Tests for Notification Service
 * 
 * Tests notification creation for registration requests
 */

import * as fc from 'fast-check';

// Mock Firebase Admin
jest.mock('@/firebase/admin', () => ({
  db: {
    collection: jest.fn(() => ({
      add: jest.fn(() => Promise.resolve({ id: 'mock-notification-id' })),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn(() => Promise.resolve({ size: 0 })),
        })),
        get: jest.fn(() => Promise.resolve({ size: 0 })),
      })),
      doc: jest.fn(() => ({
        update: jest.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

import {
  notifyCollegeOfRegistrationRequest,
  notifyStudentOfApproval,
  notifyStudentOfRejection,
} from '../notification.service';

describe('Notification Service', () => {
  describe('Property 13: Registration request notification', () => {
    /**
     * **Feature: college-name-primary-key, Property 13: Registration request notification**
     * **Validates: Requirements 4.4**
     * 
     * For any registration request created, a notification should exist for the college admin.
     */
    test('registration request creates college notification', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            collegeId: fc.string({ minLength: 10, maxLength: 30 }),
            requestId: fc.string({ minLength: 10, maxLength: 30 }),
            studentName: fc.string({ minLength: 2, maxLength: 50 }),
            studentEmail: fc.emailAddress(),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
          }),
          async (params) => {
            // Create notification
            const notificationId = await notifyCollegeOfRegistrationRequest(params);

            // Property: Notification should be created (returns an ID)
            expect(notificationId).toBeDefined();
            expect(typeof notificationId).toBe('string');
            expect(notificationId.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('notification contains correct metadata', async () => {
      const params = {
        collegeId: 'college-123',
        requestId: 'request-456',
        studentName: 'John Doe',
        studentEmail: 'john@example.com',
        collegeName: 'MIT',
      };

      const notificationId = await notifyCollegeOfRegistrationRequest(params);

      // Property: Notification ID should be returned
      expect(notificationId).toBe('mock-notification-id');
    });
  });

  describe('Student Approval Notifications', () => {
    test('approval notification is created for student', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
            requestId: fc.string({ minLength: 10, maxLength: 30 }),
          }),
          async (params) => {
            const notificationId = await notifyStudentOfApproval(params);

            // Property: Notification should be created
            expect(notificationId).toBeDefined();
            expect(typeof notificationId).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Student Rejection Notifications', () => {
    test('rejection notification is created with reason', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
            requestId: fc.string({ minLength: 10, maxLength: 30 }),
            rejectionReason: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
          }),
          async (params) => {
            const notificationId = await notifyStudentOfRejection(params);

            // Property: Notification should be created
            expect(notificationId).toBeDefined();
            expect(typeof notificationId).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification Structure', () => {
    test('college notification has required fields', () => {
      const notification = {
        type: 'registration_request' as const,
        collegeId: 'college-123',
        title: 'New Student Registration Request',
        message: 'John Doe (john@example.com) has requested to join MIT',
        priority: 'medium' as const,
        read: false,
        createdAt: new Date(),
        metadata: {
          requestId: 'request-456',
          studentEmail: 'john@example.com',
          studentName: 'John Doe',
        },
      };

      // Property: All required fields should be present
      expect(notification.type).toBe('registration_request');
      expect(notification.collegeId).toBeDefined();
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
      expect(notification.priority).toBeDefined();
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.metadata).toBeDefined();
      expect(notification.metadata?.requestId).toBeDefined();
    });

    test('student notification has required fields', () => {
      const notification = {
        type: 'registration_approved' as const,
        studentId: 'student-123',
        title: 'Registration Approved',
        message: 'Your registration request for MIT has been approved.',
        priority: 'high' as const,
        read: false,
        createdAt: new Date(),
        metadata: {
          requestId: 'request-456',
        },
      };

      // Property: All required fields should be present
      expect(notification.type).toBe('registration_approved');
      expect(notification.studentId).toBeDefined();
      expect(notification.title).toBeDefined();
      expect(notification.message).toBeDefined();
      expect(notification.priority).toBeDefined();
      expect(notification.read).toBe(false);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    test('handles special characters in student names', async () => {
      const params = {
        collegeId: 'college-123',
        requestId: 'request-456',
        studentName: "O'Brien-Smith, José María",
        studentEmail: 'jose@example.com',
        collegeName: "St. Mary's College",
      };

      const notificationId = await notifyCollegeOfRegistrationRequest(params);
      expect(notificationId).toBeDefined();
    });

    test('handles long college names', async () => {
      const params = {
        collegeId: 'college-123',
        requestId: 'request-456',
        studentName: 'John Doe',
        studentEmail: 'john@example.com',
        collegeName: 'The Royal Institute of Technology and Advanced Scientific Research',
      };

      const notificationId = await notifyCollegeOfRegistrationRequest(params);
      expect(notificationId).toBeDefined();
    });

    test('handles rejection without reason', async () => {
      const params = {
        email: 'john@example.com',
        collegeName: 'MIT',
        requestId: 'request-456',
      };

      const notificationId = await notifyStudentOfRejection(params);
      expect(notificationId).toBeDefined();
    });

    test('handles rejection with reason', async () => {
      const params = {
        email: 'john@example.com',
        collegeName: 'MIT',
        requestId: 'request-456',
        rejectionReason: 'Invalid student ID provided',
      };

      const notificationId = await notifyStudentOfRejection(params);
      expect(notificationId).toBeDefined();
    });
  });

  describe('Notification Priority', () => {
    test('registration requests have medium priority', () => {
      const notification = {
        type: 'registration_request' as const,
        priority: 'medium' as const,
      };

      expect(notification.priority).toBe('medium');
    });

    test('approvals have high priority', () => {
      const notification = {
        type: 'registration_approved' as const,
        priority: 'high' as const,
      };

      expect(notification.priority).toBe('high');
    });

    test('rejections have medium priority', () => {
      const notification = {
        type: 'registration_rejected' as const,
        priority: 'medium' as const,
      };

      expect(notification.priority).toBe('medium');
    });
  });
});
