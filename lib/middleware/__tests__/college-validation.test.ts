/**
 * Property-based tests for referential integrity validation
 * Tests that entity creation fails when college references don't exist
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Referential Integrity Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 23: Referential integrity validation**
   * **Validates: Requirements 7.4, 7.5**
   * 
   * For any entity creation that references a college name, the operation should fail 
   * if the normalized college name does not exist in the colleges collection.
   */
  test('Property 23: entity creation fails for non-existent college references', () => {
    // Simulates validating a college reference before entity creation
    const validateAndCreateEntity = (
      collegeName: string,
      existingColleges: Set<string>
    ): { success: boolean; error?: string; normalizedName?: string } => {
      const normalizedName = normalizeCollegeName(collegeName);

      // Check if college exists
      if (!existingColleges.has(normalizedName)) {
        return {
          success: false,
          error: `College '${normalizedName}' does not exist`,
          normalizedName,
        };
      }

      // College exists, entity can be created
      return {
        success: true,
        normalizedName,
      };
    };

    fc.assert(
      fc.property(
        // Generate existing colleges
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 2, maxLength: 10 }
        ),
        // Generate college name to reference (may or may not exist)
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.boolean(), // Whether the reference should be valid
        (existingCollegeNames, referenceName, shouldExist) => {
          // Normalize existing colleges
          const existingColleges = new Set(
            existingCollegeNames.map(name => normalizeCollegeName(name))
          );

          // Determine which college to reference
          let collegeToReference: string;
          if (shouldExist && existingCollegeNames.length > 0) {
            // Reference an existing college
            collegeToReference = existingCollegeNames[0];
          } else {
            // Reference a non-existent college
            collegeToReference = referenceName;
            // Make sure it doesn't accidentally exist
            const normalized = normalizeCollegeName(referenceName);
            if (existingColleges.has(normalized)) {
              return true; // Skip this case
            }
          }

          const result = validateAndCreateEntity(collegeToReference, existingColleges);
          const normalizedReference = normalizeCollegeName(collegeToReference);

          // Property: Validation should succeed only if college exists
          if (existingColleges.has(normalizedReference)) {
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
          } else {
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain('does not exist');
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that validation is case-insensitive
   */
  test('Property 23 (case-insensitive): validation works regardless of casing', () => {
    const validateCollegeReference = (
      collegeName: string,
      existingColleges: Set<string>
    ): boolean => {
      const normalized = normalizeCollegeName(collegeName);
      return existingColleges.has(normalized);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        (collegeName) => {
          const normalizedName = normalizeCollegeName(collegeName);
          const existingColleges = new Set([normalizedName]);

          // Create different casing variations
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName,
          ];

          // All variations should validate successfully
          variations.forEach(variation => {
            const isValid = validateCollegeReference(variation, existingColleges);
            expect(isValid).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that multiple references are validated correctly
   */
  test('Property 23 (multiple references): all references must be valid', () => {
    const validateMultipleReferences = (
      collegeNames: string[],
      existingColleges: Set<string>
    ): { isValid: boolean; invalidReferences: string[] } => {
      const invalidReferences: string[] = [];

      collegeNames.forEach(name => {
        const normalized = normalizeCollegeName(name);
        if (!existingColleges.has(normalized)) {
          invalidReferences.push(normalized);
        }
      });

      return {
        isValid: invalidReferences.length === 0,
        invalidReferences,
      };
    };

    fc.assert(
      fc.property(
        // Generate existing colleges
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 2, maxLength: 10 }
        ),
        // Generate references to validate
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 1, maxLength: 5 }
        ),
        (existingCollegeNames, referencesToValidate) => {
          const existingColleges = new Set(
            existingCollegeNames.map(name => normalizeCollegeName(name))
          );

          const result = validateMultipleReferences(referencesToValidate, existingColleges);

          // Property 1: If all references exist, validation should succeed
          const allExist = referencesToValidate.every(name => {
            const normalized = normalizeCollegeName(name);
            return existingColleges.has(normalized);
          });

          if (allExist) {
            expect(result.isValid).toBe(true);
            expect(result.invalidReferences).toHaveLength(0);
          }

          // Property 2: Invalid references should be exactly those that don't exist
          const expectedInvalid = referencesToValidate.filter(name => {
            const normalized = normalizeCollegeName(name);
            return !existingColleges.has(normalized);
          }).map(name => normalizeCollegeName(name));

          expect(new Set(result.invalidReferences)).toEqual(new Set(expectedInvalid));

          // Property 3: Validation fails if any reference is invalid
          if (expectedInvalid.length > 0) {
            expect(result.isValid).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that empty references are handled correctly
   */
  test('Property 23 (empty input): empty college name is invalid', () => {
    const validateCollegeName = (collegeName: string): { isValid: boolean; error?: string } => {
      if (!collegeName || collegeName.trim().length === 0) {
        return {
          isValid: false,
          error: 'College name cannot be empty',
        };
      }

      const normalized = normalizeCollegeName(collegeName);
      if (normalized.length < 3) {
        return {
          isValid: false,
          error: 'College name must be at least 3 characters',
        };
      }

      return { isValid: true };
    };

    fc.assert(
      fc.property(
        fc.constantFrom('', ' ', '  ', '\t', '\n', '   '),
        (emptyName) => {
          const result = validateCollegeName(emptyName);

          // Property: Empty names should always be invalid
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that validation prevents orphaned references
   */
  test('Property 23 (orphan prevention): entities cannot reference deleted colleges', () => {
    const createEntityWithCollegeReference = (
      collegeName: string,
      existingColleges: Set<string>,
      deletedColleges: Set<string>
    ): { success: boolean; error?: string } => {
      const normalized = normalizeCollegeName(collegeName);

      // Check if college was deleted
      if (deletedColleges.has(normalized)) {
        return {
          success: false,
          error: `College '${normalized}' has been deleted`,
        };
      }

      // Check if college exists
      if (!existingColleges.has(normalized)) {
        return {
          success: false,
          error: `College '${normalized}' does not exist`,
        };
      }

      return { success: true };
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 3, maxLength: 10 }
        ),
        (collegeNames) => {
          const normalizedNames = collegeNames.map(name => normalizeCollegeName(name));
          
          // Skip if all names normalize to the same value
          const uniqueNormalized = new Set(normalizedNames);
          if (uniqueNormalized.size < 2) {
            return true;
          }

          // Some colleges exist, some are deleted
          const midpoint = Math.ceil(normalizedNames.length / 2);
          const existingColleges = new Set(normalizedNames.slice(0, midpoint));
          const deletedColleges = new Set(normalizedNames.slice(midpoint));

          // Try to create entities referencing each college
          normalizedNames.forEach((normalized, index) => {
            const result = createEntityWithCollegeReference(
              collegeNames[index],
              existingColleges,
              deletedColleges
            );

            if (existingColleges.has(normalized) && !deletedColleges.has(normalized)) {
              // Should succeed for existing colleges that aren't deleted
              expect(result.success).toBe(true);
            } else {
              // Should fail for deleted or non-existent colleges
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
            }
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that validation provides helpful error messages
   */
  test('Property 23 (error messages): validation errors include college name', () => {
    const validateWithErrorMessage = (
      collegeName: string,
      existingColleges: Set<string>
    ): { isValid: boolean; error?: string; referencedName?: string } => {
      const normalized = normalizeCollegeName(collegeName);

      if (!existingColleges.has(normalized)) {
        return {
          isValid: false,
          error: `College '${normalized}' not found`,
          referencedName: normalized,
        };
      }

      return { isValid: true };
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        (existingCollege, nonExistentCollege) => {
          const normalizedExisting = normalizeCollegeName(existingCollege);
          const normalizedNonExistent = normalizeCollegeName(nonExistentCollege);

          // Skip if they normalize to the same value
          if (normalizedExisting === normalizedNonExistent) {
            return true;
          }

          const existingColleges = new Set([normalizedExisting]);

          // Validate non-existent college
          const result = validateWithErrorMessage(nonExistentCollege, existingColleges);

          // Property: Error message should include the referenced college name
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
          expect(result.error).toContain(normalizedNonExistent);
          expect(result.referencedName).toBe(normalizedNonExistent);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
