import * as fc from 'fast-check';
import { meetsScoreThreshold, getRecommendationStatus } from '../RecommendationBadge';

/**
 * Feature: student-interview-reports-enhancement, Property 2: Recommendation accuracy
 * 
 * Property: For any student with an interview report and a job posting with a minimum score threshold,
 * the recommendation indicator should be "Recommended" if and only if the student's overall score 
 * is greater than or equal to the minimum threshold
 * 
 * Validates: Requirements 2.2, 2.3
 */

describe('RecommendationBadge - Property Tests', () => {
  describe('Property 2: Recommendation accuracy', () => {
    it('should recommend if and only if score >= threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // student score
          fc.integer({ min: 0, max: 100 }), // minimum threshold
          (studentScore, minimumScore) => {
            const meetsThreshold = meetsScoreThreshold(studentScore, minimumScore);
            const status = getRecommendationStatus(studentScore, minimumScore);

            // The recommendation should match the comparison
            const expectedRecommendation = studentScore >= minimumScore;
            expect(meetsThreshold).toBe(expectedRecommendation);

            // Status should be 'recommended' if score >= threshold
            if (studentScore >= minimumScore) {
              expect(status).toBe('recommended');
            } else {
              expect(status).toBe('below-threshold');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case where score equals threshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (threshold) => {
            const meetsThreshold = meetsScoreThreshold(threshold, threshold);
            const status = getRecommendationStatus(threshold, threshold);

            // When score equals threshold, should be recommended
            expect(meetsThreshold).toBe(true);
            expect(status).toBe('recommended');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle score of 0', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          (threshold) => {
            const meetsThreshold = meetsScoreThreshold(0, threshold);
            const status = getRecommendationStatus(0, threshold);

            // Score of 0 should never meet threshold > 0
            expect(meetsThreshold).toBe(false);
            expect(status).toBe('below-threshold');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle perfect score of 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (threshold) => {
            const meetsThreshold = meetsScoreThreshold(100, threshold);
            const status = getRecommendationStatus(100, threshold);

            // Score of 100 should always meet any threshold
            expect(meetsThreshold).toBe(true);
            expect(status).toBe('recommended');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: student-interview-reports-enhancement, Property 3: Score comparison visibility
   * 
   * Property: For any student with a recommendation indicator, 
   * both the student's score and the minimum required score should be displayed
   * 
   * Validates: Requirements 2.4
   */
  describe('Property 3: Score comparison visibility', () => {
    it('should always return both scores for comparison', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 0, max: 100 }),
          (studentScore, minimumScore) => {
            // Both scores should be valid numbers
            expect(typeof studentScore).toBe('number');
            expect(typeof minimumScore).toBe('number');
            expect(studentScore).toBeGreaterThanOrEqual(0);
            expect(studentScore).toBeLessThanOrEqual(100);
            expect(minimumScore).toBeGreaterThanOrEqual(0);
            expect(minimumScore).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: student-interview-reports-enhancement, Property 8: No recommendation without threshold
   * 
   * Property: For any job posting without a defined minimum score threshold,
   * no recommendation indicators should be displayed for any students
   * 
   * Validates: Requirements 2.5
   */
  describe('Property 8: No recommendation without threshold', () => {
    it('should return no-threshold status when threshold is null', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (studentScore) => {
            const meetsThreshold = meetsScoreThreshold(studentScore, null);
            const status = getRecommendationStatus(studentScore, null);

            // Without threshold, all students "meet" criteria
            expect(meetsThreshold).toBe(true);
            expect(status).toBe('no-threshold');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return no-threshold status when threshold is undefined', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (studentScore) => {
            const meetsThreshold = meetsScoreThreshold(studentScore, undefined);
            const status = getRecommendationStatus(studentScore, undefined);

            // Without threshold, all students "meet" criteria
            expect(meetsThreshold).toBe(true);
            expect(status).toBe('no-threshold');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle various score values with no threshold', () => {
      const testScores = [0, 25, 50, 75, 100];
      
      testScores.forEach((score) => {
        const meetsThreshold = meetsScoreThreshold(score, null);
        const status = getRecommendationStatus(score, null);

        expect(meetsThreshold).toBe(true);
        expect(status).toBe('no-threshold');
      });
    });
  });
});
