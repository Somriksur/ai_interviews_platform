/**
 * Property-Based Tests for Job Posting with Tagged Colleges
 * 
 * Tests job posting model with normalized college names
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import {
  createJobPosting,
  tagCollegesForJob,
  updateCollegeApproval,
  getCollegesByStatus,
  hasCollegeApproved,
  JobPosting,
} from '../job-posting';

// Helper to create a complete JobPosting for testing
function createTestJobPosting(partial: Partial<JobPosting> = {}): JobPosting {
  const base = createJobPosting({
    title: partial.title || 'Test Job',
    description: partial.description || 'Test Description',
    organizationId: partial.organizationId || 'org-123',
  });

  return {
    id: partial.id || 'job-123',
    ...base,
    createdAt: partial.createdAt || new Date(),
    updatedAt: partial.updatedAt || new Date(),
    ...partial,
  };
}

describe('Job Posting with Tagged Colleges', () => {
  describe('Property 7: Tagged college storage normalization', () => {
    /**
     * **Feature: college-name-primary-key, Property 7: Tagged college storage normalization**
     * **Validates: Requirements 2.3**
     * 
     * For any job posting with tagged colleges, all college names in the 
     * taggedColleges array should be in normalized form.
     */
    test('tagged colleges are stored in normalized form', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 100 }),
            description: fc.string({ minLength: 10, maxLength: 500 }),
            organizationId: fc.string({ minLength: 10, maxLength: 30 }),
            collegeNames: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          (data) => {
            // Create job posting
            const jobPosting = createTestJobPosting({
              title: data.title,
              description: data.description,
              organizationId: data.organizationId,
            });

            // Normalize college names
            const normalizedNames = data.collegeNames.map((name) =>
              normalizeCollegeName(name)
            );

            // Tag colleges
            const updatedJob = tagCollegesForJob(jobPosting, normalizedNames);

            // Property: All tagged colleges should be in normalized form
            updatedJob.taggedColleges.forEach((collegeName) => {
              expect(collegeName).toBe(collegeName.toLowerCase().trim());
              expect(normalizeCollegeName(collegeName)).toBe(collegeName);
            });

            // Property: Tagged colleges should match normalized input
            normalizedNames.forEach((normalizedName) => {
              expect(updatedJob.taggedColleges).toContain(normalizedName);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('tagged colleges array contains no duplicates', () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 3, maxLength: 100 }), {
            minLength: 1,
            maxLength: 10,
          }),
          (collegeNames) => {
            const jobPosting = createTestJobPosting();

            const normalizedNames = collegeNames.map((name) =>
              normalizeCollegeName(name)
            );

            const updatedJob = tagCollegesForJob(jobPosting, normalizedNames);

            // Property: No duplicates in taggedColleges array
            const uniqueColleges = [...new Set(updatedJob.taggedColleges)];
            expect(updatedJob.taggedColleges).toHaveLength(uniqueColleges.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Job Posting Creation', () => {
    test('creates job posting with empty tagged colleges', () => {
      const jobPosting = createTestJobPosting({
        title: 'Software Engineer',
        description: 'Looking for a software engineer',
        organizationId: 'org-123',
      });

      expect(jobPosting.taggedColleges).toEqual([]);
      expect(jobPosting.collegeApprovals).toEqual({});
    });

    test('creates job posting with all fields', () => {
      const jobPosting = createTestJobPosting({
        title: 'Software Engineer',
        description: 'Looking for a software engineer',
        organizationId: 'org-123',
        requirements: ['Bachelor degree', '2 years experience'],
        skills: ['JavaScript', 'React'],
        location: 'San Francisco',
        salary: { min: 80000, max: 120000, currency: 'USD' },
        minimumScore: 70,
        status: 'active',
      });

      expect(jobPosting.title).toBe('Software Engineer');
      expect(jobPosting.requirements).toHaveLength(2);
      expect(jobPosting.skills).toHaveLength(2);
      expect(jobPosting.minimumScore).toBe(70);
      expect(jobPosting.status).toBe('active');
    });
  });

  describe('College Tagging', () => {
    test('tags colleges and initializes approval status', () => {
      const jobPosting = createTestJobPosting();

      const collegeNames = ['mit', 'stanford', 'harvard'];
      const updatedJob = tagCollegesForJob(jobPosting, collegeNames);

      expect(updatedJob.taggedColleges).toHaveLength(3);
      expect(updatedJob.taggedColleges).toContain('mit');
      expect(updatedJob.taggedColleges).toContain('stanford');
      expect(updatedJob.taggedColleges).toContain('harvard');

      // Check approval status initialized
      expect(updatedJob.collegeApprovals['mit'].status).toBe('pending');
      expect(updatedJob.collegeApprovals['stanford'].status).toBe('pending');
      expect(updatedJob.collegeApprovals['harvard'].status).toBe('pending');
    });

    test('handles duplicate college names', () => {
      const jobPosting = createTestJobPosting();

      const collegeNames = ['mit', 'mit', 'stanford', 'mit'];
      const updatedJob = tagCollegesForJob(jobPosting, collegeNames);

      // Should only have unique colleges
      expect(updatedJob.taggedColleges).toHaveLength(2);
      expect(updatedJob.taggedColleges).toContain('mit');
      expect(updatedJob.taggedColleges).toContain('stanford');
    });

    test('preserves existing tagged colleges when adding new ones', () => {
      let jobPosting = createTestJobPosting();

      jobPosting = tagCollegesForJob(jobPosting, ['mit', 'stanford']);
      jobPosting = tagCollegesForJob(jobPosting, ['harvard', 'yale']);

      expect(jobPosting.taggedColleges).toHaveLength(4);
      expect(jobPosting.taggedColleges).toContain('mit');
      expect(jobPosting.taggedColleges).toContain('stanford');
      expect(jobPosting.taggedColleges).toContain('harvard');
      expect(jobPosting.taggedColleges).toContain('yale');
    });
  });

  describe('College Approval Management', () => {
    test('updates college approval status', () => {
      let jobPosting = createTestJobPosting();

      jobPosting = tagCollegesForJob(jobPosting, ['mit', 'stanford']);
      jobPosting = updateCollegeApproval(jobPosting, 'mit', 'approved', 'Looks good');

      expect(jobPosting.collegeApprovals['mit'].status).toBe('approved');
      expect(jobPosting.collegeApprovals['mit'].notes).toBe('Looks good');
      expect(jobPosting.collegeApprovals['mit'].respondedAt).toBeInstanceOf(Date);
      expect(jobPosting.collegeApprovals['stanford'].status).toBe('pending');
    });

    test('throws error when updating approval for non-tagged college', () => {
      const jobPosting = createTestJobPosting();

      expect(() => {
        updateCollegeApproval(jobPosting, 'mit', 'approved');
      }).toThrow('College is not tagged for this job posting');
    });

    test('gets colleges by approval status', () => {
      let jobPosting = createTestJobPosting();

      jobPosting = tagCollegesForJob(jobPosting, ['mit', 'stanford', 'harvard']);
      jobPosting = updateCollegeApproval(jobPosting, 'mit', 'approved');
      jobPosting = updateCollegeApproval(jobPosting, 'stanford', 'rejected');

      const pending = getCollegesByStatus(jobPosting, 'pending');
      const approved = getCollegesByStatus(jobPosting, 'approved');
      const rejected = getCollegesByStatus(jobPosting, 'rejected');

      expect(pending).toEqual(['harvard']);
      expect(approved).toEqual(['mit']);
      expect(rejected).toEqual(['stanford']);
    });

    test('checks if college has approved', () => {
      let jobPosting = createTestJobPosting();

      jobPosting = tagCollegesForJob(jobPosting, ['mit', 'stanford']);
      jobPosting = updateCollegeApproval(jobPosting, 'mit', 'approved');

      expect(hasCollegeApproved(jobPosting, 'mit')).toBe(true);
      expect(hasCollegeApproved(jobPosting, 'stanford')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles college names with various casings', () => {
      const jobPosting = createTestJobPosting();

      const collegeNames = ['MIT', 'mit', 'MiT'].map((name) =>
        normalizeCollegeName(name)
      );

      const updatedJob = tagCollegesForJob(jobPosting, collegeNames);

      // All should normalize to 'mit', so only one entry
      expect(updatedJob.taggedColleges).toHaveLength(1);
      expect(updatedJob.taggedColleges[0]).toBe('mit');
    });

    test('handles empty college list', () => {
      const jobPosting = createTestJobPosting();

      const updatedJob = tagCollegesForJob(jobPosting, []);

      expect(updatedJob.taggedColleges).toEqual([]);
      expect(updatedJob.collegeApprovals).toEqual({});
    });

    test('handles college names with special characters', () => {
      const jobPosting = createTestJobPosting();

      const collegeNames = [
        "st. mary's college",
        "o'reilly institute",
        'école polytechnique',
      ];

      const updatedJob = tagCollegesForJob(jobPosting, collegeNames);

      expect(updatedJob.taggedColleges).toHaveLength(3);
      collegeNames.forEach((name) => {
        expect(updatedJob.taggedColleges).toContain(name);
      });
    });
  });
});
