/**
 * Tests for Job Notification System
 * 
 * Tests the job notification creation, fetching, and response workflow
 */

import {
  JobNotification,
  createJobNotification,
  updateJobNotificationStatus,
  isNotificationPending,
  isNotificationApproved,
  isNotificationRejected,
  isValidJobNotificationAction,
  actionToJobNotificationStatus,
} from '@/types/job-notification';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Job Notification System', () => {
  describe('Job Notification Creation', () => {
    test('creates job notification with normalized college name', () => {
      const notification = createJobNotification({
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
      });

      expect(notification.jobPostingId).toBe('job-123');
      expect(notification.collegeId).toBe('college-456');
      expect(notification.normalizedCollegeName).toBe('mit');
      expect(notification.organizationId).toBe('org-789');
      expect(notification.status).toBe('pending');
      expect(notification.type).toBe('job_posting');
      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.respondedAt).toBeNull();
    });

    test('normalizes college name before creating notification', () => {
      const collegeName = 'Massachusetts Institute of Technology';
      const normalizedName = normalizeCollegeName(collegeName);

      const notification = createJobNotification({
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: normalizedName,
        organizationId: 'org-789',
      });

      expect(notification.normalizedCollegeName).toBe(
        'massachusetts institute of technology'
      );
      expect(notification.normalizedCollegeName).toBe(normalizedName);
    });

    test('handles college names with different casings', () => {
      const names = ['MIT', 'mit', 'MiT', 'mIt'];
      const normalizedNames = names.map((name) => normalizeCollegeName(name));

      // All should normalize to the same value
      const uniqueNames = [...new Set(normalizedNames)];
      expect(uniqueNames).toHaveLength(1);
      expect(uniqueNames[0]).toBe('mit');
    });
  });

  describe('Job Notification Status Updates', () => {
    test('updates notification to approved status', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'pending',
        type: 'job_posting',
        createdAt: new Date(),
      };

      const updated = updateJobNotificationStatus(notification, 'approved', 'Looks good');

      expect(updated.status).toBe('approved');
      expect(updated.respondedAt).toBeInstanceOf(Date);
      expect(updated.notes).toBe('Looks good');
    });

    test('updates notification to rejected status', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'pending',
        type: 'job_posting',
        createdAt: new Date(),
      };

      const updated = updateJobNotificationStatus(
        notification,
        'rejected',
        'Not suitable'
      );

      expect(updated.status).toBe('rejected');
      expect(updated.respondedAt).toBeInstanceOf(Date);
      expect(updated.notes).toBe('Not suitable');
    });

    test('updates notification without notes', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'pending',
        type: 'job_posting',
        createdAt: new Date(),
      };

      const updated = updateJobNotificationStatus(notification, 'approved');

      expect(updated.status).toBe('approved');
      expect(updated.respondedAt).toBeInstanceOf(Date);
      expect(updated.notes).toBeUndefined();
    });
  });

  describe('Job Notification Status Checks', () => {
    test('identifies pending notifications', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'pending',
        type: 'job_posting',
        createdAt: new Date(),
      };

      expect(isNotificationPending(notification)).toBe(true);
      expect(isNotificationApproved(notification)).toBe(false);
      expect(isNotificationRejected(notification)).toBe(false);
    });

    test('identifies approved notifications', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'approved',
        type: 'job_posting',
        createdAt: new Date(),
        respondedAt: new Date(),
      };

      expect(isNotificationPending(notification)).toBe(false);
      expect(isNotificationApproved(notification)).toBe(true);
      expect(isNotificationRejected(notification)).toBe(false);
    });

    test('identifies rejected notifications', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'rejected',
        type: 'job_posting',
        createdAt: new Date(),
        respondedAt: new Date(),
      };

      expect(isNotificationPending(notification)).toBe(false);
      expect(isNotificationApproved(notification)).toBe(false);
      expect(isNotificationRejected(notification)).toBe(true);
    });
  });

  describe('Job Notification Actions', () => {
    test('validates approve action', () => {
      expect(isValidJobNotificationAction('approve')).toBe(true);
    });

    test('validates reject action', () => {
      expect(isValidJobNotificationAction('reject')).toBe(true);
    });

    test('rejects invalid actions', () => {
      expect(isValidJobNotificationAction('confirm')).toBe(false);
      expect(isValidJobNotificationAction('decline')).toBe(false);
      expect(isValidJobNotificationAction('invalid')).toBe(false);
      expect(isValidJobNotificationAction('')).toBe(false);
    });

    test('converts approve action to approved status', () => {
      expect(actionToJobNotificationStatus('approve')).toBe('approved');
    });

    test('converts reject action to rejected status', () => {
      expect(actionToJobNotificationStatus('reject')).toBe('rejected');
    });
  });

  describe('Notification Workflow', () => {
    test('complete notification lifecycle', () => {
      // Create notification
      const notification = createJobNotification({
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'stanford',
        organizationId: 'org-789',
      });

      expect(isNotificationPending(notification as JobNotification)).toBe(true);

      // Approve notification
      const approved = updateJobNotificationStatus(
        { ...notification, id: 'notif-123' },
        'approved',
        'Great opportunity'
      );

      expect(isNotificationApproved(approved)).toBe(true);
      expect(approved.notes).toBe('Great opportunity');
      expect(approved.respondedAt).toBeInstanceOf(Date);
    });

    test('notification can be rejected after creation', () => {
      // Create notification
      const notification = createJobNotification({
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'harvard',
        organizationId: 'org-789',
      });

      // Reject notification
      const rejected = updateJobNotificationStatus(
        { ...notification, id: 'notif-123' },
        'rejected',
        'Not aligned with our programs'
      );

      expect(isNotificationRejected(rejected)).toBe(true);
      expect(rejected.notes).toBe('Not aligned with our programs');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty college name normalization', () => {
      const normalizedName = normalizeCollegeName('');
      expect(normalizedName).toBe('');
    });

    test('handles college names with special characters', () => {
      const names = [
        "St. Mary's College",
        "O'Reilly Institute",
        'École Polytechnique',
      ];

      names.forEach((name) => {
        const normalized = normalizeCollegeName(name);
        expect(normalized).toBe(name.toLowerCase().trim());
      });
    });

    test('handles very long college names', () => {
      const longName = 'A'.repeat(200);
      const normalized = normalizeCollegeName(longName);
      expect(normalized).toBe(longName.toLowerCase());
      expect(normalized.length).toBe(200);
    });

    test('preserves notification data integrity through updates', () => {
      const notification: JobNotification = {
        id: 'notif-123',
        jobPostingId: 'job-123',
        collegeId: 'college-456',
        normalizedCollegeName: 'mit',
        organizationId: 'org-789',
        status: 'pending',
        type: 'job_posting',
        createdAt: new Date(),
      };

      const updated = updateJobNotificationStatus(notification, 'approved');

      // Original fields should be preserved
      expect(updated.id).toBe(notification.id);
      expect(updated.jobPostingId).toBe(notification.jobPostingId);
      expect(updated.collegeId).toBe(notification.collegeId);
      expect(updated.normalizedCollegeName).toBe(notification.normalizedCollegeName);
      expect(updated.organizationId).toBe(notification.organizationId);
      expect(updated.type).toBe(notification.type);
      expect(updated.createdAt).toBe(notification.createdAt);
    });
  });

  describe('Notification Filtering', () => {
    test('filters notifications by status', () => {
      const notifications: JobNotification[] = [
        {
          id: '1',
          jobPostingId: 'job-1',
          collegeId: 'college-1',
          normalizedCollegeName: 'mit',
          organizationId: 'org-1',
          status: 'pending',
          type: 'job_posting',
          createdAt: new Date(),
        },
        {
          id: '2',
          jobPostingId: 'job-2',
          collegeId: 'college-1',
          normalizedCollegeName: 'mit',
          organizationId: 'org-1',
          status: 'approved',
          type: 'job_posting',
          createdAt: new Date(),
          respondedAt: new Date(),
        },
        {
          id: '3',
          jobPostingId: 'job-3',
          collegeId: 'college-1',
          normalizedCollegeName: 'mit',
          organizationId: 'org-1',
          status: 'rejected',
          type: 'job_posting',
          createdAt: new Date(),
          respondedAt: new Date(),
        },
      ];

      const pending = notifications.filter(isNotificationPending);
      const approved = notifications.filter(isNotificationApproved);
      const rejected = notifications.filter(isNotificationRejected);

      expect(pending).toHaveLength(1);
      expect(approved).toHaveLength(1);
      expect(rejected).toHaveLength(1);
    });

    test('filters notifications by college', () => {
      const notifications: JobNotification[] = [
        {
          id: '1',
          jobPostingId: 'job-1',
          collegeId: 'college-1',
          normalizedCollegeName: 'mit',
          organizationId: 'org-1',
          status: 'pending',
          type: 'job_posting',
          createdAt: new Date(),
        },
        {
          id: '2',
          jobPostingId: 'job-2',
          collegeId: 'college-2',
          normalizedCollegeName: 'stanford',
          organizationId: 'org-1',
          status: 'pending',
          type: 'job_posting',
          createdAt: new Date(),
        },
      ];

      const mitNotifications = notifications.filter(
        (n) => n.normalizedCollegeName === 'mit'
      );
      const stanfordNotifications = notifications.filter(
        (n) => n.normalizedCollegeName === 'stanford'
      );

      expect(mitNotifications).toHaveLength(1);
      expect(stanfordNotifications).toHaveLength(1);
    });
  });
});
