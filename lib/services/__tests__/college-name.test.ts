/**
 * Property-Based Tests for College Name Normalization Service
 * Feature: college-name-primary-key
 */

import * as fc from 'fast-check';
import {
  normalizeCollegeName,
  validateCollegeName,
  areCollegeNamesEqual,
  matchesSearchQuery,
  calculateMatchScore,
  sortByRelevance,
  getCollegeNameVariations,
  suggestSimilarColleges,
  createCollegeWithNormalizedName,
  collegeExists,
  findCollegeByNormalizedName,
  findCollegeByName,
  type College,
} from '../college-name.service';

// Helper to create a test college
function createTestCollege(name: string, id: string = 'test-id'): College {
  return {
    id,
    name,
    normalizedName: normalizeCollegeName(name),
    organizationId: 'org-1',
    location: 'Test City',
    contactEmail: 'test@college.edu',
    contactPhone: '1234567890',
    adminId: 'admin-1',
    createdAt: new Date(),
  };
}

describe('College Name Normalization - Core Normalization', () => {
  /**
   * **Feature: college-name-primary-key, Property 1: College name normalization consistency**
   * 
   * For any college name string, normalizing it should produce a lowercase, trimmed version,
   * and normalizing the result again should produce the same value (idempotence).
   * 
   * **Validates: Requirements 1.1, 7.1**
   */
  test('Property 1: Normalizing a college name twice produces the same result (idempotence)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }),
        async (collegeName) => {
          const normalized1 = normalizeCollegeName(collegeName);
          const normalized2 = normalizeCollegeName(normalized1);
          
          // Idempotence: f(x) = f(f(x))
          expect(normalized1).toBe(normalized2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Normalization always produces lowercase output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 100 }),
        async (collegeName) => {
          const normalized = normalizeCollegeName(collegeName);
          
          // Should be lowercase
          expect(normalized).toBe(normalized.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Normalization removes leading and trailing whitespace', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 3, maxLength: 50 }),
          leadingSpaces: fc.integer({ min: 0, max: 5 }),
          trailingSpaces: fc.integer({ min: 0, max: 5 }),
        }),
        async ({ name, leadingSpaces, trailingSpaces }) => {
          const paddedName = ' '.repeat(leadingSpaces) + name + ' '.repeat(trailingSpaces);
          const normalized = normalizeCollegeName(paddedName);
          
          // Should not have leading or trailing spaces
          expect(normalized).toBe(normalized.trim());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 1: Empty or invalid inputs return empty string', () => {
    expect(normalizeCollegeName('')).toBe('');
    expect(normalizeCollegeName('   ')).toBe('');
    expect(normalizeCollegeName(null as any)).toBe('');
    expect(normalizeCollegeName(undefined as any)).toBe('');
  });

  test('Property 1: Normalization handles special characters consistently', () => {
    expect(normalizeCollegeName("St. Mary's College")).toBe("st. mary's college");
    expect(normalizeCollegeName("O'Reilly Institute")).toBe("o'reilly institute");
    expect(normalizeCollegeName("MIT & Harvard")).toBe("mit & harvard");
  });
});

describe('College Name Normalization - Validation', () => {
  test('Property: Valid college names pass validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 200 })
          .filter(s => {
            const trimmed = s.trim();
            return trimmed.length >= 3 && /^[a-zA-Z0-9\s\-'.&]+$/.test(trimmed);
          }),
        async (collegeName) => {
          const result = validateCollegeName(collegeName);
          expect(result.isValid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Names shorter than 3 characters fail validation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 2 }),
        async (collegeName) => {
          const result = validateCollegeName(collegeName);
          expect(result.isValid).toBe(false);
          // Error message can be either "required" for empty or "at least 3 characters" for short
          expect(result.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Names longer than 200 characters fail validation', () => {
    const longName = 'A'.repeat(201);
    const result = validateCollegeName(longName);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('not exceed 200 characters');
  });

  test('Property: Names with invalid characters fail validation', () => {
    const invalidNames = [
      'College@Name',
      'College#Name',
      'College$Name',
      'College%Name',
      'College*Name',
    ];

    invalidNames.forEach(name => {
      const result = validateCollegeName(name);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('can only contain');
    });
  });

  test('Property: Valid special characters are allowed', () => {
    const validNames = [
      "St. Mary's College",
      "O'Reilly Institute",
      "MIT & Harvard",
      "College-University",
      "Tech.Institute",
    ];

    validNames.forEach(name => {
      const result = validateCollegeName(name);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('College Name Normalization - Equality and Comparison', () => {
  /**
   * **Feature: college-name-primary-key, Property 3: College name resolution consistency**
   * 
   * For any college and any case variation of its name, resolving the name should
   * always return the same college.
   * 
   * **Validates: Requirements 1.3**
   */
  test('Property 3: Case variations of the same name are considered equal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName.charAt(0).toUpperCase() + collegeName.slice(1).toLowerCase(),
          ];

          // All variations should be equal
          for (let i = 0; i < variations.length; i++) {
            for (let j = 0; j < variations.length; j++) {
              expect(areCollegeNamesEqual(variations[i], variations[j])).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Different names are not equal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name1: fc.string({ minLength: 3, maxLength: 50 }),
          name2: fc.string({ minLength: 3, maxLength: 50 }),
        }).filter(({ name1, name2 }) => 
          normalizeCollegeName(name1) !== normalizeCollegeName(name2)
        ),
        async ({ name1, name2 }) => {
          expect(areCollegeNamesEqual(name1, name2)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Whitespace differences do not affect equality', () => {
    expect(areCollegeNamesEqual('MIT', '  MIT  ')).toBe(true);
    expect(areCollegeNamesEqual('  Harvard  ', 'Harvard')).toBe(true);
    expect(areCollegeNamesEqual('  Stanford  ', '  stanford  ')).toBe(true);
  });
});

describe('College Name Normalization - Search and Matching', () => {
  /**
   * **Feature: college-name-primary-key, Property 2: Case-insensitive search completeness**
   * 
   * For any college in the system and any case variation of its name, searching with
   * that variation should return the college in the results.
   * 
   * **Validates: Requirements 1.2, 2.5, 4.2, 8.1**
   */
  test('Property 2: Search matches regardless of case', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const variations = [
            collegeName.toLowerCase(),
            collegeName.toUpperCase(),
            collegeName,
          ];

          // All variations should match
          variations.forEach(query => {
            expect(matchesSearchQuery(collegeName, query)).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Partial matches are found', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          // Take a substring as query
          const startIdx = Math.floor(collegeName.length / 4);
          const endIdx = Math.floor(collegeName.length * 3 / 4);
          const query = collegeName.substring(startIdx, endIdx).trim();

          if (query.length >= 2) {
            expect(matchesSearchQuery(collegeName, query)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: college-name-primary-key, Property 24: Search ranking by match quality**
   * 
   * For any search query, results should be ordered with exact matches (after normalization)
   * appearing before partial matches.
   * 
   * **Validates: Requirements 8.2**
   */
  test('Property 24: Exact matches score higher than partial matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 5, maxLength: 30 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const exactScore = calculateMatchScore(collegeName, collegeName);
          const partialQuery = collegeName.substring(0, Math.floor(collegeName.length / 2));
          const partialScore = calculateMatchScore(collegeName, partialQuery);

          expect(exactScore).toBeGreaterThan(partialScore);
          expect(exactScore).toBe(100); // Exact match should be 100
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 24: Matches at the start score higher than matches in the middle', () => {
    const collegeName = 'Massachusetts Institute of Technology';
    
    const startMatchScore = calculateMatchScore(collegeName, 'Massachusetts');
    const middleMatchScore = calculateMatchScore(collegeName, 'Institute');
    
    expect(startMatchScore).toBeGreaterThan(middleMatchScore);
  });

  test('Property 24: Match scores are always between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          collegeName: fc.string({ minLength: 3, maxLength: 50 }),
          query: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ collegeName, query }) => {
          const score = calculateMatchScore(collegeName, query);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 24: Sort by relevance maintains order', async () => {
    const colleges = [
      createTestCollege('Massachusetts Institute of Technology', '1'),
      createTestCollege('MIT College of Engineering', '2'),
      createTestCollege('California Institute of Technology', '3'),
      createTestCollege('Stanford University', '4'),
    ];

    const sorted = sortByRelevance(colleges, 'MIT');
    
    // Exact match or starts with should come first
    expect(sorted[0].name).toContain('MIT');
  });
});

describe('College Name Normalization - Display and Formatting', () => {
  /**
   * **Feature: college-name-primary-key, Property 4: Display casing preservation**
   * 
   * For any college retrieved from the system, the displayed name should match the
   * original casing provided during creation, not the normalized version.
   * 
   * **Validates: Requirements 1.4, 2.4, 6.5, 8.3**
   */
  test('Property 4: Original casing is preserved in college object', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (originalName) => {
          const college = createCollegeWithNormalizedName({
            id: 'test-id',
            name: originalName,
            organizationId: 'org-1',
            location: 'Test City',
            contactEmail: 'test@college.edu',
            contactPhone: '1234567890',
            adminId: 'admin-1',
            createdAt: new Date(),
          });

          // Original name should be preserved
          expect(college.name).toBe(originalName);
          // But normalized name should be lowercase
          expect(college.normalizedName).toBe(originalName.trim().toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 4: Display name is never the normalized version', async () => {
    const testCases = [
      'MIT',
      'Harvard University',
      'Stanford',
      "St. Mary's College",
    ];

    testCases.forEach(name => {
      const college = createTestCollege(name);
      const normalized = normalizeCollegeName(name);
      
      // If original has uppercase, display should preserve it
      if (name !== normalized) {
        expect(college.name).not.toBe(normalized);
        expect(college.name).toBe(name);
      }
    });
  });
});

describe('College Name Normalization - Foreign Key References', () => {
  /**
   * **Feature: college-name-primary-key, Property 5: Foreign key normalization**
   * 
   * For any entity that references a college (student, job posting, interview drive),
   * the stored college name reference should be in normalized form.
   * 
   * **Validates: Requirements 1.5**
   */
  test('Property 5: College objects always have normalized name field', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const college = createCollegeWithNormalizedName({
            id: 'test-id',
            name: collegeName,
            organizationId: 'org-1',
            location: 'Test City',
            contactEmail: 'test@college.edu',
            contactPhone: '1234567890',
            adminId: 'admin-1',
            createdAt: new Date(),
          });

          // Must have normalizedName field
          expect(college.normalizedName).toBeDefined();
          // Must be properly normalized
          expect(college.normalizedName).toBe(normalizeCollegeName(collegeName));
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Normalized name is always lowercase', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const college = createTestCollege(collegeName);
          
          expect(college.normalizedName).toBe(college.normalizedName.toLowerCase());
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('College Name Normalization - Lookup and Resolution', () => {
  test('Property: Finding college by normalized name is consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.string({ minLength: 3, maxLength: 30 })
            .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
          { minLength: 1, maxLength: 10 }
        ),
        async (names) => {
          // Create unique names by appending index to avoid duplicates
          const uniqueNames = names.map((name, i) => `${name}-${i}`);
          const colleges = uniqueNames.map((name, i) => createTestCollege(name, `id-${i}`));
          
          // For each college, finding by normalized name should return the same college
          colleges.forEach(college => {
            const found = findCollegeByNormalizedName(college.normalizedName, colleges);
            expect(found).toBeDefined();
            expect(found?.id).toBe(college.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Finding college by any case variation returns the same college', async () => {
    const colleges = [
      createTestCollege('MIT', '1'),
      createTestCollege('Harvard', '2'),
      createTestCollege('Stanford', '3'),
    ];

    const variations = ['MIT', 'mit', 'Mit', 'mIt'];
    
    variations.forEach(variation => {
      const found = findCollegeByName(variation, colleges);
      expect(found).toBeDefined();
      expect(found?.id).toBe('1');
    });
  });

  test('Property: College existence check is case-insensitive', async () => {
    const colleges = [
      createTestCollege('MIT', '1'),
      createTestCollege('Harvard University', '2'),
    ];

    expect(collegeExists(normalizeCollegeName('MIT'), colleges)).toBe(true);
    expect(collegeExists(normalizeCollegeName('mit'), colleges)).toBe(true);
    expect(collegeExists(normalizeCollegeName('Harvard University'), colleges)).toBe(true);
    expect(collegeExists(normalizeCollegeName('harvard university'), colleges)).toBe(true);
    expect(collegeExists(normalizeCollegeName('Stanford'), colleges)).toBe(false);
  });
});

describe('College Name Normalization - Variations and Suggestions', () => {
  test('Property: Name variations include the original name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const variations = getCollegeNameVariations(collegeName);
          
          // Should include original name
          expect(variations).toContain(collegeName);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Variations are unique', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 3, maxLength: 50 })
          .filter(s => /^[a-zA-Z0-9\s\-'.&]+$/.test(s.trim())),
        async (collegeName) => {
          const variations = getCollegeNameVariations(collegeName);
          const uniqueVariations = new Set(variations);
          
          expect(variations.length).toBe(uniqueVariations.size);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Similar college suggestions are limited', async () => {
    const colleges = Array.from({ length: 20 }, (_, i) => 
      createTestCollege(`College ${i}`, `id-${i}`)
    );

    const suggestions = suggestSimilarColleges('College', colleges, 5);
    
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  test('Property: Suggestions are ordered by similarity', () => {
    const colleges = [
      createTestCollege('MIT', '1'),
      createTestCollege('MITT', '2'),
      createTestCollege('MITTT', '3'),
      createTestCollege('Harvard', '4'),
    ];

    const suggestions = suggestSimilarColleges('MIT', colleges);
    
    // MIT should be first (exact match)
    expect(suggestions[0].name).toBe('MIT');
    // MITT should be second (1 character difference)
    if (suggestions.length > 1) {
      expect(suggestions[1].name).toBe('MITT');
    }
  });
});
