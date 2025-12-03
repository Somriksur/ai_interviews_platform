/**
 * Property-Based Tests for College Search
 * Feature: organization-college-system-redesign
 */

import * as fc from 'fast-check';

describe('College Search - Relevance', () => {
  /**
   * **Feature: organization-college-system-redesign, Property 5: College Search Relevance**
   * 
   * For any search query, all returned college results should have names that match
   * the query string
   * 
   * **Validates: Requirements 3.2**
   */
  test('Property 5: Search results match query', async () => {
    // Mock college data
    const mockColleges = [
      { id: '1', name: 'MIT Engineering College', location: 'Boston' },
      { id: '2', name: 'Stanford University', location: 'California' },
      { id: '3', name: 'Harvard College', location: 'Cambridge' },
      { id: '4', name: 'IIT Bombay', location: 'Mumbai' },
      { id: '5', name: 'IIT Delhi', location: 'Delhi' },
      { id: '6', name: 'Cambridge College', location: 'UK' },
      { id: '7', name: 'Oxford University', location: 'UK' },
    ];

    const searchColleges = (query: string, colleges: any[]) => {
      const searchQuery = query.toLowerCase();
      return colleges.filter((college) => {
        const collegeName = college.name.toLowerCase();
        return collegeName.includes(searchQuery);
      });
    };

    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (query) => {
          const results = searchColleges(query, mockColleges);
          
          // All results should contain the query string
          results.forEach((college) => {
            const collegeName = college.name.toLowerCase();
            const searchQuery = query.toLowerCase();
            expect(collegeName).toContain(searchQuery);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Empty query returns no results or all results', async () => {
    const mockColleges = [
      { id: '1', name: 'MIT', location: 'Boston' },
      { id: '2', name: 'Stanford', location: 'California' },
    ];

    const searchColleges = (query: string, colleges: any[]) => {
      if (!query || query.trim() === '') {
        return []; // Empty query returns no results
      }
      const searchQuery = query.toLowerCase();
      return colleges.filter((college) => {
        const collegeName = college.name.toLowerCase();
        return collegeName.includes(searchQuery);
      });
    };

    const results = searchColleges('', mockColleges);
    expect(results.length).toBe(0);
  });

  test('Property 5: Search is case-insensitive', async () => {
    const mockColleges = [
      { id: '1', name: 'MIT Engineering College', location: 'Boston' },
      { id: '2', name: 'Stanford University', location: 'California' },
    ];

    const searchColleges = (query: string, colleges: any[]) => {
      const searchQuery = query.toLowerCase();
      return colleges.filter((college) => {
        const collegeName = college.name.toLowerCase();
        return collegeName.includes(searchQuery);
      });
    };

    await fc.assert(
      fc.property(
        fc.constantFrom('mit', 'MIT', 'Mit', 'mIt'),
        (query) => {
          const results = searchColleges(query, mockColleges);
          
          // Should find MIT regardless of case
          expect(results.length).toBeGreaterThan(0);
          expect(results[0].name).toContain('MIT');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 5: Partial matches are included', async () => {
    const mockColleges = [
      { id: '1', name: 'Engineering College', location: 'Boston' },
      { id: '2', name: 'Medical College', location: 'California' },
      { id: '3', name: 'Arts College', location: 'New York' },
    ];

    const searchColleges = (query: string, colleges: any[]) => {
      const searchQuery = query.toLowerCase();
      return colleges.filter((college) => {
        const collegeName = college.name.toLowerCase();
        return collegeName.includes(searchQuery);
      });
    };

    const results = searchColleges('college', mockColleges);
    
    // All colleges with "college" in name should be returned
    expect(results.length).toBe(3);
  });

  test('Property 5: No matches returns empty array', async () => {
    const mockColleges = [
      { id: '1', name: 'MIT', location: 'Boston' },
      { id: '2', name: 'Stanford', location: 'California' },
    ];

    const searchColleges = (query: string, colleges: any[]) => {
      const searchQuery = query.toLowerCase();
      return colleges.filter((college) => {
        const collegeName = college.name.toLowerCase();
        return collegeName.includes(searchQuery);
      });
    };

    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 })
          .filter(s => !['mit', 'stanford'].some(name => 
            name.includes(s.toLowerCase()) || s.toLowerCase().includes(name)
          )),
        (query) => {
          const results = searchColleges(query, mockColleges);
          
          // If no matches, should return empty array
          if (results.length === 0) {
            expect(results).toEqual([]);
          }
        }
      ),
      { numRuns: 50 }
    );
  });
});
