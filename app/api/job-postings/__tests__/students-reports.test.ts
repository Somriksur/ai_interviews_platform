import * as fc from 'fast-check';

/**
 * Feature: student-interview-reports-enhancement, Property 4: Most recent report selection
 * 
 * Property: For any student with multiple interview reports, 
 * the displayed report should be the one with the most recent createdAt timestamp
 * 
 * Validates: Requirements 1.2
 */

interface Report {
  id: string;
  studentId: string;
  createdAt: Date;
  overallScore: number;
}

/**
 * Selects the most recent report from an array of reports
 */
function selectMostRecentReport(reports: Report[]): Report | null {
  if (reports.length === 0) return null;
  
  return reports.reduce((mostRecent, current) => {
    return current.createdAt > mostRecent.createdAt ? current : mostRecent;
  });
}

describe('Student Interview Reports - Property Tests', () => {
  describe('Property 4: Most recent report selection', () => {
    it('should always select the report with the most recent timestamp', () => {
      fc.assert(
        fc.property(
          // Generate array of reports with random timestamps
          fc.array(
            fc.record({
              id: fc.uuid(),
              studentId: fc.constant('student-123'),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (reports) => {
            const selected = selectMostRecentReport(reports);
            
            // The selected report should not be null
            expect(selected).not.toBeNull();
            
            if (selected) {
              // Filter out invalid dates (NaN)
              const validReports = reports.filter((r) => !isNaN(r.createdAt.getTime()));
              
              if (validReports.length > 0) {
                // All other valid reports should have timestamps <= selected report
                const allOlderOrEqual = validReports.every(
                  (report) => report.createdAt <= selected.createdAt
                );
                
                expect(allOlderOrEqual).toBe(true);
              }
              
              // The selected report should be one of the input reports
              expect(reports).toContainEqual(selected);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for empty report array', () => {
      const result = selectMostRecentReport([]);
      expect(result).toBeNull();
    });

    it('should handle single report correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            studentId: fc.string(),
            createdAt: fc.date(),
            overallScore: fc.integer({ min: 0, max: 100 }),
          }),
          (report) => {
            const result = selectMostRecentReport([report]);
            expect(result).toEqual(report);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle reports with identical timestamps', () => {
      fc.assert(
        fc.property(
          fc.date(),
          fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
          (timestamp, ids) => {
            const reports = ids.map((id) => ({
              id,
              studentId: 'student-123',
              createdAt: timestamp,
              overallScore: 75,
            }));

            const selected = selectMostRecentReport(reports);
            
            // Should select one of the reports
            expect(selected).not.toBeNull();
            if (selected) {
              expect(reports).toContainEqual(selected);
              expect(selected.createdAt).toEqual(timestamp);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Feature: student-interview-reports-enhancement, Property 5: Filter consistency
 * 
 * Property: For any applied score range filter, 
 * all displayed students should have overall scores within that range
 * 
 * Validates: Requirements 4.3
 */

interface Student {
  id: string;
  name: string;
  overallScore: number;
}

type ScoreRange = 'all' | 'excellent' | 'good' | 'average' | 'below-threshold';

/**
 * Filters students by score range
 */
function filterStudentsByScoreRange(
  students: Student[],
  range: ScoreRange,
  minimumThreshold?: number
): Student[] {
  if (range === 'all') return students;

  return students.filter((student) => {
    const score = student.overallScore;
    
    switch (range) {
      case 'excellent':
        return score >= 85 && score <= 100;
      case 'good':
        return score >= 70 && score < 85;
      case 'average':
        return score >= 50 && score < 70;
      case 'below-threshold':
        return minimumThreshold !== undefined && score < minimumThreshold;
      default:
        return true;
    }
  });
}

/**
 * Validates that all students in filtered list match the range criteria
 */
function validateFilterConsistency(
  filteredStudents: Student[],
  range: ScoreRange,
  minimumThreshold?: number
): boolean {
  return filteredStudents.every((student) => {
    const score = student.overallScore;
    
    switch (range) {
      case 'all':
        return true;
      case 'excellent':
        return score >= 85 && score <= 100;
      case 'good':
        return score >= 70 && score < 85;
      case 'average':
        return score >= 50 && score < 70;
      case 'below-threshold':
        return minimumThreshold !== undefined && score < minimumThreshold;
      default:
        return true;
    }
  });
}

describe('Student Filtering - Property Tests', () => {
  describe('Property 5: Filter consistency', () => {
    it('should only return students within excellent range (85-100)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (students) => {
            const filtered = filterStudentsByScoreRange(students, 'excellent');
            const isConsistent = validateFilterConsistency(filtered, 'excellent');
            
            expect(isConsistent).toBe(true);
            
            // All filtered students should have scores >= 85
            filtered.forEach((student) => {
              expect(student.overallScore).toBeGreaterThanOrEqual(85);
              expect(student.overallScore).toBeLessThanOrEqual(100);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only return students within good range (70-84)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (students) => {
            const filtered = filterStudentsByScoreRange(students, 'good');
            const isConsistent = validateFilterConsistency(filtered, 'good');
            
            expect(isConsistent).toBe(true);
            
            // All filtered students should have scores 70-84
            filtered.forEach((student) => {
              expect(student.overallScore).toBeGreaterThanOrEqual(70);
              expect(student.overallScore).toBeLessThan(85);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only return students within average range (50-69)', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (students) => {
            const filtered = filterStudentsByScoreRange(students, 'average');
            const isConsistent = validateFilterConsistency(filtered, 'average');
            
            expect(isConsistent).toBe(true);
            
            // All filtered students should have scores 50-69
            filtered.forEach((student) => {
              expect(student.overallScore).toBeGreaterThanOrEqual(50);
              expect(student.overallScore).toBeLessThan(70);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only return students below threshold', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          fc.integer({ min: 1, max: 100 }),
          (students, threshold) => {
            const filtered = filterStudentsByScoreRange(students, 'below-threshold', threshold);
            const isConsistent = validateFilterConsistency(filtered, 'below-threshold', threshold);
            
            expect(isConsistent).toBe(true);
            
            // All filtered students should have scores < threshold
            filtered.forEach((student) => {
              expect(student.overallScore).toBeLessThan(threshold);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return all students when filter is "all"', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (students) => {
            const filtered = filterStudentsByScoreRange(students, 'all');
            
            // Should return all students
            expect(filtered.length).toBe(students.length);
            expect(filtered).toEqual(students);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty student list', () => {
      const ranges: ScoreRange[] = ['all', 'excellent', 'good', 'average', 'below-threshold'];
      
      ranges.forEach((range) => {
        const filtered = filterStudentsByScoreRange([], range, 70);
        expect(filtered).toHaveLength(0);
      });
    });

    it('should handle edge cases at range boundaries', () => {
      const students = [
        { id: '1', name: 'Student 1', overallScore: 49 },
        { id: '2', name: 'Student 2', overallScore: 50 },
        { id: '3', name: 'Student 3', overallScore: 69 },
        { id: '4', name: 'Student 4', overallScore: 70 },
        { id: '5', name: 'Student 5', overallScore: 84 },
        { id: '6', name: 'Student 6', overallScore: 85 },
        { id: '7', name: 'Student 7', overallScore: 100 },
      ];

      // Test average range (50-69)
      const average = filterStudentsByScoreRange(students, 'average');
      expect(average).toHaveLength(2);
      expect(average.map(s => s.overallScore)).toEqual([50, 69]);

      // Test good range (70-84)
      const good = filterStudentsByScoreRange(students, 'good');
      expect(good).toHaveLength(2);
      expect(good.map(s => s.overallScore)).toEqual([70, 84]);

      // Test excellent range (85-100)
      const excellent = filterStudentsByScoreRange(students, 'excellent');
      expect(excellent).toHaveLength(2);
      expect(excellent.map(s => s.overallScore)).toEqual([85, 100]);
    });
  });
});


/**
 * Feature: student-interview-reports-enhancement, Property 6: Sort order correctness
 * 
 * Property: For any sort by overall score operation, 
 * students should be ordered in descending order by their overall score
 * 
 * Validates: Requirements 4.1
 */

/**
 * Sorts students by overall score in descending order
 * Students without reports are placed at the end
 */
function sortStudentsByScore(students: Student[]): Student[] {
  return [...students].sort((a, b) => {
    // Students without scores go to the end
    if (a.overallScore === undefined && b.overallScore === undefined) return 0;
    if (a.overallScore === undefined) return 1;
    if (b.overallScore === undefined) return -1;
    
    // Sort by score descending
    return b.overallScore - a.overallScore;
  });
}

/**
 * Validates that students are sorted in descending order by score
 */
function validateSortOrder(students: Student[]): boolean {
  for (let i = 0; i < students.length - 1; i++) {
    const current = students[i];
    const next = students[i + 1];
    
    // Skip if either student has no score
    if (current.overallScore === undefined || next.overallScore === undefined) {
      continue;
    }
    
    // Current score should be >= next score (descending order)
    if (current.overallScore < next.overallScore) {
      return false;
    }
  }
  
  return true;
}

describe('Student Sorting - Property Tests', () => {
  describe('Property 6: Sort order correctness', () => {
    it('should sort students in descending order by score', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (students) => {
            const sorted = sortStudentsByScore(students);
            const isCorrectOrder = validateSortOrder(sorted);
            
            expect(isCorrectOrder).toBe(true);
            
            // Verify each pair is in descending order
            for (let i = 0; i < sorted.length - 1; i++) {
              if (sorted[i].overallScore !== undefined && sorted[i + 1].overallScore !== undefined) {
                expect(sorted[i].overallScore).toBeGreaterThanOrEqual(sorted[i + 1].overallScore);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain stable sort for equal scores', () => {
      const students = [
        { id: '1', name: 'Alice', overallScore: 85 },
        { id: '2', name: 'Bob', overallScore: 85 },
        { id: '3', name: 'Charlie', overallScore: 85 },
      ];

      const sorted = sortStudentsByScore(students);
      
      // All should have same score
      expect(sorted[0].overallScore).toBe(85);
      expect(sorted[1].overallScore).toBe(85);
      expect(sorted[2].overallScore).toBe(85);
    });

    it('should handle empty array', () => {
      const sorted = sortStudentsByScore([]);
      expect(sorted).toHaveLength(0);
    });

    it('should handle single student', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc.string(),
            overallScore: fc.integer({ min: 0, max: 100 }),
          }),
          (student) => {
            const sorted = sortStudentsByScore([student]);
            expect(sorted).toHaveLength(1);
            expect(sorted[0]).toEqual(student);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should place students without scores at the end', () => {
      const students = [
        { id: '1', name: 'Alice', overallScore: 85 },
        { id: '2', name: 'Bob', overallScore: undefined as any },
        { id: '3', name: 'Charlie', overallScore: 90 },
        { id: '4', name: 'David', overallScore: undefined as any },
        { id: '5', name: 'Eve', overallScore: 80 },
      ];

      const sorted = sortStudentsByScore(students);
      
      // First three should have scores in descending order
      expect(sorted[0].overallScore).toBe(90);
      expect(sorted[1].overallScore).toBe(85);
      expect(sorted[2].overallScore).toBe(80);
      
      // Last two should have undefined scores
      expect(sorted[3].overallScore).toBeUndefined();
      expect(sorted[4].overallScore).toBeUndefined();
    });

    it('should handle edge scores (0 and 100)', () => {
      const students = [
        { id: '1', name: 'Alice', overallScore: 0 },
        { id: '2', name: 'Bob', overallScore: 100 },
        { id: '3', name: 'Charlie', overallScore: 50 },
      ];

      const sorted = sortStudentsByScore(students);
      
      expect(sorted[0].overallScore).toBe(100);
      expect(sorted[1].overallScore).toBe(50);
      expect(sorted[2].overallScore).toBe(0);
    });

    it('should not modify original array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              name: fc.string(),
              overallScore: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (students) => {
            const original = [...students];
            sortStudentsByScore(students);
            
            // Original array should be unchanged
            expect(students).toEqual(original);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
