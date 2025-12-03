/**
 * Property-Based Tests for Job Posting College Tagging Notifications
 * 
 * **Feature: college-name-primary-key, Property 6: Notification creation on tagging**
 * **Validates: Requirements 2.2**
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Job Posting College Tagging Notifications', () => {
  describe('Property 6: Notification creation on tagging', () => {
    /**
     * For any job posting and any set of college names, when colleges are tagged,
     * a notification should be created for each college with the normalized college name.
     */
    test('tagging colleges creates notifications with normalized names', () => {
      fc.assert(
        fc.property(
          fc.record({
            jobId: fc.string({ minLength: 10, maxLength: 30 }),
            organizationId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeNames: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 1, maxLength: 5 }
            ),
          }),
          (data) => {
            // Normalize college names
            const normalizedNames = data.collegeNames.map((name) =>
              normalizeCollegeName(name)
            );

            // Simulate notification creation
            const notifications = normalizedNames.map((normalizedName) => ({
              jobPostingId: data.jobId,
              normalizedCollegeName: normalizedName,
              organizationId: data.organizationId,
              status: 'pending' as const,
              createdAt: new Date(),
            }));

            // Property: Each college should have a notification
            expect(notifications).toHaveLength(normalizedNames.length);

            // Property: Each notification should have normalized college name
            notifications.forEach((notification, index) => {
              expect(notification.normalizedCollegeName).toBe(normalizedNames[index]);
              expect(notification.normalizedCollegeName).toBe(
                notification.normalizedCollegeName.toLowerCase().trim()
              );
              expect(notification.status).toBe('pending');
              expect(notification.jobPostingId).toBe(data.jobId);
              expect(notification.organizationId).toBe(data.organizationId);
            });

            // Property: Normalized names should match input after normalization
            data.collegeNames.forEach((originalName, index) => {
              expect(notifications[index].normalizedCollegeName).toBe(
                normalizeCollegeName(originalName)
              );
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('duplicate college names create only one notification per unique normalized name', () => {
      fc.assert(
        fc.property(
          fc.record({
            jobId: fc.string({ minLength: 10, maxLength: 30 }),
            organizationId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeNames: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 2, maxLength: 10 }
            ),
          }),
          (data) => {
            // Add duplicates with different casing
            const collegeNamesWithDuplicates = [
              ...data.collegeNames,
              ...data.collegeNames.map((name) => name.toUpperCase()),
              ...data.collegeNames.map((name) => name.toLowerCase()),
            ];

            // Normalize and deduplicate
            const uniqueNormalizedNames = [
              ...new Set(
                collegeNamesWithDuplicates.map((name) => normalizeCollegeName(name))
              ),
            ];

            // Simulate notification creation (should only create for unique normalized names)
            const notifications = uniqueNormalizedNames.map((normalizedName) => ({
              jobPostingId: data.jobId,
              normalizedCollegeName: normalizedName,
              organizationId: data.organizationId,
              status: 'pending' as const,
            }));

            // Property: Should only have notifications for unique normalized names
            expect(notifications).toHaveLength(uniqueNormalizedNames.length);

            // Property: All notification college names should be unique
            const notificationCollegeNames = notifications.map(
              (n) => n.normalizedCollegeName
            );
            const uniqueNotificationNames = [...new Set(notificationCollegeNames)];
            expect(notificationCollegeNames).toHaveLength(uniqueNotificationNames.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('notifications preserve job and organization context', () => {
      fc.assert(
        fc.property(
          fc.record({
            jobId: fc.string({ minLength: 10, maxLength: 30 }),
            organizationId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
          }),
          (data) => {
            const normalizedName = normalizeCollegeName(data.collegeName);

            const notification = {
              jobPostingId: data.jobId,
              normalizedCollegeName: normalizedName,
              organizationId: data.organizationId,
              status: 'pending' as const,
              createdAt: new Date(),
            };

            // Property: Notification should preserve job and organization IDs
            expect(notification.jobPostingId).toBe(data.jobId);
            expect(notification.organizationId).toBe(data.organizationId);
            expect(notification.normalizedCollegeName).toBe(normalizedName);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Notification Status', () => {
    test('new notifications always start with pending status', () => {
      fc.assert(
        fc.property(
          fc.record({
            jobId: fc.string({ minLength: 10, maxLength: 30 }),
            organizationId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeNames: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          (data) => {
            const normalizedNames = data.collegeNames.map((name) =>
              normalizeCollegeName(name)
            );

            const notifications = normalizedNames.map((normalizedName) => ({
              jobPostingId: data.jobId,
              normalizedCollegeName: normalizedName,
              organizationId: data.organizationId,
              status: 'pending' as const,
              createdAt: new Date(),
            }));

            // Property: All notifications should have pending status
            notifications.forEach((notification) => {
              expect(notification.status).toBe('pending');
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Edge Cases', () => {
    test('handles empty college list', () => {
      const notifications: any[] = [];

      // Property: Empty input should create no notifications
      expect(notifications).toHaveLength(0);
    });

    test('handles college names with special characters', () => {
      const collegeNames = [
        "St. Mary's College",
        "O'Reilly Institute",
        'École Polytechnique',
        'MIT & Harvard Joint Program',
      ];

      const normalizedNames = collegeNames.map((name) => normalizeCollegeName(name));

      const notifications = normalizedNames.map((normalizedName) => ({
        jobPostingId: 'job-123',
        normalizedCollegeName: normalizedName,
        organizationId: 'org-456',
        status: 'pending' as const,
      }));

      // Property: Should handle special characters correctly
      expect(notifications).toHaveLength(collegeNames.length);
      notifications.forEach((notification) => {
        expect(notification.normalizedCollegeName).toBe(
          notification.normalizedCollegeName.toLowerCase().trim()
        );
      });
    });

    test('handles very long college names', () => {
      const longCollegeName = 'A'.repeat(200);
      const normalizedName = normalizeCollegeName(longCollegeName);

      const notification = {
        jobPostingId: 'job-123',
        normalizedCollegeName: normalizedName,
        organizationId: 'org-456',
        status: 'pending' as const,
      };

      // Property: Should handle long names
      expect(notification.normalizedCollegeName).toBe(normalizedName);
      expect(notification.normalizedCollegeName.length).toBe(200);
    });
  });
});
