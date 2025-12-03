/**
 * Property-Based Tests for Interview Drive with College Associations
 * 
 * **Feature: college-name-primary-key, Property 20: Report grouping by normalized name**
 * **Validates: Requirements 6.4**
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import {
  createInterviewDrive,
  tagCollegesForDrive,
  tagStudentForDrive,
  getStudentsByCollege,
  getCollegesWithStudents,
  getCollegeStats,
  updateInterviewCompletion,
  isStudentTagged,
  isCollegeTagged,
  InterviewDrive,
} from '../campus';

// Helper to create a complete InterviewDrive for testing
function createTestInterviewDrive(
  partial: Partial<InterviewDrive> = {}
): InterviewDrive {
  const base = createInterviewDrive({
    name: partial.name || 'Test Drive',
    description: partial.description || 'Test Description',
    role: partial.role || 'Software Engineer',
    organizationId: partial.organizationId || 'org-123',
    status: partial.status,
  });

  return {
    id: partial.id || 'drive-123',
    createdAt: partial.createdAt || new Date(),
    ...base,
    ...partial,
  };
}

describe('Interview Drive with College Associations', () => {
  describe('Property 20: Report grouping by normalized name', () => {
    /**
     * For any interview drive with tagged students from multiple colleges,
     * the stats should be grouped by normalized college name, allowing
     * accurate reporting per college.
     */
    test('stats are grouped by normalized college name', () => {
      fc.assert(
        fc.property(
          fc.record({
            driveName: fc.string({ minLength: 5, maxLength: 100 }),
            collegeNames: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 2, maxLength: 5 }
            ),
          }),
          (data) => {
            // Create interview drive
            let drive = createTestInterviewDrive({
              name: data.driveName,
              description: 'Test drive',
              role: 'Software Engineer',
              organizationId: 'org-123',
            });

            // Normalize college names and filter out empty/invalid ones
            const normalizedNames = data.collegeNames
              .map((name) => normalizeCollegeName(name))
              .filter((name) => name.length > 0 && name !== 'constructor');

            if (normalizedNames.length === 0) return; // Skip if no valid names

            // Tag colleges
            drive = tagCollegesForDrive(drive, normalizedNames);

            // Property: Each college should have stats initialized
            normalizedNames.forEach((normalizedName) => {
              expect(drive.stats.byCollege[normalizedName]).toBeDefined();
              expect(drive.stats.byCollege[normalizedName].totalStudents).toBe(0);
              expect(drive.stats.byCollege[normalizedName].completedInterviews).toBe(0);
              expect(drive.stats.byCollege[normalizedName].averageScore).toBe(0);
            });

            // Property: Stats keys should be normalized
            Object.keys(drive.stats.byCollege).forEach((key) => {
              expect(key).toBe(key.toLowerCase().trim());
              expect(normalizeCollegeName(key)).toBe(key);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    test('student tagging updates college-specific stats', () => {
      fc.assert(
        fc.property(
          fc.record({
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
            studentIds: fc.array(
              fc.string({ minLength: 10, maxLength: 30 }),
              { minLength: 1, maxLength: 10 }
            ),
          }),
          (data) => {
            const normalizedName = normalizeCollegeName(data.collegeName);

            // Skip invalid college names
            if (!normalizedName || normalizedName === 'constructor') return;

            // Create and setup drive
            let drive = createTestInterviewDrive({
              name: 'Test Drive',
              description: 'Test',
              role: 'Engineer',
              organizationId: 'org-123',
            });

            drive = tagCollegesForDrive(drive, [normalizedName]);

            // Tag students
            data.studentIds.forEach((studentId) => {
              drive = tagStudentForDrive(drive, studentId, normalizedName);
            });

            // Property: College stats should reflect tagged students
            const collegeStats = drive.stats.byCollege[normalizedName];
            expect(collegeStats.totalStudents).toBe(data.studentIds.length);

            // Property: Overall stats should match
            expect(drive.stats.totalStudents).toBe(data.studentIds.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('stats grouping handles multiple colleges', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              collegeName: fc.string({ minLength: 3, maxLength: 100 }),
              studentCount: fc.integer({ min: 1, max: 10 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          (colleges) => {
            // Create drive
            let drive = createTestInterviewDrive({
              name: 'Multi-College Drive',
              description: 'Test',
              role: 'Engineer',
              organizationId: 'org-123',
            });

            // Normalize and tag colleges
            const normalizedColleges = colleges
              .map((c) => ({
                ...c,
                normalizedName: normalizeCollegeName(c.collegeName),
              }))
              .filter((c) => c.normalizedName.length > 0 && c.normalizedName !== 'constructor');

            if (normalizedColleges.length === 0) return; // Skip if no valid colleges

            const uniqueColleges = Array.from(
              new Map(normalizedColleges.map((c) => [c.normalizedName, c])).values()
            );

            const collegeNames = uniqueColleges.map((c) => c.normalizedName);
            drive = tagCollegesForDrive(drive, collegeNames);

            // Tag students for each college
            uniqueColleges.forEach((college, idx) => {
              for (let i = 0; i < college.studentCount; i++) {
                drive = tagStudentForDrive(
                  drive,
                  `student-${idx}-${i}`,
                  college.normalizedName
                );
              }
            });

            // Property: Each college should have correct student count
            uniqueColleges.forEach((college) => {
              const stats = drive.stats.byCollege[college.normalizedName];
              expect(stats.totalStudents).toBe(college.studentCount);
            });

            // Property: Total students should sum correctly
            const totalExpected = uniqueColleges.reduce(
              (sum, c) => sum + c.studentCount,
              0
            );
            expect(drive.stats.totalStudents).toBe(totalExpected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Interview Drive Creation', () => {
    test('creates interview drive with empty college associations', () => {
      const drive = createTestInterviewDrive({
        name: 'Software Engineer Interview',
        description: 'Looking for software engineers',
        role: 'Software Engineer',
        organizationId: 'org-123',
      });

      expect(drive.taggedColleges).toEqual([]);
      expect(drive.taggedStudents).toEqual([]);
      expect(drive.stats.byCollege).toEqual({});
      expect(drive.stats.totalStudents).toBe(0);
    });

    test('creates interview drive with specified status', () => {
      const drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
        status: 'in-progress',
      });

      expect(drive.status).toBe('in-progress');
    });
  });

  describe('College Tagging', () => {
    test('tags colleges and initializes stats', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      const collegeNames = ['mit', 'stanford', 'harvard'];
      drive = tagCollegesForDrive(drive, collegeNames);

      expect(drive.taggedColleges).toHaveLength(3);
      collegeNames.forEach((name) => {
        expect(drive.taggedColleges).toContain(name);
        expect(drive.stats.byCollege[name]).toBeDefined();
      });
    });

    test('handles duplicate college names', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      const collegeNames = ['mit', 'mit', 'stanford', 'mit'];
      drive = tagCollegesForDrive(drive, collegeNames);

      expect(drive.taggedColleges).toHaveLength(2);
      expect(drive.taggedColleges).toContain('mit');
      expect(drive.taggedColleges).toContain('stanford');
    });

    test('preserves existing tagged colleges', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit', 'stanford']);
      drive = tagCollegesForDrive(drive, ['harvard', 'yale']);

      expect(drive.taggedColleges).toHaveLength(4);
    });
  });

  describe('Student Tagging', () => {
    test('tags student with college association', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-123', 'mit');

      expect(drive.taggedStudents).toHaveLength(1);
      expect(drive.taggedStudents[0].studentId).toBe('student-123');
      expect(drive.taggedStudents[0].normalizedCollegeName).toBe('mit');
      expect(drive.taggedStudents[0].taggedAt).toBeInstanceOf(Date);
    });

    test('throws error when tagging student for untagged college', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      expect(() => {
        tagStudentForDrive(drive, 'student-123', 'mit');
      }).toThrow('College is not tagged for this interview drive');
    });

    test('prevents duplicate student tagging', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-123', 'mit');
      drive = tagStudentForDrive(drive, 'student-123', 'mit');

      expect(drive.taggedStudents).toHaveLength(1);
    });

    test('updates stats when tagging students', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-1', 'mit');
      drive = tagStudentForDrive(drive, 'student-2', 'mit');

      expect(drive.stats.totalStudents).toBe(2);
      expect(drive.stats.byCollege['mit'].totalStudents).toBe(2);
    });
  });

  describe('Student Queries', () => {
    test('gets students by college', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit', 'stanford']);
      drive = tagStudentForDrive(drive, 'student-1', 'mit');
      drive = tagStudentForDrive(drive, 'student-2', 'mit');
      drive = tagStudentForDrive(drive, 'student-3', 'stanford');

      const mitStudents = getStudentsByCollege(drive, 'mit');
      const stanfordStudents = getStudentsByCollege(drive, 'stanford');

      expect(mitStudents).toHaveLength(2);
      expect(stanfordStudents).toHaveLength(1);
    });

    test('gets all colleges with students', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit', 'stanford', 'harvard']);
      drive = tagStudentForDrive(drive, 'student-1', 'mit');
      drive = tagStudentForDrive(drive, 'student-2', 'stanford');

      const colleges = getCollegesWithStudents(drive);

      expect(colleges).toHaveLength(2);
      expect(colleges).toContain('mit');
      expect(colleges).toContain('stanford');
      expect(colleges).not.toContain('harvard');
    });

    test('checks if student is tagged', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-123', 'mit');

      expect(isStudentTagged(drive, 'student-123')).toBe(true);
      expect(isStudentTagged(drive, 'student-456')).toBe(false);
    });

    test('checks if college is tagged', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit', 'stanford']);

      expect(isCollegeTagged(drive, 'mit')).toBe(true);
      expect(isCollegeTagged(drive, 'harvard')).toBe(false);
    });
  });

  describe('Interview Completion', () => {
    test('updates stats on interview completion', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-123', 'mit');
      drive = updateInterviewCompletion(drive, 'student-123', 85);

      expect(drive.stats.completedInterviews).toBe(1);
      expect(drive.stats.averageScore).toBe(85);
      expect(drive.stats.byCollege['mit'].completedInterviews).toBe(1);
      expect(drive.stats.byCollege['mit'].averageScore).toBe(85);
    });

    test('calculates average score correctly', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-1', 'mit');
      drive = tagStudentForDrive(drive, 'student-2', 'mit');

      drive = updateInterviewCompletion(drive, 'student-1', 80);
      drive = updateInterviewCompletion(drive, 'student-2', 90);

      expect(drive.stats.averageScore).toBe(85);
      expect(drive.stats.byCollege['mit'].averageScore).toBe(85);
    });

    test('throws error for untagged student', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      expect(() => {
        updateInterviewCompletion(drive, 'student-123', 85);
      }).toThrow('Student is not tagged for this interview drive');
    });
  });

  describe('College Stats', () => {
    test('gets stats for specific college', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, ['mit']);
      drive = tagStudentForDrive(drive, 'student-123', 'mit');

      const stats = getCollegeStats(drive, 'mit');

      expect(stats).not.toBeNull();
      expect(stats?.totalStudents).toBe(1);
    });

    test('returns null for untagged college', () => {
      const drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      const stats = getCollegeStats(drive, 'mit');

      expect(stats).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    test('handles college names with different casings', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      const names = ['MIT', 'mit', 'MiT'].map((name) => normalizeCollegeName(name));
      drive = tagCollegesForDrive(drive, names);

      // All should normalize to 'mit', so only one entry
      expect(drive.taggedColleges).toHaveLength(1);
      expect(drive.taggedColleges[0]).toBe('mit');
    });

    test('handles empty college list', () => {
      let drive = createTestInterviewDrive({
        name: 'Test Drive',
        description: 'Test',
        role: 'Engineer',
        organizationId: 'org-123',
      });

      drive = tagCollegesForDrive(drive, []);

      expect(drive.taggedColleges).toEqual([]);
      expect(drive.stats.byCollege).toEqual({});
    });
  });
});
