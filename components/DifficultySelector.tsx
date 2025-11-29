"use client";



export type DifficultyLevel = "easy" | "medium" | "hard";

interface DifficultySelectorProps {
    value: DifficultyLevel;
    onChange: (difficulty: DifficultyLevel) => void;
    disabled?: boolean;
    className?: string;
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string; color: string; icon: string }[] = [
    { value: "easy", label: "Easy", color: "bg-green-500 hover:bg-green-600", icon: "🟢" },
    { value: "medium", label: "Medium", color: "bg-yellow-500 hover:bg-yellow-600", icon: "🟡" },
    { value: "hard", label: "Hard", color: "bg-red-500 hover:bg-red-600", icon: "🔴" },
];

export default function DifficultySelector({
    value,
    onChange,
    disabled = false,
    className = "",
}: DifficultySelectorProps) {
    return (
        <div className={`flex gap-2 ${className}`}>
            {DIFFICULTY_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    disabled={disabled}
                    className={`
                        px-4 py-2 rounded-lg font-medium transition-all
                        ${value === option.value
                            ? `${option.color} text-white shadow-lg scale-105`
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                        }
                        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        tap-target
                    `}
                >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                </button>
            ))}
        </div>
    );
}
