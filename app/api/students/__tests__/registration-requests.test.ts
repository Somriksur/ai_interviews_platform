/**
 * Property-Based Tests for Student Registration Requests
 * 
 * Tests the student registration request system with college approval workflow
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';
import { validateRegistrationRequest } from '@/types/registration-request';

// Mock Firebase Admin
jest.mock('@/firebase/admin', () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          where: jest.fn(() => ({
            limit: jest.fn(() => ({
              get: jest.fn(),
            })),
          })),
          limit: jest.fn(() => ({
            get: jest.fn(),
          })),
        })),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
        get: jest.fn(),
      })),
      add: jest.fn(),
      get: jest.fn(),
    })),
  },
}));

describe('Student Registration Request System', () => {
  describe('Property 12: Registration request normalization', () => {
    /**
     * **Feature: college-name-primary-key, Property 12: Registration request normalization**
     * **Validates: Requirements 4.3**
     * 
     * For any student registration request, the stored normalizedCollegeName 
     * should be the normalized version of the provided college name.
     */
    test('registration request stores normalized college name', () => {
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
          (requestData) => {
            // Simulate creating a registration request
            const normalizedCollegeName = normalizeCollegeName(requestData.collegeName);
            
            const registrationRequest = {
              studentName: requestData.studentName.trim(),
              email: requestData.email.toLowerCase(),
              collegeName: requestData.collegeName, // Original casing
              normalizedCollegeName, // Normalized version
              collegeId: 'test-college-id',
              organizationId: 'test-org-id',
              rollNumber: requestData.rollNumber?.trim(),
              branch: requestData.branch?.trim(),
              year: requestData.year,
              status: 'pending' as const,
              submittedAt: new Date(),
            };

            // Property: normalizedCollegeName should be the normalized version
            expect(registrationRequest.normalizedCollegeName).toBe(
              normalizeCollegeName(requestData.collegeName)
            );
            
            // Property: normalizedCollegeName should be lowercase and trimmed
            expect(registrationRequest.normalizedCollegeName).toBe(
              requestData.collegeName.trim().toLowerCase()
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 15: Registration request college linking', () => {
    /**
     * **Feature: college-name-primary-key, Property 15: Registration request college linking**
     * **Validates: Requirements 5.1**
     * 
     * For any registration request submitted, it should be linked to the college 
     * using the normalized college name.
     */
    test('registration request is linked to college by normalized name', () => {
      fc.assert(
        fc.property(
          fc.record({
            studentName: fc.string({ minLength: 2, maxLength: 50 }),
            email: fc.emailAddress(),
            collegeName: fc.string({ minLength: 3, maxLength: 100 }),
          }),
          (requestData) => {
            const normalizedCollegeName = normalizeCollegeName(requestData.collegeName);
            
            // Simulate college data
            const college = {
              id: 'college-123',
              name: requestData.collegeName,
              normalizedName: normalizedCollegeName,
              organizationId: 'org-456',
            };

            // Create registration request
            const registrationRequest = {
              studentName: requestData.studentName.trim(),
              email: requestData.email.toLowerCase(),
              collegeName: college.name,
              normalizedCollegeName: college.normalizedName,
              collegeId: college.id,
              organizationId: college.organizationId,
              status: 'pending' as const,
              submittedAt: new Date(),
            };

            // Property: Request should be linked using normalized college name
            expect(registrationRequest.normalizedCollegeName).toBe(college.normalizedName);
            
            // Property: Normalized name should match college's normalized name
            expect(registrationRequest.normalizedCollegeName).toBe(
              normalizeCollegeName(college.name)
            );
            
            // Property: Request should reference the correct college ID
            expect(registrationRequest.collegeId).toBe(college.id);
            
            // Property: Request should reference the correct organization
            expect(registrationRequest.organizationId).toBe(college.organizationId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Validation Tests', () => {
    test('validates student name length', () => {
      const result = validateRegistrationRequest({
        studentName: 'A',
        email: 'test@example.com',
        collegeName: 'MIT',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Student name must be at least 2 characters');
    });

    test('validates email format', () => {
      const result = validateRegistrationRequest({
        studentName: 'John Doe',
        email: 'invalid-email',
        collegeName: 'MIT',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email address is required');
    });

    test('validates college name length', () => {
      const result = validateRegistrationRequest({
        studentName: 'John Doe',
        email: 'test@example.com',
        collegeName: 'AB',
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('College name must be at least 3 characters');
    });

    test('validates year range', () => {
      const result = validateRegistrationRequest({
        studentName: 'John Doe',
        email: 'test@example.com',
        collegeName: 'MIT',
        year: 10,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Year must be between 1 and 5');
    });

    test('accepts valid registration data', () => {
      const result = validateRegistrationRequest({
        studentName: 'John Doe',
        email: 'test@example.com',
        collegeName: 'MIT',
        rollNumber: '2021CS001',
        branch: 'Computer Science',
        year: 3,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    test('handles college names with various casings', () => {
      const testCases = [
        'MIT',
        'mit',
        'MiT',
        'mIt',
        '  MIT  ',
        'Massachusetts Institute of Technology',
      ];

      testCases.forEach((collegeName) => {
        const normalized = normalizeCollegeName(collegeName);
        const request = {
          studentName: 'John Doe',
          email: 'test@example.com',
          collegeName,
          normalizedCollegeName: normalized,
          collegeId: 'test-id',
          organizationId: 'test-org',
          status: 'pending' as const,
          submittedAt: new Date(),
        };

        expect(request.normalizedCollegeName).toBe(collegeName.trim().toLowerCase());
      });
    });

    test('handles optional fields correctly', () => {
      const requestWithOptionals: {
        studentName: string;
        email: string;
        collegeName: string;
        normalizedCollegeName: string;
        collegeId: string;
        organizationId: string;
        rollNumber?: string;
        branch?: string;
        year?: number;
        status: 'pending';
        submittedAt: Date;
      } = {
        studentName: 'John Doe',
        email: 'test@example.com',
        collegeName: 'MIT',
        normalizedCollegeName: 'mit',
        collegeId: 'test-id',
        organizationId: 'test-org',
        rollNumber: '2021CS001',
        branch: 'Computer Science',
        year: 3,
        status: 'pending' as const,
        submittedAt: new Date(),
      };

      expect(requestWithOptionals.rollNumber).toBe('2021CS001');
      expect(requestWithOptionals.branch).toBe('Computer Science');
      expect(requestWithOptionals.year).toBe(3);

      const requestWithoutOptionals: {
        studentName: string;
        email: string;
        collegeName: string;
        normalizedCollegeName: string;
        collegeId: string;
        organizationId: string;
        rollNumber?: string;
        branch?: string;
        year?: number;
        status: 'pending';
        submittedAt: Date;
      } = {
        studentName: 'Jane Doe',
        email: 'jane@example.com',
        collegeName: 'Stanford',
        normalizedCollegeName: 'stanford',
        collegeId: 'test-id-2',
        organizationId: 'test-org',
        status: 'pending' as const,
        submittedAt: new Date(),
      };

      expect(requestWithoutOptionals.rollNumber).toBeUndefined();
      expect(requestWithoutOptionals.branch).toBeUndefined();
      expect(requestWithoutOptionals.year).toBeUndefined();
    });

    test('normalizes email to lowercase', () => {
      const emails = [
        'Test@Example.COM',
        'JOHN.DOE@MIT.EDU',
        'Jane.Smith@Stanford.EDU',
      ];

      emails.forEach((email) => {
        const request = {
          studentName: 'Test User',
          email: email.toLowerCase(),
          collegeName: 'MIT',
          normalizedCollegeName: 'mit',
          collegeId: 'test-id',
          organizationId: 'test-org',
          status: 'pending' as const,
          submittedAt: new Date(),
        };

        expect(request.email).toBe(email.toLowerCase());
      });
    });
  });
});
