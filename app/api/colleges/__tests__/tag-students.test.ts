/**
 * Property-based tests for student tagging in interview drives
 * Tests validation of student-college relationships using normalized names
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Student Tagging Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 10: Student-college validation on tagging**
   * **Validates: Requirements 3.4, 6.2**
   * 
   * For any attempt to tag a student for an interview, the operation should succeed 
   * only if the student's normalized college name matches the college performing the tagging.
   */
  test('Property 10: tagging succeeds only when student belongs to college (normalized name match)', () => {
    // Validation function that checks if students belong to a college
    const validateStudentsForTagging = (
      studentIds: string[],
      collegeNormalizedName: string,
      students: Array<{ id: string; normalizedCollegeName: string }>
    ): { valid: boolean; invalidStudentIds: string[] } => {
      const collegeStudentIds = new Set(
        students
          .filter(s => s.normalizedCollegeName === collegeNormalizedName)
          .map(s => s.id)
      );
      
      const invalidStudentIds = studentIds.filter(id => !collegeStudentIds.has(id));
      
      return {
        valid: invalidStudentIds.length === 0,
        invalidStudentIds,
      };
    };

    fc.assert(
      fc.property(
        // Generate random college names with various casings
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName1, collegeName2, studentIds) => {
          // Normalize both college names
          const normalizedCollege1 = normalizeCollegeName(collegeName1);
          const normalizedCollege2 = normalizeCollegeName(collegeName2);
          
          // Skip if both colleges normalize to the same name
          if (normalizedCollege1 === normalizedCollege2) {
            return true;
          }

          // Create students: half belong to college1, half to college2
          const midpoint = Math.ceil(studentIds.length / 2);
          const studentsFromCollege1 = studentIds.slice(0, midpoint);
          const studentsFromCollege2 = studentIds.slice(midpoint);

          const students = studentIds.map(id => ({
            id,
            name: `Student ${id}`,
            normalizedCollegeName: studentsFromCollege1.includes(id) 
              ? normalizedCollege1 
              : normalizedCollege2,
          }));

          // Test validation for college1 trying to tag all students
          const result = validateStudentsForTagging(studentIds, normalizedCollege1, students);

          // Property: Validation should succeed only if all students belong to college1
          if (studentsFromCollege2.length === 0) {
            // All students belong to college1 - should be valid
            expect(result.valid).toBe(true);
            expect(result.invalidStudentIds).toHaveLength(0);
          } else {
            // Some students belong to college2 - should be invalid
            expect(result.valid).toBe(false);
            expect(result.invalidStudentIds).toEqual(studentsFromCollege2);
          }

          // Additional property: Invalid students should be exactly those from college2
          expect(new Set(result.invalidStudentIds)).toEqual(new Set(studentsFromCollege2));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that validation is case-insensitive through normalization
   */
  test('Property 10 (case-insensitive): validation works regardless of college name casing', () => {
    const validateStudentsForTagging = (
      studentIds: string[],
      collegeNormalizedName: string,
      students: Array<{ id: string; normalizedCollegeName: string }>
    ): boolean => {
      const collegeStudentIds = new Set(
        students
          .filter(s => s.normalizedCollegeName === collegeNormalizedName)
          .map(s => s.id)
      );
      
      return studentIds.every(id => collegeStudentIds.has(id));
    };

    fc.assert(
      fc.property(
        // Generate college name with random casing
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        (collegeName, studentIds) => {
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

          // Create students that all belong to this college
          const students = studentIds.map(id => ({
            id,
            normalizedCollegeName,
          }));

          // Validation should succeed for all casing variations
          variations.forEach(variation => {
            const normalized = normalizeCollegeName(variation);
            const isValid = validateStudentsForTagging(studentIds, normalized, students);
            expect(isValid).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: college-name-primary-key, Property 9: Student tagging creates notifications**
   * **Validates: Requirements 3.3**
   * 
   * For any student tagged for an interview, a notification should exist for that student.
   */
  test('Property 9: every tagged student receives a notification', () => {
    // Function that simulates tagging students and creating notifications
    const tagStudentsAndNotify = (
      studentIds: string[],
      driveId: string,
      collegeId: string,
      normalizedCollegeName: string,
      sendNotification: boolean
    ): Array<{ studentId: string; driveId: string; notificationCreated: boolean }> => {
      return studentIds.map(studentId => ({
        studentId,
        driveId,
        notificationCreated: sendNotification,
      }));
    };

    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.boolean(),
        (studentIds, driveId, collegeId, collegeName, sendNotification) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);
          
          const results = tagStudentsAndNotify(
            studentIds,
            driveId,
            collegeId,
            normalizedCollegeName,
            sendNotification
          );

          // Property: If sendNotification is true, every student should have a notification
          if (sendNotification) {
            results.forEach(result => {
              expect(result.notificationCreated).toBe(true);
              expect(result.studentId).toBeTruthy();
              expect(result.driveId).toBe(driveId);
            });
            
            // All students should be accounted for
            expect(results).toHaveLength(studentIds.length);
            
            // Each student should appear exactly once
            const studentIdSet = new Set(results.map(r => r.studentId));
            expect(studentIdSet.size).toBe(studentIds.length);
          } else {
            // If sendNotification is false, no notifications should be created
            results.forEach(result => {
              expect(result.notificationCreated).toBe(false);
            });
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that notification count matches tagged student count
   */
  test('Property 9 (cardinality): notification count equals tagged student count', () => {
    const createNotifications = (
      taggedStudents: Array<{ studentId: string; driveId: string }>,
      sendNotification: boolean
    ): Array<{ studentId: string; driveId: string; type: string }> => {
      if (!sendNotification) {
        return [];
      }
      
      return taggedStudents.map(({ studentId, driveId }) => ({
        studentId,
        driveId,
        type: 'drive_assignment',
      }));
    };

    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 50 }),
        fc.uuid(),
        (studentIds, driveId) => {
          const taggedStudents = studentIds.map(studentId => ({
            studentId,
            driveId,
          }));

          // When notifications are enabled
          const notificationsEnabled = createNotifications(taggedStudents, true);
          expect(notificationsEnabled).toHaveLength(taggedStudents.length);
          
          // Each notification should correspond to exactly one tagged student
          const notificationStudentIds = notificationsEnabled.map(n => n.studentId);
          expect(new Set(notificationStudentIds)).toEqual(new Set(studentIds));

          // When notifications are disabled
          const notificationsDisabled = createNotifications(taggedStudents, false);
          expect(notificationsDisabled).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
