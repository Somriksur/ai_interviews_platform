"use client";

import { useState, useEffect } from "react";

interface LearningResource {
    id: string;
    title: string;
    type: "course" | "article" | "video";
    url: string;
    skill: string;
}

interface WeakArea {
    skill: string;
    averageScore: number;
    resources: LearningResource[];
}

export default function LearningPathPage() {
    const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLearningPath();
    }, []);

    const fetchLearningPath = async () => {
        try {
            const response = await fetch("/api/candidate/learning-path");
            if (response.ok) {
                const data = await response.json();
                setWeakAreas(data.weakAreas);
            }
        } catch (error) {
            console.error("Failed to fetch learning path:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">⏳</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Learning Path</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Personalized recommendations based on your interview performance
                </p>

                {weakAreas.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
                        <span className="text-6xl mb-4 block">🎯</span>
                        <h3 className="text-xl font-semibold mb-2">
                            Complete interviews to get recommendations
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            We'll analyze your performance and suggest learning resources
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {weakAreas.map((area) => (
                            <div
                                key={area.skill}
                                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">{area.skill}</h3>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Avg Score: {area.averageScore}/100
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {area.resources.map((resource) => (
                                        <a
                                            key={resource.id}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">
                                                    {resource.type === "course"
                                                        ? "📚"
                                                        : resource.type === "video"
                                                        ? "🎥"
                                                        : "📄"}
                                                </span>
                                                <div>
                                                    <h4 className="font-medium">
                                                        {resource.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                                        {resource.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
