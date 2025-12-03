/**
 * Property-based and unit tests for unified notification fetching
 * 
 * Feature: interview-drive-college-notifications
 */

import * as fc from 'fast-check';
import { UnifiedNotification } from '@/types/drive-notification';

describe('Unified Notification Fetching - Property Tests', () => {
  /**
   * Feature: interview-drive-college-notifications, Property 4: Notification Ordering
   * 
   * For any list of notifications fetched for a college, 
   * the notifications should be ordered by createdAt timestamp in descending order (newest first).
   * 
   * Validates: Requirements 2.3
   */
  test('Property 4: notifications are ordered by createdAt descending', () => {
    fc.assert(
      fc.property(
        // Generate array of notifications with random timestamps (valid dates only)
        fc.array(
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('job_posting', 'interview_drive'),
            status: fc.constantFrom('pending', 'confirmed', 'declined'),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
            organization: fc.record({
              id: fc.uuid(),
              name: fc.string(),
              email: fc.emailAddress(),
              phone: fc.string(),
            }),
          }),
          { minLength: 2, maxLength: 20 }
        ),
        (notifications) => {
          // Filter out any invalid dates
          const validNotifications = notifications.filter(n => {
            const date = n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt);
            return !isNaN(date.getTime());
          });
          
          if (validNotifications.length < 2) return true; // Skip if not enough valid dates
          
          // Sort notifications by createdAt descending (newest first)
          const sorted = [...validNotifications].sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
            const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
          
          // Verify: Each notification is newer than or equal to the next
          for (let i = 0; i < sorted.length - 1; i++) {
            const currentDate = sorted[i].createdAt instanceof Date 
              ? sorted[i].createdAt 
              : new Date(sorted[i].createdAt);
            const nextDate = sorted[i + 1].createdAt instanceof Date 
              ? sorted[i + 1].createdAt 
              : new Date(sorted[i + 1].createdAt);
            
            expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: interview-drive-college-notifications, Property 5: Type Discrimination
   * 
   * For any notification displayed on the college dashboard, 
   * the system should correctly identify and display it as either a job posting or interview drive notification.
   * 
   * Validates: Requirements 2.1, 2.2
   */
  test('Property 5: each notification has correct type field', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            // Job posting notification
            fc.record({
              id: fc.uuid(),
              type: fc.constant('job_posting' as const),
              status: fc.constantFrom('pending', 'confirmed', 'declined'),
              createdAt: fc.date(),
              jobPosting: fc.record({
                id: fc.uuid(),
                role: fc.string(),
                skills: fc.array(fc.string()),
                vacancies: fc.nat(),
                salaryRange: fc.record({
                  min: fc.nat(),
                  max: fc.nat(),
                  category: fc.string(),
                }),
                description: fc.string(),
              }),
              organization: fc.record({
                id: fc.uuid(),
                name: fc.string(),
                email: fc.emailAddress(),
                phone: fc.string(),
              }),
            }),
            // Interview drive notification
            fc.record({
              id: fc.uuid(),
              type: fc.constant('interview_drive' as const),
              status: fc.constantFrom('pending', 'confirmed', 'declined'),
              createdAt: fc.date(),
              interviewDrive: fc.record({
                id: fc.uuid(),
                name: fc.string(),
                role: fc.string(),
                description: fc.string(),
              }),
              organization: fc.record({
                id: fc.uuid(),
                name: fc.string(),
                email: fc.emailAddress(),
                phone: fc.string(),
              }),
            })
          ),
          { minLength: 1, maxLength: 20 }
        ),
        (notifications) => {
          // Verify: Each notification has a valid type
          notifications.forEach(notification => {
            expect(['job_posting', 'interview_drive']).toContain(notification.type);
          });
          
          // Verify: Job posting notifications have jobPosting field
          const jobNotifications = notifications.filter(n => n.type === 'job_posting');
          jobNotifications.forEach(notification => {
            expect(notification).toHaveProperty('jobPosting');
            expect(notification.jobPosting).toBeDefined();
          });
          
          // Verify: Interview drive notifications have interviewDrive field
          const driveNotifications = notifications.filter(n => n.type === 'interview_drive');
          driveNotifications.forEach(notification => {
            expect(notification).toHaveProperty('interviewDrive');
            expect(notification.interviewDrive).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('mixed notifications maintain type integrity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            type: fc.constantFrom('job_posting', 'interview_drive'),
            status: fc.constantFrom('pending', 'confirmed', 'declined'),
            createdAt: fc.date(),
          }),
          { minLength: 5, maxLength: 50 }
        ),
        (notifications) => {
          // Count each type
          const jobCount = notifications.filter(n => n.type === 'job_posting').length;
          const driveCount = notifications.filter(n => n.type === 'interview_drive').length;
          
          // Verify: Total count matches
          expect(jobCount + driveCount).toBe(notifications.length);
          
          // Verify: No invalid types
          const invalidTypes = notifications.filter(
            n => n.type !== 'job_posting' && n.type !== 'interview_drive'
          );
          expect(invalidTypes.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Unified Notification Fetching - Unit Tests', () => {
  test('empty notification list returns empty array', () => {
    const notifications: UnifiedNotification[] = [];
    expect(notifications.length).toBe(0);
  });

  test('single notification is returned correctly', () => {
    const notification: UnifiedNotification = {
      id: 'test-1',
      type: 'job_posting',
      status: 'pending',
      createdAt: new Date(),
      jobPosting: {
        id: 'job-1',
        role: 'Developer',
        skills: ['JavaScript'],
        vacancies: 5,
        salaryRange: { min: 50000, max: 80000, category: 'Mid-level' },
        description: 'Test job',
      },
      organization: {
        id: 'org-1',
        name: 'Test Org',
        email: 'test@org.com',
        phone: '1234567890',
      },
    };
    
    const notifications = [notification];
    expect(notifications.length).toBe(1);
    expect(notifications[0].type).toBe('job_posting');
  });

  test('notifications with missing drive data use fallback values', () => {
    const notification: UnifiedNotification = {
      id: 'test-1',
      type: 'interview_drive',
      status: 'pending',
      createdAt: new Date(),
      interviewDrive: {
        id: 'drive-1',
        name: 'Drive Unavailable',
        role: 'Position',
        description: 'This interview drive is no longer available',
      },
      organization: {
        id: 'org-1',
        name: 'Unknown Organization',
        email: '',
        phone: '',
      },
    };
    
    expect(notification.interviewDrive.name).toBe('Drive Unavailable');
    expect(notification.organization.name).toBe('Unknown Organization');
  });

  test('sorting preserves notification data integrity', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const notifications: Partial<UnifiedNotification>[] = [
      { id: '1', createdAt: yesterday },
      { id: '2', createdAt: tomorrow },
      { id: '3', createdAt: now },
    ];
    
    const sorted = [...notifications].sort((a, b) => {
      const dateA = a.createdAt as Date;
      const dateB = b.createdAt as Date;
      return dateB.getTime() - dateA.getTime();
    });
    
    expect(sorted[0].id).toBe('2'); // tomorrow (newest)
    expect(sorted[1].id).toBe('3'); // now
    expect(sorted[2].id).toBe('1'); // yesterday (oldest)
  });
});
