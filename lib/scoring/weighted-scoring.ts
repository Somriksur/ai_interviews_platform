/**
 * Weighted Scoring System
 * Calculate scores with custom weights per question
 */

export interface WeightedScore {
    questionId: string;
    rawScore: number;
    weight: number;
    weightedScore: number;
}

/**
 * Calculate weighted average score
 */
export function calculateWeightedScore(
    scores: number[],
    weights: number[]
): number {
    if (scores.length !== weights.length) {
        throw new Error("Scores and weights arrays must have the same length");
    }

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;

    const weightedSum = scores.reduce(
        (sum, score, index) => sum + score * weights[index],
        0
    );

    return Math.round((weightedSum / totalWeight) * 100) / 100;
}

/**
 * Calculate weighted scores for each question
 */
export function calculateWeightedScores(
    scores: number[],
    weights: number[]
): WeightedScore[] {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    return scores.map((score, index) => ({
        questionId: `q${index + 1}`,
        rawScore: score,
        weight: weights[index],
        weightedScore: (score * weights[index]) / totalWeight,
    }));
}

/**
 * Get weight presets for different roles
 */
export function getWeightPresets(role: string, questionCount: number): Record<string, number[]> {
    const presets: Record<string, number[]> = {
        equal: Array(questionCount).fill(5),
        progressive: Array.from({ length: questionCount }, (_, i) => Math.min(10, i + 3)),
        "high-first": Array.from({ length: questionCount }, (_, i) => Math.max(1, 10 - i)),
    };

    // Role-specific presets
    if (role.includes("Senior") || role.includes("Lead")) {
        presets["senior-focus"] = Array.from({ length: questionCount }, (_, i) =>
            i < 2 ? 10 : 5
        );
    }

    if (role.includes("Junior")) {
        presets["junior-focus"] = Array.from({ length: questionCount }, (_, i) =>
            i >= questionCount - 2 ? 10 : 5
        );
    }

    return presets;
}

/**
 * Validate weights
 */
export function validateWeights(weights: number[]): { valid: boolean; error?: string } {
    if (weights.length === 0) {
        return { valid: false, error: "No weights provided" };
    }

    if (weights.some((w) => w < 1 || w > 10)) {
        return { valid: false, error: "Weights must be between 1 and 10" };
    }

    if (weights.every((w) => w === 0)) {
        return { valid: false, error: "At least one weight must be greater than 0" };
    }

    return { valid: true };
}
