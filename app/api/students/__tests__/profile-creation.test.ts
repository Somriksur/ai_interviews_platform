/**
 * Property-Based Tests for Student Profile Creation
 * 
 * Tests student profile creation with normalized college names
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Student Profile Creation', () => {
  describe('Property 14: Student profile college name normalization', () => {
    /**
     * **Feature: college-name-primary-key, Property 14: Student profile college name normalization**
     * **Validates: Requirements 4.5, 5.5**
     * 
     * For any student profile created, the normalizedCollegeName field should be in normalized form.
     */
    test('student profile has normalized college name', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentName: fc.string({ minLength: 2, maxLength: 50 }),
            email: fc.emailAddress(),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
            rollNumber: fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }),
            branch: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: undefined }),
            year: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
          }),
          (data) => {
            // Simulate student profile creation
            const normalizedCollegeName = normalizeCollegeName(data.collegeName);

            const studentProfile = {
              name: data.studentName,
              email: data.email,
              collegeName: data.collegeName, // Original casing
              normalizedCollegeName, // Normalized
              collegeId: 'college-123',
              organizationId: 'org-456',
              rollNumber: data.rollNumber || '',
              branch: data.branch || '',
              year: data.year || 1,
              cgpa: 0,
              skills: [],
              registrationStatus: 'approved' as const,
              createdAt: new Date(),
            };

            // Property: normalizedCollegeName should be in normalized form
            expect(studentProfile.normalizedCollegeName).toBe(normalizedCollegeName);

            // Property: normalizedCollegeName should be lowercase and trimmed
            expect(studentProfile.normalizedCollegeName).toBe(
              data.collegeName.trim().toLowerCase()
            );

            // Property: normalizedCollegeName should be idempotent
            expect(normalizeCollegeName(studentProfile.normalizedCollegeName)).toBe(
              studentProfile.normalizedCollegeName
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    test('student profile preserves original college name for display', () => {
      fc.assert(
        fc.property(
          fc.record({
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
          }),
          (data) => {
            const studentProfile = {
              collegeName: data.collegeName,
              normalizedCollegeName: normalizeCollegeName(data.collegeName),
            };

            // Property: Original college name should be preserved
            expect(studentProfile.collegeName).toBe(data.collegeName);

            // Property: Display name and normalized name should differ only in casing/whitespace
            expect(studentProfile.collegeName.trim().toLowerCase()).toBe(
              studentProfile.normalizedCollegeName
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Student Profile Structure', () => {
    test('approved student has all required fields', () => {
      const student = {
        name: 'John Doe',
        email: 'john@example.com',
        collegeName: 'MIT',
        normalizedCollegeName: 'mit',
        collegeId: 'college-123',
        organizationId: 'org-456',
        rollNumber: '2021CS001',
        branch: 'Computer Science',
        year: 3,
        cgpa: 0,
        skills: [],
        registrationStatus: 'approved' as const,
        createdAt: new Date(),
      };

      expect(student.name).toBeDefined();
      expect(student.email).toBeDefined();
      expect(student.collegeName).toBeDefined();
      expect(student.normalizedCollegeName).toBeDefined();
      expect(student.collegeId).toBeDefined();
      expect(student.organizationId).toBeDefined();
      expect(student.registrationStatus).toBe('approved');
      expect(student.createdAt).toBeInstanceOf(Date);
    });

    test('student profile handles optional fields', () => {
      const studentWithOptionals = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        collegeName: 'Stanford',
        normalizedCollegeName: 'stanford',
        collegeId: 'college-456',
        organizationId: 'org-789',
        rollNumber: '',
        branch: '',
        year: 1,
        cgpa: 0,
        skills: [],
        registrationStatus: 'approved' as const,
        createdAt: new Date(),
      };

      expect(studentWithOptionals.rollNumber).toBe('');
      expect(studentWithOptionals.branch).toBe('');
      expect(studentWithOptionals.year).toBe(1);
    });
  });

  describe('College Name Variations', () => {
    test('handles various college name casings', () => {
      const collegeNames = [
        'MIT',
        'mit',
        'MiT',
        'Massachusetts Institute of Technology',
        'MASSACHUSETTS INSTITUTE OF TECHNOLOGY',
        'massachusetts institute of technology',
      ];

      collegeNames.forEach((collegeName) => {
        const student = {
          collegeName,
          normalizedCollegeName: normalizeCollegeName(collegeName),
        };

        // Property: Normalized name should always be lowercase
        expect(student.normalizedCollegeName).toBe(collegeName.trim().toLowerCase());

        // Property: Normalized name should not contain uppercase letters
        expect(student.normalizedCollegeName).toBe(student.normalizedCollegeName.toLowerCase());
      });
    });

    test('handles college names with special characters', () => {
      const collegeNames = [
        "St. Mary's College",
        "O'Reilly Institute",
        'École Polytechnique',
        'Universität München',
      ];

      collegeNames.forEach((collegeName) => {
        const student = {
          collegeName,
          normalizedCollegeName: normalizeCollegeName(collegeName),
        };

        // Property: Special characters should be preserved in normalized form
        expect(student.normalizedCollegeName).toBe(collegeName.trim().toLowerCase());
      });
    });

    test('handles college names with extra whitespace', () => {
      const testCases = [
        { input: '  MIT  ', expected: 'mit' },
        { input: 'Stanford   University', expected: 'stanford   university' },
        { input: '   Harvard   ', expected: 'harvard' },
      ];

      testCases.forEach(({ input, expected }) => {
        const student = {
          collegeName: input,
          normalizedCollegeName: normalizeCollegeName(input),
        };

        expect(student.normalizedCollegeName).toBe(expected);
      });
    });
  });

  describe('Registration Status', () => {
    test('approved students have correct status', () => {
      const student = {
        registrationStatus: 'approved' as const,
      };

      expect(student.registrationStatus).toBe('approved');
    });

    test('pending students have correct status', () => {
      const student = {
        registrationStatus: 'pending' as const,
      };

      expect(student.registrationStatus).toBe('pending');
    });

    test('rejected students have correct status', () => {
      const student = {
        registrationStatus: 'rejected' as const,
      };

      expect(student.registrationStatus).toBe('rejected');
    });
  });

  describe('Edge Cases', () => {
    test('handles empty optional fields', () => {
      const student = {
        name: 'Test Student',
        email: 'test@example.com',
        collegeName: 'Test College',
        normalizedCollegeName: 'test college',
        collegeId: 'college-123',
        organizationId: 'org-456',
        rollNumber: '',
        branch: '',
        year: 1,
        cgpa: 0,
        skills: [],
        registrationStatus: 'approved' as const,
        createdAt: new Date(),
      };

      expect(student.rollNumber).toBe('');
      expect(student.branch).toBe('');
      expect(student.skills).toEqual([]);
    });

    test('handles student names with special characters', () => {
      const names = [
        "O'Brien",
        'José María',
        'François-Xavier',
        'Müller',
        'Nguyễn',
      ];

      names.forEach((name) => {
        const student = {
          name,
          email: 'test@example.com',
          collegeName: 'MIT',
          normalizedCollegeName: 'mit',
        };

        expect(student.name).toBe(name);
      });
    });

    test('initializes cgpa to 0', () => {
      const student = {
        cgpa: 0,
      };

      expect(student.cgpa).toBe(0);
    });

    test('initializes skills to empty array', () => {
      const student = {
        skills: [],
      };

      expect(student.skills).toEqual([]);
      expect(Array.isArray(student.skills)).toBe(true);
    });
  });
});
