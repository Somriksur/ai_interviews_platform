/**
 * Property-based tests for student interview filtering
 * Tests that students only see interviews where their college is tagged
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Student Interview Filtering Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 19: Interview filtering by student college**
   * **Validates: Requirements 6.3**
   * 
   * For any student, querying available interviews should return only interviews 
   * where the student's normalizedCollegeName is in the drive's taggedColleges array.
   */
  test('Property 19: students only see interviews for their college', () => {
    // Function that filters interview drives for a student
    const filterInterviewsForStudent = (
      studentNormalizedCollegeName: string,
      interviewDrives: Array<{
        id: string;
        name: string;
        taggedColleges: string[];
        taggedStudents: Array<{ studentId: string; normalizedCollegeName: string }>;
      }>,
      studentId: string
    ): Array<{ id: string; name: string }> => {
      return interviewDrives
        .filter(drive => {
          // Drive must have the student's college in taggedColleges
          const hasStudentCollege = drive.taggedColleges.includes(studentNormalizedCollegeName);
          
          // Student must be explicitly tagged in this drive
          const isStudentTagged = drive.taggedStudents.some(
            ts => ts.studentId === studentId
          );
          
          return hasStudentCollege && isStudentTagged;
        })
        .map(drive => ({
          id: drive.id,
          name: drive.name,
        }));
    };

    fc.assert(
      fc.property(
        // Generate random college names
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 2, maxLength: 5 }
        ),
        // Generate student ID
        fc.uuid(),
        // Generate interview drives
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 5, maxLength: 30 }),
            collegeIndex: fc.integer({ min: 0, max: 4 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (collegeNames, studentId, driveConfigs) => {
          // Normalize all college names
          const normalizedColleges = collegeNames.map(name => normalizeCollegeName(name));
          
          // Skip if we don't have unique normalized names
          if (new Set(normalizedColleges).size < 2) {
            return true;
          }

          // Student belongs to the first college
          const studentCollegeName = normalizedColleges[0];

          // Create interview drives with various college tags
          const interviewDrives = driveConfigs.map(config => {
            const collegeIndex = config.collegeIndex % normalizedColleges.length;
            const driveCollegeName = normalizedColleges[collegeIndex];
            
            // Some drives have the student tagged, some don't
            const isStudentTagged = config.id.charCodeAt(0) % 2 === 0;
            
            return {
              id: config.id,
              name: config.name,
              taggedColleges: [driveCollegeName],
              taggedStudents: isStudentTagged
                ? [{ studentId, normalizedCollegeName: driveCollegeName }]
                : [],
            };
          });

          // Filter interviews for the student
          const filteredInterviews = filterInterviewsForStudent(
            studentCollegeName,
            interviewDrives,
            studentId
          );

          // Property 1: All returned interviews must have student's college in taggedColleges
          filteredInterviews.forEach(interview => {
            const originalDrive = interviewDrives.find(d => d.id === interview.id);
            expect(originalDrive?.taggedColleges).toContain(studentCollegeName);
          });

          // Property 2: All returned interviews must have the student tagged
          filteredInterviews.forEach(interview => {
            const originalDrive = interviewDrives.find(d => d.id === interview.id);
            const isTagged = originalDrive?.taggedStudents.some(
              ts => ts.studentId === studentId
            );
            expect(isTagged).toBe(true);
          });

          // Property 3: No interviews from other colleges should be included
          const interviewsFromOtherColleges = interviewDrives.filter(
            drive => !drive.taggedColleges.includes(studentCollegeName)
          );
          
          interviewsFromOtherColleges.forEach(drive => {
            const isIncluded = filteredInterviews.some(i => i.id === drive.id);
            expect(isIncluded).toBe(false);
          });

          // Property 4: Count should match drives where student's college is tagged AND student is tagged
          const expectedCount = interviewDrives.filter(drive => {
            const hasCollege = drive.taggedColleges.includes(studentCollegeName);
            const hasStudent = drive.taggedStudents.some(ts => ts.studentId === studentId);
            return hasCollege && hasStudent;
          }).length;
          
          expect(filteredInterviews).toHaveLength(expectedCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that filtering is case-insensitive through normalization
   */
  test('Property 19 (case-insensitive): filtering works regardless of college name casing', () => {
    const filterInterviewsForStudent = (
      studentNormalizedCollegeName: string,
      interviewDrives: Array<{
        id: string;
        taggedColleges: string[];
        taggedStudents: Array<{ studentId: string }>;
      }>,
      studentId: string
    ): string[] => {
      return interviewDrives
        .filter(drive => {
          const hasCollege = drive.taggedColleges.includes(studentNormalizedCollegeName);
          const hasStudent = drive.taggedStudents.some(ts => ts.studentId === studentId);
          return hasCollege && hasStudent;
        })
        .map(drive => drive.id);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        (collegeName, studentId, driveIds) => {
          // Create variations of the college name with different casings
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName,
          ];

          // All variations should normalize to the same value
          const normalizedNames = variations.map(v => normalizeCollegeName(v));
          const uniqueNormalized = new Set(normalizedNames);
          expect(uniqueNormalized.size).toBe(1);

          const normalizedCollegeName = normalizedNames[0];

          // Create interview drives with the normalized college name
          const interviewDrives = driveIds.map(id => ({
            id,
            taggedColleges: [normalizedCollegeName],
            taggedStudents: [{ studentId }],
          }));

          // Filtering should work with any casing variation
          variations.forEach(variation => {
            const normalized = normalizeCollegeName(variation);
            const filtered = filterInterviewsForStudent(
              normalized,
              interviewDrives,
              studentId
            );
            
            // Should return all drives since they all match
            expect(filtered).toHaveLength(driveIds.length);
            expect(new Set(filtered)).toEqual(new Set(driveIds));
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that students not tagged in a drive don't see it, even if their college is tagged
   */
  test('Property 19 (exclusion): students must be explicitly tagged to see interviews', () => {
    const filterInterviewsForStudent = (
      studentNormalizedCollegeName: string,
      interviewDrives: Array<{
        id: string;
        taggedColleges: string[];
        taggedStudents: Array<{ studentId: string }>;
      }>,
      studentId: string
    ): string[] => {
      return interviewDrives
        .filter(drive => {
          const hasCollege = drive.taggedColleges.includes(studentNormalizedCollegeName);
          const hasStudent = drive.taggedStudents.some(ts => ts.studentId === studentId);
          return hasCollege && hasStudent;
        })
        .map(drive => drive.id);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.uuid(),
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName, studentId, otherStudentId, driveIds) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);

          // Create drives where the college is tagged but only otherStudent is tagged
          const interviewDrives = driveIds.map(id => ({
            id,
            taggedColleges: [normalizedCollegeName],
            taggedStudents: [{ studentId: otherStudentId }], // Different student
          }));

          // Student should not see any interviews
          const filtered = filterInterviewsForStudent(
            normalizedCollegeName,
            interviewDrives,
            studentId
          );

          // Property: Student not explicitly tagged should see zero interviews
          expect(filtered).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
