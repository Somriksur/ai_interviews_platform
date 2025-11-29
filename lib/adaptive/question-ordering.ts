/**
 * Smart Question Ordering
 * Orders questions for optimal interview flow
 */

import { DifficultyLevel } from "@/components/DifficultySelector";
import { QuestionWithDifficulty } from "./difficulty-engine";

export type OrderingStrategy = "progressive" | "mixed" | "hardest-first" | "random";

/**
 * Order questions using specified strategy
 */
export function orderQuestions(
    questions: QuestionWithDifficulty[],
    strategy: OrderingStrategy = "progressive"
): QuestionWithDifficulty[] {
    switch (strategy) {
        case "progressive":
            return progressiveOrdering(questions);
        case "mixed":
            return mixedOrdering(questions);
        case "hardest-first":
            return hardestFirstOrdering(questions);
        case "random":
            return randomOrdering(questions);
        default:
            return questions;
    }
}

/**
 * Progressive: Easy → Medium → Hard
 */
function progressiveOrdering(questions: QuestionWithDifficulty[]): QuestionWithDifficulty[] {
    const difficultyOrder: Record<DifficultyLevel, number> = {
        easy: 1,
        medium: 2,
        hard: 3,
    };

    return [...questions].sort((a, b) => {
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
}

/**
 * Mixed: Alternate between difficulties
 */
function mixedOrdering(questions: QuestionWithDifficulty[]): QuestionWithDifficulty[] {
    const easy = questions.filter((q) => q.difficulty === "easy");
    const medium = questions.filter((q) => q.difficulty === "medium");
    const hard = questions.filter((q) => q.difficulty === "hard");

    const result: QuestionWithDifficulty[] = [];
    const maxLength = Math.max(easy.length, medium.length, hard.length);

    for (let i = 0; i < maxLength; i++) {
        if (i < easy.length) result.push(easy[i]);
        if (i < medium.length) result.push(medium[i]);
        if (i < hard.length) result.push(hard[i]);
    }

    return result;
}

/**
 * Hardest First: Hard → Medium → Easy
 */
function hardestFirstOrdering(questions: QuestionWithDifficulty[]): QuestionWithDifficulty[] {
    const difficultyOrder: Record<DifficultyLevel, number> = {
        hard: 1,
        medium: 2,
        easy: 3,
    };

    return [...questions].sort((a, b) => {
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
}

/**
 * Random: Shuffle questions
 */
function randomOrdering(questions: QuestionWithDifficulty[]): QuestionWithDifficulty[] {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Group questions by tech stack and difficulty
 */
export function groupByTechStackAndDifficulty(
    questions: QuestionWithDifficulty[]
): Map<string, QuestionWithDifficulty[]> {
    const groups = new Map<string, QuestionWithDifficulty[]>();

    questions.forEach((question) => {
        const key = `${question.techStack || "general"}-${question.difficulty}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(question);
    });

    return groups;
}

/**
 * Create balanced interview with specified difficulty distribution
 */
export function createBalancedInterview(
    allQuestions: QuestionWithDifficulty[],
    targetCount: number,
    distribution: { easy: number; medium: number; hard: number }
): QuestionWithDifficulty[] {
    const easy = allQuestions.filter((q) => q.difficulty === "easy");
    const medium = allQuestions.filter((q) => q.difficulty === "medium");
    const hard = allQuestions.filter((q) => q.difficulty === "hard");

    const selected: QuestionWithDifficulty[] = [];

    // Select questions according to distribution
    selected.push(...easy.slice(0, distribution.easy));
    selected.push(...medium.slice(0, distribution.medium));
    selected.push(...hard.slice(0, distribution.hard));

    // If we don't have enough, fill with available questions
    while (selected.length < targetCount && selected.length < allQuestions.length) {
        const remaining = allQuestions.filter((q) => !selected.includes(q));
        if (remaining.length > 0) {
            selected.push(remaining[0]);
        } else {
            break;
        }
    }

    return progressiveOrdering(selected);
}
