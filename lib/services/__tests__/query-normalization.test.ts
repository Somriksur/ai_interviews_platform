/**
 * Property-based tests for query normalization consistency
 * Tests that queries by college name with different casings return identical results
 */

import * as fc from 'fast-check';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

describe('Query Normalization Property Tests', () => {
  /**
   * **Feature: college-name-primary-key, Property 21: Query normalization consistency**
   * **Validates: Requirements 7.2**
   * 
   * For any query by college name with different casings, the results should be identical.
   */
  test('Property 21: queries with different casings return identical results', () => {
    // Simulates querying a collection by normalized college name
    const queryByCollegeName = (
      collegeName: string,
      entities: Array<{ id: string; normalizedCollegeName: string; data: any }>
    ): Array<{ id: string; data: any }> => {
      const normalized = normalizeCollegeName(collegeName);
      return entities
        .filter(entity => entity.normalizedCollegeName === normalized)
        .map(entity => ({ id: entity.id, data: entity.data }));
    };

    fc.assert(
      fc.property(
        // Generate a college name
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        // Generate entities
        fc.array(
          fc.record({
            id: fc.uuid(),
            belongsToCollege: fc.boolean(),
            data: fc.record({
              name: fc.string({ minLength: 3, maxLength: 30 }),
              value: fc.integer({ min: 0, max: 100 }),
            }),
          }),
          { minLength: 5, maxLength: 20 }
        ),
        (collegeName, entityConfigs) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);

          // Create entities - some belong to this college, some don't
          const entities = entityConfigs.map(config => ({
            id: config.id,
            normalizedCollegeName: config.belongsToCollege
              ? normalizedCollegeName
              : normalizeCollegeName(config.id), // Different college
            data: config.data,
          }));

          // Create different casing variations of the college name
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName,
            // Mixed case variations
            collegeName.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
          ];

          // Query with each variation
          const results = variations.map(variation =>
            queryByCollegeName(variation, entities)
          );

          // Property 1: All queries should return the same number of results
          const firstResultCount = results[0].length;
          results.forEach(result => {
            expect(result.length).toBe(firstResultCount);
          });

          // Property 2: All queries should return the same entity IDs
          const firstResultIds = new Set(results[0].map(r => r.id));
          results.forEach(result => {
            const resultIds = new Set(result.map(r => r.id));
            expect(resultIds).toEqual(firstResultIds);
          });

          // Property 3: Results should only include entities from the target college
          results.forEach(result => {
            result.forEach(entity => {
              const originalEntity = entities.find(e => e.id === entity.id);
              expect(originalEntity?.normalizedCollegeName).toBe(normalizedCollegeName);
            });
          });

          // Property 4: All queries should return identical data
          for (let i = 1; i < results.length; i++) {
            expect(results[i]).toEqual(results[0]);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that normalization is idempotent in queries
   */
  test('Property 21 (idempotence): normalizing query input multiple times produces same results', () => {
    const queryByCollegeName = (
      collegeName: string,
      entities: Array<{ normalizedCollegeName: string; id: string }>
    ): string[] => {
      const normalized = normalizeCollegeName(collegeName);
      return entities
        .filter(e => e.normalizedCollegeName === normalized)
        .map(e => e.id);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName, entityIds) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);

          // Create entities all belonging to this college
          const entities = entityIds.map(id => ({
            id,
            normalizedCollegeName,
          }));

          // Query with the original name
          const result1 = queryByCollegeName(collegeName, entities);

          // Query with the normalized name
          const result2 = queryByCollegeName(normalizedCollegeName, entities);

          // Query with the double-normalized name
          const doubleNormalized = normalizeCollegeName(normalizedCollegeName);
          const result3 = queryByCollegeName(doubleNormalized, entities);

          // All should return identical results
          expect(result1).toEqual(result2);
          expect(result2).toEqual(result3);
          expect(new Set(result1)).toEqual(new Set(entityIds));

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that queries handle whitespace correctly
   */
  test('Property 21 (whitespace): queries ignore leading/trailing whitespace', () => {
    const queryByCollegeName = (
      collegeName: string,
      entities: Array<{ normalizedCollegeName: string; id: string }>
    ): string[] => {
      const normalized = normalizeCollegeName(collegeName);
      return entities
        .filter(e => e.normalizedCollegeName === normalized)
        .map(e => e.id);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName, entityIds) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);

          // Create entities
          const entities = entityIds.map(id => ({
            id,
            normalizedCollegeName,
          }));

          // Create variations with different whitespace
          const variations = [
            collegeName,
            ` ${collegeName}`,
            `${collegeName} `,
            ` ${collegeName} `,
            `  ${collegeName}  `,
            `\t${collegeName}\t`,
          ];

          // Query with each variation
          const results = variations.map(variation =>
            queryByCollegeName(variation, entities)
          );

          // All should return identical results
          results.forEach(result => {
            expect(new Set(result)).toEqual(new Set(entityIds));
            expect(result.length).toBe(entityIds.length);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that empty results are consistent across casings
   */
  test('Property 21 (empty results): queries for non-existent colleges return empty consistently', () => {
    const queryByCollegeName = (
      collegeName: string,
      entities: Array<{ normalizedCollegeName: string; id: string }>
    ): string[] => {
      const normalized = normalizeCollegeName(collegeName);
      return entities
        .filter(e => e.normalizedCollegeName === normalized)
        .map(e => e.id);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (collegeName1, collegeName2, entityIds) => {
          // Ensure the two college names are different after normalization
          const normalized1 = normalizeCollegeName(collegeName1);
          const normalized2 = normalizeCollegeName(collegeName2);

          if (normalized1 === normalized2) {
            return true; // Skip this case
          }

          // Create entities for college1 only
          const entities = entityIds.map(id => ({
            id,
            normalizedCollegeName: normalized1,
          }));

          // Query for college2 with different casings
          const variations = [
            collegeName2.toLowerCase(),
            collegeName2.toUpperCase(),
            collegeName2,
          ];

          const results = variations.map(variation =>
            queryByCollegeName(variation, entities)
          );

          // All queries for non-existent college should return empty
          results.forEach(result => {
            expect(result).toHaveLength(0);
            expect(result).toEqual([]);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test query consistency across multiple entity types
   */
  test('Property 21 (multi-entity): normalization works consistently across different entity types', () => {
    const queryEntities = <T extends { normalizedCollegeName: string }>(
      collegeName: string,
      entities: T[]
    ): T[] => {
      const normalized = normalizeCollegeName(collegeName);
      return entities.filter(e => e.normalizedCollegeName === normalized);
    };

    fc.assert(
      fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        (collegeName, studentIds, jobIds, driveIds) => {
          const normalizedCollegeName = normalizeCollegeName(collegeName);

          // Create different entity types
          const students = studentIds.map(id => ({
            id,
            type: 'student' as const,
            normalizedCollegeName,
          }));

          const jobPostings = jobIds.map(id => ({
            id,
            type: 'job' as const,
            normalizedCollegeName,
          }));

          const interviewDrives = driveIds.map(id => ({
            id,
            type: 'drive' as const,
            normalizedCollegeName,
          }));

          // Query each entity type with different casings
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName,
          ];

          variations.forEach(variation => {
            const studentResults = queryEntities(variation, students);
            const jobResults = queryEntities(variation, jobPostings);
            const driveResults = queryEntities(variation, interviewDrives);

            // Each entity type should return all its entities
            expect(studentResults.length).toBe(studentIds.length);
            expect(jobResults.length).toBe(jobIds.length);
            expect(driveResults.length).toBe(driveIds.length);

            // Verify IDs match
            expect(new Set(studentResults.map(s => s.id))).toEqual(new Set(studentIds));
            expect(new Set(jobResults.map(j => j.id))).toEqual(new Set(jobIds));
            expect(new Set(driveResults.map(d => d.id))).toEqual(new Set(driveIds));
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
