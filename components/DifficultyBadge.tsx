"use client";

import { DifficultyLevel } from "./DifficultySelector";

interface DifficultyBadgeProps {
    difficulty: DifficultyLevel;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
}

const DIFFICULTY_CONFIG = {
    easy: {
        label: "Easy",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: "🟢",
    },
    medium: {
        label: "Medium",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: "🟡",
    },
    hard: {
        label: "Hard",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: "🔴",
    },
};

const SIZE_CLASSES = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
};

export default function DifficultyBadge({
    difficulty,
    size = "md",
    showIcon = true,
    className = "",
}: DifficultyBadgeProps) {
    const config = DIFFICULTY_CONFIG[difficulty];

    return (
        <span
            className={`
                inline-flex items-center gap-1 rounded-full font-medium
                ${config.color}
                ${SIZE_CLASSES[size]}
                ${className}
            `}
        >
            {showIcon && <span>{config.icon}</span>}
            {config.label}
        </span>
    );
}
