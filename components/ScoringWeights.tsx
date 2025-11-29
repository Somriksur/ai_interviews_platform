"use client";

import { useState } from "react";
import { Button } from "./ui/button";

export interface QuestionWeight {
    questionId: string;
    question: string;
    weight: number;
}

interface ScoringWeightsProps {
    questions: string[];
    weights: number[];
    onChange: (weights: number[]) => void;
    className?: string;
}

export default function ScoringWeights({
    questions,
    weights,
    onChange,
    className = "",
}: ScoringWeightsProps) {
    const [showPresets, setShowPresets] = useState(false);

    const handleWeightChange = (index: number, value: number) => {
        const newWeights = [...weights];
        newWeights[index] = value;
        onChange(newWeights);
    };

    const applyPreset = (preset: string) => {
        let newWeights: number[] = [];
        
        switch (preset) {
            case "equal":
                newWeights = questions.map(() => 5);
                break;
            case "progressive":
                newWeights = questions.map((_, i) => Math.min(10, i + 3));
                break;
            case "high-first":
                newWeights = questions.map((_, i) => Math.max(1, 10 - i));
                break;
            case "focus-middle":
                newWeights = questions.map((_, i) => {
                    const mid = Math.floor(questions.length / 2);
                    return Math.max(1, 10 - Math.abs(i - mid) * 2);
                });
                break;
            default:
                newWeights = questions.map(() => 5);
        }
        
        onChange(newWeights);
        setShowPresets(false);
    };

    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const averageWeight = totalWeight / weights.length;

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">⚖️ Question Weights</h3>
                    <p className="text-sm text-gray-500">
                        Set importance for each question (1-10 scale)
                    </p>
                </div>
                <Button
                    onClick={() => setShowPresets(!showPresets)}
                    variant="outline"
                    size="sm"
                >
                    📋 Presets
                </Button>
            </div>

            {/* Presets Dropdown */}
            {showPresets && (
                <div className="card p-4 space-y-2 animate-fadeIn">
                    <h4 className="font-semibold text-sm mb-2">Weight Presets:</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            onClick={() => applyPreset("equal")}
                            variant="outline"
                            size="sm"
                        >
                            Equal (5/5/5...)
                        </Button>
                        <Button
                            onClick={() => applyPreset("progressive")}
                            variant="outline"
                            size="sm"
                        >
                            Progressive (3→10)
                        </Button>
                        <Button
                            onClick={() => applyPreset("high-first")}
                            variant="outline"
                            size="sm"
                        >
                            High First (10→1)
                        </Button>
                        <Button
                            onClick={() => applyPreset("focus-middle")}
                            variant="outline"
                            size="sm"
                        >
                            Focus Middle
                        </Button>
                    </div>
                </div>
            )}

            {/* Weight Summary */}
            <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">Total Weight:</span>
                        <span className="font-bold ml-2">{totalWeight}</span>
                    </div>
                    <div>
                        <span className="text-gray-600">Average:</span>
                        <span className="font-bold ml-2">{averageWeight.toFixed(1)}</span>
                    </div>
                </div>
            </div>

            {/* Question Weights */}
            <div className="space-y-3">
                {questions.map((question, index) => (
                    <div
                        key={index}
                        className="card p-4 space-y-3"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <span className="font-semibold">Q{index + 1}:</span>
                                <p className="text-sm mt-1">{question}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {[...Array(weights[index] || 0)].map((_, i) => (
                                    <span key={i} className="text-yellow-500">⭐</span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium min-w-[80px]">
                                Weight: {weights[index] || 5}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={weights[index] || 5}
                                onChange={(e) =>
                                    handleWeightChange(index, parseInt(e.target.value))
                                }
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                <button
                                    onClick={() =>
                                        handleWeightChange(
                                            index,
                                            Math.max(1, (weights[index] || 5) - 1)
                                        )
                                    }
                                    className="px-2 py-1 border rounded hover:bg-accent"
                                >
                                    -
                                </button>
                                <button
                                    onClick={() =>
                                        handleWeightChange(
                                            index,
                                            Math.min(10, (weights[index] || 5) + 1)
                                        )
                                    }
                                    className="px-2 py-1 border rounded hover:bg-accent"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Weight Impact */}
                        <div className="text-xs text-gray-500">
                            Impact: {((weights[index] / totalWeight) * 100).toFixed(1)}% of total score
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
