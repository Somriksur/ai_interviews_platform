/**
 * Property-based tests for cascading college name updates
 * Tests that when a college name changes, all related entities are updated
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Cascading Updates Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 22: Cascading college name updates**
   * **Validates: Requirements 7.3**
   * 
   * For any college name update, all related entities (students, job postings, interview drives) 
   * should have their college name references updated to the new normalized name.
   */
  test('Property 22: all related entities are updated when college name changes', () => {
    // Simulates updating a college name and cascading the change
    const updateCollegeNameWithCascade = (
      oldNormalizedName: string,
      newNormalizedName: string,
      entities: {
        students: Array<{ id: string; normalizedCollegeName: string }>;
        jobPostings: Array<{ id: string; taggedColleges: string[] }>;
        interviewDrives: Array<{ id: string; taggedColleges: string[] }>;
      }
    ): {
      students: Array<{ id: string; normalizedCollegeName: string }>;
      jobPostings: Array<{ id: string; taggedColleges: string[] }>;
      interviewDrives: Array<{ id: string; taggedColleges: string[] }>;
    } => {
      // Update students
      const updatedStudents = entities.students.map(student => ({
        ...student,
        normalizedCollegeName:
          student.normalizedCollegeName === oldNormalizedName
            ? newNormalizedName
            : student.normalizedCollegeName,
      }));

      // Update job postings
      const updatedJobPostings = entities.jobPostings.map(job => ({
        ...job,
        taggedColleges: job.taggedColleges.map(college =>
          college === oldNormalizedName ? newNormalizedName : college
        ),
      }));

      // Update interview drives
      const updatedInterviewDrives = entities.interviewDrives.map(drive => ({
        ...drive,
        taggedColleges: drive.taggedColleges.map(college =>
          college === oldNormalizedName ? newNormalizedName : college
        ),
      }));

      return {
        students: updatedStudents,
        jobPostings: updatedJobPostings,
        interviewDrives: updatedInterviewDrives,
      };
    };

    fc.assert(
      fc.property(
        // Generate old and new college names
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        // Generate entities
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        (oldName, newName, studentIds, jobIds, driveIds) => {
          const oldNormalized = normalizeCollegeName(oldName);
          const newNormalized = normalizeCollegeName(newName);

          // Skip if names normalize to the same value
          if (oldNormalized === newNormalized) {
            return true;
          }

          // Create entities referencing the old college name
          const entities = {
            students: studentIds.map(id => ({
              id,
              normalizedCollegeName: oldNormalized,
            })),
            jobPostings: jobIds.map(id => ({
              id,
              taggedColleges: [oldNormalized],
            })),
            interviewDrives: driveIds.map(id => ({
              id,
              taggedColleges: [oldNormalized],
            })),
          };

          // Perform cascading update
          const updated = updateCollegeNameWithCascade(oldNormalized, newNormalized, entities);

          // Property 1: All students should reference the new college name
          updated.students.forEach(student => {
            expect(student.normalizedCollegeName).toBe(newNormalized);
            expect(student.normalizedCollegeName).not.toBe(oldNormalized);
          });

          // Property 2: All job postings should reference the new college name
          updated.jobPostings.forEach(job => {
            expect(job.taggedColleges).toContain(newNormalized);
            expect(job.taggedColleges).not.toContain(oldNormalized);
          });

          // Property 3: All interview drives should reference the new college name
          updated.interviewDrives.forEach(drive => {
            expect(drive.taggedColleges).toContain(newNormalized);
            expect(drive.taggedColleges).not.toContain(oldNormalized);
          });

          // Property 4: Entity counts should remain the same
          expect(updated.students).toHaveLength(studentIds.length);
          expect(updated.jobPostings).toHaveLength(jobIds.length);
          expect(updated.interviewDrives).toHaveLength(driveIds.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that cascading updates don't affect other colleges
   */
  test('Property 22 (isolation): updates only affect the target college', () => {
    const updateCollegeNameWithCascade = (
      oldNormalizedName: string,
      newNormalizedName: string,
      students: Array<{ id: string; normalizedCollegeName: string }>
    ): Array<{ id: string; normalizedCollegeName: string }> => {
      return students.map(student => ({
        ...student,
        normalizedCollegeName:
          student.normalizedCollegeName === oldNormalizedName
            ? newNormalizedName
            : student.normalizedCollegeName,
      }));
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        (college1, college2, newName, studentIds) => {
          const normalized1 = normalizeCollegeName(college1);
          const normalized2 = normalizeCollegeName(college2);
          const newNormalized = normalizeCollegeName(newName);

          // Skip if any names are the same
          if (
            normalized1 === normalized2 ||
            normalized1 === newNormalized ||
            normalized2 === newNormalized
          ) {
            return true;
          }

          // Create students from both colleges
          const midpoint = Math.ceil(studentIds.length / 2);
          const students = studentIds.map((id, index) => ({
            id,
            normalizedCollegeName: index < midpoint ? normalized1 : normalized2,
          }));

          // Update college1's name
          const updated = updateCollegeNameWithCascade(normalized1, newNormalized, students);

          // Property: Only college1 students should be updated
          updated.forEach((student, index) => {
            if (index < midpoint) {
              // College1 students should have new name
              expect(student.normalizedCollegeName).toBe(newNormalized);
            } else {
              // College2 students should be unchanged
              expect(student.normalizedCollegeName).toBe(normalized2);
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that cascading updates handle multiple references correctly
   */
  test('Property 22 (multiple references): entities with multiple college tags are updated correctly', () => {
    const updateJobPostingColleges = (
      oldNormalizedName: string,
      newNormalizedName: string,
      jobPosting: { id: string; taggedColleges: string[] }
    ): { id: string; taggedColleges: string[] } => {
      return {
        ...jobPosting,
        taggedColleges: jobPosting.taggedColleges.map(college =>
          college === oldNormalizedName ? newNormalizedName : college
        ),
      };
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 1, maxLength: 5 }
        ),
        (targetCollege, newName, otherColleges) => {
          const targetNormalized = normalizeCollegeName(targetCollege);
          const newNormalized = normalizeCollegeName(newName);
          const otherNormalized = otherColleges.map(c => normalizeCollegeName(c));

          // Skip if new name conflicts with existing
          if (
            targetNormalized === newNormalized ||
            otherNormalized.includes(newNormalized)
          ) {
            return true;
          }

          // Create job posting with multiple colleges including target
          const jobPosting = {
            id: 'job-1',
            taggedColleges: [targetNormalized, ...otherNormalized],
          };

          // Update the target college name
          const updated = updateJobPostingColleges(targetNormalized, newNormalized, jobPosting);

          // Property 1: New name should be present
          expect(updated.taggedColleges).toContain(newNormalized);

          // Property 2: Old name should not be present
          expect(updated.taggedColleges).not.toContain(targetNormalized);

          // Property 3: Other colleges should be unchanged
          otherNormalized.forEach(college => {
            if (college !== targetNormalized) {
              expect(updated.taggedColleges).toContain(college);
            }
          });

          // Property 4: Total count should be the same
          expect(updated.taggedColleges).toHaveLength(jobPosting.taggedColleges.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that cascading updates are idempotent
   */
  test('Property 22 (idempotence): applying the same update twice produces the same result', () => {
    const updateStudentCollege = (
      oldNormalizedName: string,
      newNormalizedName: string,
      students: Array<{ id: string; normalizedCollegeName: string }>
    ): Array<{ id: string; normalizedCollegeName: string }> => {
      return students.map(student => ({
        ...student,
        normalizedCollegeName:
          student.normalizedCollegeName === oldNormalizedName
            ? newNormalizedName
            : student.normalizedCollegeName,
      }));
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (oldName, newName, studentIds) => {
          const oldNormalized = normalizeCollegeName(oldName);
          const newNormalized = normalizeCollegeName(newName);

          if (oldNormalized === newNormalized) {
            return true;
          }

          const students = studentIds.map(id => ({
            id,
            normalizedCollegeName: oldNormalized,
          }));

          // Apply update once
          const updated1 = updateStudentCollege(oldNormalized, newNormalized, students);

          // Apply update again
          const updated2 = updateStudentCollege(oldNormalized, newNormalized, updated1);

          // Property: Second update should produce identical result
          expect(updated2).toEqual(updated1);

          // All students should still have the new name
          updated2.forEach(student => {
            expect(student.normalizedCollegeName).toBe(newNormalized);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that empty updates don't change anything
   */
  test('Property 22 (no-op): updating to the same name is a no-op', () => {
    const updateStudentCollege = (
      oldNormalizedName: string,
      newNormalizedName: string,
      students: Array<{ id: string; normalizedCollegeName: string }>
    ): Array<{ id: string; normalizedCollegeName: string }> => {
      return students.map(student => ({
        ...student,
        normalizedCollegeName:
          student.normalizedCollegeName === oldNormalizedName
            ? newNormalizedName
            : student.normalizedCollegeName,
      }));
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName, studentIds) => {
          const normalized = normalizeCollegeName(collegeName);

          const students = studentIds.map(id => ({
            id,
            normalizedCollegeName: normalized,
          }));

          // Update to the same name
          const updated = updateStudentCollege(normalized, normalized, students);

          // Property: Nothing should change
          expect(updated).toEqual(students);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that cascading updates preserve entity integrity
   */
  test('Property 22 (integrity): entity IDs and other fields remain unchanged', () => {
    const updateStudentCollege = (
      oldNormalizedName: string,
      newNormalizedName: string,
      students: Array<{ id: string; name: string; normalizedCollegeName: string; email: string }>
    ): Array<{ id: string; name: string; normalizedCollegeName: string; email: string }> => {
      return students.map(student => ({
        ...student,
        normalizedCollegeName:
          student.normalizedCollegeName === oldNormalizedName
            ? newNormalizedName
            : student.normalizedCollegeName,
      }));
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            email: fc.emailAddress(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (oldName, newName, studentData) => {
          const oldNormalized = normalizeCollegeName(oldName);
          const newNormalized = normalizeCollegeName(newName);

          if (oldNormalized === newNormalized) {
            return true;
          }

          const students = studentData.map(data => ({
            ...data,
            normalizedCollegeName: oldNormalized,
          }));

          const updated = updateStudentCollege(oldNormalized, newNormalized, students);

          // Property: All other fields should remain unchanged
          updated.forEach((student, index) => {
            expect(student.id).toBe(students[index].id);
            expect(student.name).toBe(students[index].name);
            expect(student.email).toBe(students[index].email);
            // Only college name should change
            expect(student.normalizedCollegeName).toBe(newNormalized);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
