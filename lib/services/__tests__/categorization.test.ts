/**
 * Property-Based Tests for Student Job Categorization
 * Feature: organization-college-system-redesign
 */

import * as fc from 'fast-check';
import {
  categorizeLPA,
  getSalaryBand,
  calculateSkillMatch,
  calculateJobMatchScore,
  determineRecommendedLPA,
  matchStudentWithJobs,
  categorizeStudentsByLPA,
} from '../categorization.service';

describe('Student Job Categorization - LPA Categorization', () => {
  /**
   * **Feature: organization-college-system-redesign, Property 17: LPA Categorization Validity**
   * 
   * For any job readiness score, the LPA categorization should be consistent and
   * within valid ranges
   * 
   * **Validates: Requirements 9.2**
   */
  test('Property 17: LPA categorization is consistent for all scores', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        async (score) => {
          const category = categorizeLPA(score);

          // Verify categorization logic
          if (score >= 85) {
            expect(category).toBe('High-Range Package (8+ LPA)');
          } else if (score >= 65) {
            expect(category).toBe('Mid-Range Package (4-8 LPA)');
          } else {
            expect(category).toBe('Entry-Level Package (2-4 LPA)');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 17: Salary band matches LPA category', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 100 }),
        async (score) => {
          const band = getSalaryBand(score);
          const category = categorizeLPA(score);

          // Verify band and category alignment
          if (band === 'high') {
            expect(category).toContain('8+ LPA');
          } else if (band === 'medium') {
            expect(category).toContain('4-8 LPA');
          } else {
            expect(category).toContain('2-4 LPA');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 17: Boundary values are correctly categorized', () => {
    // Test exact boundaries
    expect(categorizeLPA(0)).toBe('Entry-Level Package (2-4 LPA)');
    expect(categorizeLPA(64)).toBe('Entry-Level Package (2-4 LPA)');
    expect(categorizeLPA(65)).toBe('Mid-Range Package (4-8 LPA)');
    expect(categorizeLPA(84)).toBe('Mid-Range Package (4-8 LPA)');
    expect(categorizeLPA(85)).toBe('High-Range Package (8+ LPA)');
    expect(categorizeLPA(100)).toBe('High-Range Package (8+ LPA)');
  });

  test('Property 17: Higher scores always result in higher or equal LPA bands', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          score1: fc.integer({ min: 0, max: 100 }),
          score2: fc.integer({ min: 0, max: 100 }),
        }),
        async ({ score1, score2 }) => {
          const band1 = getSalaryBand(score1);
          const band2 = getSalaryBand(score2);

          const bandOrder = { low: 0, medium: 1, high: 2 };

          if (score1 > score2) {
            expect(bandOrder[band1]).toBeGreaterThanOrEqual(bandOrder[band2]);
          } else if (score1 < score2) {
            expect(bandOrder[band1]).toBeLessThanOrEqual(bandOrder[band2]);
          } else {
            expect(band1).toBe(band2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Student Job Categorization - Skill Matching', () => {
  test('Property: Skill match is always between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          studentSkills: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 0, maxLength: 10 }),
          requiredSkills: fc.array(fc.string({ minLength: 3, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        }),
        async ({ studentSkills, requiredSkills }) => {
          const matchScore = calculateSkillMatch(studentSkills, requiredSkills);

          expect(matchScore).toBeGreaterThanOrEqual(0);
          expect(matchScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Perfect skill match returns 100', () => {
    const skills = ['JavaScript', 'React', 'Node.js'];
    const matchScore = calculateSkillMatch(skills, skills);
    expect(matchScore).toBe(100);
  });

  test('Property: No matching skills returns 0', () => {
    const studentSkills = ['Python', 'Django', 'Flask'];
    const requiredSkills = ['JavaScript', 'React', 'Node.js'];
    const matchScore = calculateSkillMatch(studentSkills, requiredSkills);
    expect(matchScore).toBe(0);
  });

  test('Property: Skill matching is case-insensitive', () => {
    const studentSkills = ['javascript', 'REACT', 'Node.JS'];
    const requiredSkills = ['JavaScript', 'React', 'Node.js'];
    const matchScore = calculateSkillMatch(studentSkills, requiredSkills);
    expect(matchScore).toBe(100);
  });

  test('Property: More student skills than required still works', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          requiredSkills: fc.array(fc.constantFrom('JavaScript', 'Python', 'Java'), { minLength: 1, maxLength: 3 }),
        }),
        async ({ requiredSkills }) => {
          const studentSkills = [...requiredSkills, 'ExtraSkill1', 'ExtraSkill2'];
          const matchScore = calculateSkillMatch(studentSkills, requiredSkills);
          expect(matchScore).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Student Job Categorization - Job Matching', () => {
  test('Property: Job match score is always between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          technicalScore: fc.integer({ min: 0, max: 100 }),
          communicationRating: fc.integer({ min: 0, max: 100 }),
          overallScore: fc.integer({ min: 0, max: 100 }),
        }),
        async ({ technicalScore, communicationRating, overallScore }) => {
          const report = {
            technicalScore,
            communicationRating,
            overallScore,
            skillInsights: {
              technical: ['JavaScript', 'React'],
              communication: ['Clear communication'],
              problemSolving: ['Analytical thinking'],
              leadership: [],
            },
          };

          const job = {
            id: 'job1',
            role: 'Developer',
            skills: ['JavaScript', 'React'],
            salaryRange: { min: 400000, max: 800000, category: 'mid' as const },
          };

          const matchScore = calculateJobMatchScore(report, job);

          expect(matchScore).toBeGreaterThanOrEqual(0);
          expect(matchScore).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Students with higher scores get better job matches', async () => {
    const job = {
      id: 'job1',
      role: 'Developer',
      skills: ['JavaScript', 'React'],
      salaryRange: { min: 400000, max: 800000, category: 'mid' as const },
    };

    const highPerformer = {
      technicalScore: 90,
      communicationRating: 85,
      overallScore: 88,
      skillInsights: {
        technical: ['JavaScript', 'React', 'Node.js'],
        communication: ['Excellent communication'],
        problemSolving: ['Strong problem-solving'],
        leadership: [],
      },
    };

    const lowPerformer = {
      technicalScore: 50,
      communicationRating: 45,
      overallScore: 48,
      skillInsights: {
        technical: ['JavaScript'],
        communication: ['Basic communication'],
        problemSolving: [],
        leadership: [],
      },
    };

    const highScore = calculateJobMatchScore(highPerformer, job);
    const lowScore = calculateJobMatchScore(lowPerformer, job);

    expect(highScore).toBeGreaterThan(lowScore);
  });
});

describe('Student Job Categorization - Student Grouping', () => {
  test('Property: All students are categorized into exactly one LPA band', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            studentId: fc.uuid(),
            studentName: fc.string({ minLength: 3, maxLength: 30 }),
            technicalScore: fc.integer({ min: 0, max: 100 }),
            communicationRating: fc.integer({ min: 0, max: 100 }),
            overallScore: fc.integer({ min: 0, max: 100 }),
            skillInsights: fc.constant({
              technical: ['Skill1'],
              communication: ['Skill2'],
              problemSolving: ['Skill3'],
              leadership: [],
            }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        async (reports) => {
          const categorized = categorizeStudentsByLPA(reports);

          const totalCategorized =
            categorized.high.length +
            categorized.medium.length +
            categorized.low.length;

          // All students should be categorized
          expect(totalCategorized).toBe(reports.length);

          // No duplicates across categories
          const allIds = [
            ...categorized.high.map(s => s.studentId),
            ...categorized.medium.map(s => s.studentId),
            ...categorized.low.map(s => s.studentId),
          ];
          const uniqueIds = new Set(allIds);
          expect(uniqueIds.size).toBe(reports.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Students in higher bands have higher scores', async () => {
    const reports = [
      {
        studentId: '1',
        studentName: 'High Performer',
        technicalScore: 90,
        communicationRating: 88,
        overallScore: 89,
        skillInsights: {
          technical: ['Skill1'],
          communication: ['Skill2'],
          problemSolving: ['Skill3'],
          leadership: [],
        },
      },
      {
        studentId: '2',
        studentName: 'Medium Performer',
        technicalScore: 70,
        communicationRating: 68,
        overallScore: 69,
        skillInsights: {
          technical: ['Skill1'],
          communication: ['Skill2'],
          problemSolving: ['Skill3'],
          leadership: [],
        },
      },
      {
        studentId: '3',
        studentName: 'Low Performer',
        technicalScore: 50,
        communicationRating: 48,
        overallScore: 49,
        skillInsights: {
          technical: ['Skill1'],
          communication: ['Skill2'],
          problemSolving: ['Skill3'],
          leadership: [],
        },
      },
    ];

    const categorized = categorizeStudentsByLPA(reports);

    // Verify high band has highest scores
    if (categorized.high.length > 0) {
      const minHighScore = Math.min(...categorized.high.map(s => s.score));
      expect(minHighScore).toBeGreaterThanOrEqual(85);
    }

    // Verify medium band has medium scores
    if (categorized.medium.length > 0) {
      const scores = categorized.medium.map(s => s.score);
      scores.forEach(score => {
        expect(score).toBeGreaterThanOrEqual(65);
        expect(score).toBeLessThan(85);
      });
    }

    // Verify low band has low scores
    if (categorized.low.length > 0) {
      const maxLowScore = Math.max(...categorized.low.map(s => s.score));
      expect(maxLowScore).toBeLessThan(65);
    }
  });
});
