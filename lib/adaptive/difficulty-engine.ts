/**
 * Adaptive Difficulty Engine
 * Adjusts question difficulty based on candidate performance
 */

import { DifficultyLevel } from "@/components/DifficultySelector";

export interface PerformanceMetrics {
    correctAnswers: number;
    totalAnswers: number;
    averageScore: number;
    lastThreeScores: number[];
}

export interface QuestionWithDifficulty {
    id: string;
    question: string;
    difficulty: DifficultyLevel;
    techStack?: string;
}

/**
 * Calculate recommended difficulty based on performance
 */
export function calculateRecommendedDifficulty(
    metrics: PerformanceMetrics
): DifficultyLevel {
    const { averageScore, lastThreeScores } = metrics;

    // If we have recent scores, use trend analysis
    if (lastThreeScores.length >= 2) {
        const trend = calculateTrend(lastThreeScores);
        
        // Improving performance - increase difficulty
        if (trend > 10 && averageScore >= 75) {
            return "hard";
        }
        
        // Declining performance - decrease difficulty
        if (trend < -10 && averageScore < 60) {
            return "easy";
        }
    }

    // Based on average score
    if (averageScore >= 80) {
        return "hard";
    } else if (averageScore >= 60) {
        return "medium";
    } else {
        return "easy";
    }
}

/**
 * Calculate performance trend (positive = improving, negative = declining)
 */
function calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    const recent = scores[scores.length - 1];
    const previous = scores[scores.length - 2];

    return recent - previous;
}

/**
 * Order questions by difficulty (progressive difficulty)
 */
export function orderQuestionsByDifficulty(
    questions: QuestionWithDifficulty[],
    startDifficulty: DifficultyLevel = "easy"
): QuestionWithDifficulty[] {
    const difficultyOrder: DifficultyLevel[] = ["easy", "medium", "hard"];
    const startIndex = difficultyOrder.indexOf(startDifficulty);

    // Rotate difficulty order based on start difficulty
    const orderedDifficulties = [
        ...difficultyOrder.slice(startIndex),
        ...difficultyOrder.slice(0, startIndex),
    ];

    // Sort questions by difficulty order
    return [...questions].sort((a, b) => {
        const aIndex = orderedDifficulties.indexOf(a.difficulty);
        const bIndex = orderedDifficulties.indexOf(b.difficulty);
        return aIndex - bIndex;
    });
}

/**
 * Adaptive question selection based on real-time performance
 */
export function selectNextQuestion(
    remainingQuestions: QuestionWithDifficulty[],
    currentMetrics: PerformanceMetrics
): QuestionWithDifficulty | null {
    if (remainingQuestions.length === 0) return null;

    const recommendedDifficulty = calculateRecommendedDifficulty(currentMetrics);

    // Try to find a question matching recommended difficulty
    const matchingQuestion = remainingQuestions.find(
        (q) => q.difficulty === recommendedDifficulty
    );

    if (matchingQuestion) {
        return matchingQuestion;
    }

    // Fallback: return first available question
    return remainingQuestions[0];
}

/**
 * Calculate difficulty-adjusted score
 */
export function calculateDifficultyAdjustedScore(
    rawScore: number,
    difficulty: DifficultyLevel
): number {
    const multipliers = {
        easy: 1.0,
        medium: 1.1,
        hard: 1.2,
    };

    const adjustedScore = rawScore * multipliers[difficulty];
    return Math.min(100, adjustedScore); // Cap at 100
}

/**
 * Get difficulty distribution for analytics
 */
export function getDifficultyDistribution(
    questions: QuestionWithDifficulty[]
): Record<DifficultyLevel, number> {
    return questions.reduce(
        (acc, q) => {
            acc[q.difficulty]++;
            return acc;
        },
        { easy: 0, medium: 0, hard: 0 } as Record<DifficultyLevel, number>
    );
}

/**
 * Validate difficulty balance (should have mix of difficulties)
 */
export function validateDifficultyBalance(
    questions: QuestionWithDifficulty[]
): { isBalanced: boolean; message: string } {
    const distribution = getDifficultyDistribution(questions);
    const total = questions.length;

    // Check if any difficulty is completely missing
    const missingDifficulties = Object.entries(distribution)
        .filter(([_, count]) => count === 0)
        .map(([difficulty]) => difficulty);

    if (missingDifficulties.length > 0 && total >= 3) {
        return {
            isBalanced: false,
            message: `Consider adding ${missingDifficulties.join(", ")} questions for better balance`,
        };
    }

    // Check if one difficulty dominates (>70%)
    const dominantDifficulty = Object.entries(distribution).find(
        ([_, count]) => count / total > 0.7
    );

    if (dominantDifficulty && total >= 5) {
        return {
            isBalanced: false,
            message: `Too many ${dominantDifficulty[0]} questions. Consider more variety.`,
        };
    }

    return {
        isBalanced: true,
        message: "Difficulty distribution is well balanced",
    };
}
