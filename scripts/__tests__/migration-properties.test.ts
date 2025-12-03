/**
 * Property-based tests for data migration from college IDs to normalized names
 * Tests migration conversion, ID resolution, and post-migration validation
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Data Migration Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 25: Migration ID to name conversion**
   * **Validates: Requirements 9.1**
   * 
   * For any entity with a college ID reference before migration, after migration 
   * it should have a normalized college name reference instead.
   */
  test('Property 25: all college ID references are converted to normalized names', () => {
    // Simulates migrating entities from college IDs to normalized names
    const migrateEntity = (
      entity: { id: string; collegeId: string; [key: string]: any },
      collegeIdToNameMap: Map<string, string>
    ): { id: string; normalizedCollegeName: string; [key: string]: any } => {
      const normalizedName = collegeIdToNameMap.get(entity.collegeId);
      
      if (!normalizedName) {
        throw new Error(`College ID ${entity.collegeId} not found in mapping`);
      }

      const { collegeId, ...rest } = entity;
      return {
        ...rest,
        normalizedCollegeName: normalizedName,
      };
    };

    fc.assert(
      fc.property(
        // Generate colleges with IDs and names
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        // Generate entities with college ID references
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            collegeIndex: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (colleges, entityConfigs) => {
          // Create ID to normalized name mapping
          const collegeIdToNameMap = new Map(
            colleges.map(college => [
              college.id,
              normalizeCollegeName(college.name),
            ])
          );

          // Create entities with college ID references
          const entities = entityConfigs.map(config => ({
            id: config.id,
            name: config.name,
            collegeId: colleges[config.collegeIndex % colleges.length].id,
          }));

          // Migrate all entities
          const migratedEntities = entities.map(entity =>
            migrateEntity(entity, collegeIdToNameMap)
          );

          // Property 1: All entities should have normalizedCollegeName
          migratedEntities.forEach(entity => {
            expect(entity.normalizedCollegeName).toBeDefined();
            expect(typeof entity.normalizedCollegeName).toBe('string');
          });

          // Property 2: No entity should have collegeId anymore
          migratedEntities.forEach(entity => {
            expect((entity as any).collegeId).toBeUndefined();
          });

          // Property 3: All normalized names should be valid
          migratedEntities.forEach(entity => {
            expect(entity.normalizedCollegeName.length).toBeGreaterThan(0);
            expect(entity.normalizedCollegeName).toBe(entity.normalizedCollegeName.toLowerCase());
          });

          // Property 4: Entity count should remain the same
          expect(migratedEntities).toHaveLength(entities.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: college-name-primary-key, Property 26: College ID resolution**
   * **Validates: Requirements 9.2**
   * 
   * For any college ID, resolving it should return the corresponding college's normalized name.
   */
  test('Property 26: college IDs resolve to correct normalized names', () => {
    const resolveCollegeId = (
      collegeId: string,
      collegeIdToNameMap: Map<string, string>
    ): { success: boolean; normalizedName?: string; error?: string } => {
      const normalizedName = collegeIdToNameMap.get(collegeId);
      
      if (!normalizedName) {
        return {
          success: false,
          error: `College ID ${collegeId} not found`,
        };
      }

      return {
        success: true,
        normalizedName,
      };
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (colleges) => {
          // Create ID to name mapping
          const collegeIdToNameMap = new Map(
            colleges.map(college => [
              college.id,
              normalizeCollegeName(college.name),
            ])
          );

          // Property 1: All valid IDs should resolve successfully
          colleges.forEach(college => {
            const result = resolveCollegeId(college.id, collegeIdToNameMap);
            expect(result.success).toBe(true);
            expect(result.normalizedName).toBe(normalizeCollegeName(college.name));
          });

          // Property 2: Invalid IDs should fail to resolve
          const invalidId = 'invalid-id-12345';
          const invalidResult = resolveCollegeId(invalidId, collegeIdToNameMap);
          expect(invalidResult.success).toBe(false);
          expect(invalidResult.error).toBeDefined();

          // Property 3: Resolution should be deterministic
          colleges.forEach(college => {
            const result1 = resolveCollegeId(college.id, collegeIdToNameMap);
            const result2 = resolveCollegeId(college.id, collegeIdToNameMap);
            expect(result1).toEqual(result2);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: college-name-primary-key, Property 27: Post-migration validation**
   * **Validates: Requirements 9.3**
   * 
   * For any entity after migration, all college name references should be valid 
   * normalized names that exist in the colleges collection.
   */
  test('Property 27: all post-migration references are valid', () => {
    const validateMigratedEntities = (
      entities: Array<{ id: string; normalizedCollegeName: string }>,
      validCollegeNames: Set<string>
    ): { isValid: boolean; invalidEntities: string[]; errors: string[] } => {
      const invalidEntities: string[] = [];
      const errors: string[] = [];

      entities.forEach(entity => {
        // Check if entity has normalizedCollegeName
        if (!entity.normalizedCollegeName) {
          invalidEntities.push(entity.id);
          errors.push(`Entity ${entity.id} missing normalizedCollegeName`);
          return;
        }

        // Check if the college name exists
        if (!validCollegeNames.has(entity.normalizedCollegeName)) {
          invalidEntities.push(entity.id);
          errors.push(
            `Entity ${entity.id} references non-existent college: ${entity.normalizedCollegeName}`
          );
        }
      });

      return {
        isValid: invalidEntities.length === 0,
        invalidEntities,
        errors,
      };
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 2, maxLength: 10 }
        ),
        fc.array(
          fc.record({
            id: fc.uuid(),
            collegeIndex: fc.integer({ min: 0, max: 9 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (collegeNames, entityConfigs) => {
          // Create valid college names
          const validCollegeNames = new Set(
            collegeNames.map(name => normalizeCollegeName(name))
          );

          // Create migrated entities
          const normalizedNames = Array.from(validCollegeNames);
          const entities = entityConfigs.map(config => ({
            id: config.id,
            normalizedCollegeName: normalizedNames[config.collegeIndex % normalizedNames.length],
          }));

          // Validate all entities
          const result = validateMigratedEntities(entities, validCollegeNames);

          // Property 1: All entities should be valid
          expect(result.isValid).toBe(true);
          expect(result.invalidEntities).toHaveLength(0);
          expect(result.errors).toHaveLength(0);

          // Property 2: All references should exist in valid colleges
          entities.forEach(entity => {
            expect(validCollegeNames.has(entity.normalizedCollegeName)).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that migration detects orphaned references
   */
  test('Property 27 (orphan detection): validation detects entities with invalid college references', () => {
    const validateMigratedEntities = (
      entities: Array<{ id: string; normalizedCollegeName: string }>,
      validCollegeNames: Set<string>
    ): { isValid: boolean; invalidCount: number } => {
      let invalidCount = 0;

      entities.forEach(entity => {
        if (!validCollegeNames.has(entity.normalizedCollegeName)) {
          invalidCount++;
        }
      });

      return {
        isValid: invalidCount === 0,
        invalidCount,
      };
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 2, maxLength: 10 }
        ),
        fc.array(
          fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (validNames, invalidNames, entityIds) => {
          const validCollegeNames = new Set(
            validNames.map(name => normalizeCollegeName(name))
          );
          const invalidNormalized = invalidNames.map(name => normalizeCollegeName(name));

          // Filter out any invalid names that accidentally match valid ones
          const trulyInvalid = invalidNormalized.filter(
            name => !validCollegeNames.has(name)
          );

          if (trulyInvalid.length === 0) {
            return true; // Skip this case
          }

          // Create entities: half valid, half invalid
          const midpoint = Math.ceil(entityIds.length / 2);
          const validNormalized = Array.from(validCollegeNames);
          
          const entities = entityIds.map((id, index) => ({
            id,
            normalizedCollegeName:
              index < midpoint
                ? validNormalized[index % validNormalized.length]
                : trulyInvalid[index % trulyInvalid.length],
          }));

          // Validate
          const result = validateMigratedEntities(entities, validCollegeNames);

          // Count how many should actually be invalid
          const expectedInvalidCount = entityIds.length - midpoint;

          // Property: Should detect invalid entities if there are any
          if (expectedInvalidCount > 0) {
            expect(result.isValid).toBe(false);
            expect(result.invalidCount).toBeGreaterThan(0);
            expect(result.invalidCount).toBeLessThanOrEqual(expectedInvalidCount);
          } else {
            // All entities are valid
            expect(result.isValid).toBe(true);
            expect(result.invalidCount).toBe(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that migration preserves data integrity
   */
  test('Property 25 (integrity): migration preserves all entity data except college reference', () => {
    const migrateEntity = (
      entity: { id: string; name: string; email: string; collegeId: string },
      collegeIdToNameMap: Map<string, string>
    ): { id: string; name: string; email: string; normalizedCollegeName: string } => {
      const normalizedName = collegeIdToNameMap.get(entity.collegeId);
      
      if (!normalizedName) {
        throw new Error(`College ID not found`);
      }

      return {
        id: entity.id,
        name: entity.name,
        email: entity.email,
        normalizedCollegeName: normalizedName,
      };
    };

    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.array(
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 3, maxLength: 30 }),
            email: fc.emailAddress(),
            collegeIndex: fc.integer({ min: 0, max: 4 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (colleges, entityConfigs) => {
          const collegeIdToNameMap = new Map(
            colleges.map(c => [c.id, normalizeCollegeName(c.name)])
          );

          const entities = entityConfigs.map(config => ({
            id: config.id,
            name: config.name,
            email: config.email,
            collegeId: colleges[config.collegeIndex % colleges.length].id,
          }));

          const migrated = entities.map(e => migrateEntity(e, collegeIdToNameMap));

          // Property: All non-college fields should be preserved
          migrated.forEach((m, index) => {
            expect(m.id).toBe(entities[index].id);
            expect(m.name).toBe(entities[index].name);
            expect(m.email).toBe(entities[index].email);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that migration handles missing mappings gracefully
   */
  test('Property 26 (error handling): migration reports entities with unmapped college IDs', () => {
    const migrateWithErrorHandling = (
      entities: Array<{ id: string; collegeId: string }>,
      collegeIdToNameMap: Map<string, string>
    ): { migrated: any[]; failed: Array<{ entityId: string; error: string }> } => {
      const migrated: any[] = [];
      const failed: Array<{ entityId: string; error: string }> = [];

      entities.forEach(entity => {
        const normalizedName = collegeIdToNameMap.get(entity.collegeId);
        
        if (!normalizedName) {
          failed.push({
            entityId: entity.id,
            error: `College ID ${entity.collegeId} not found`,
          });
        } else {
          migrated.push({
            id: entity.id,
            normalizedCollegeName: normalizedName,
          });
        }
      });

      return { migrated, failed };
    };

    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 10 }),
        (validCollegeIds, entityIds) => {
          // Create mapping for only some colleges
          const collegeIdToNameMap = new Map(
            validCollegeIds.map(id => [id, normalizeCollegeName(`College-${id.slice(0, 8)}`)])
          );

          // Create entities: some with valid IDs, some with invalid
          const midpoint = Math.ceil(entityIds.length / 2);
          const entities = entityIds.map((id, index) => ({
            id,
            collegeId:
              index < midpoint
                ? validCollegeIds[index % validCollegeIds.length]
                : `invalid-${id}`,
          }));

          const result = migrateWithErrorHandling(entities, collegeIdToNameMap);

          // Property 1: Failed entities should be reported
          expect(result.failed.length).toBeGreaterThan(0);

          // Property 2: Successfully migrated entities should have normalized names
          result.migrated.forEach(entity => {
            expect(entity.normalizedCollegeName).toBeDefined();
          });

          // Property 3: Total count should match
          expect(result.migrated.length + result.failed.length).toBe(entities.length);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
