"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface InterviewHistory {
    id: string;
    role: string;
    score: number;
    completedAt: Date;
    status: string;
}

export default function InterviewHistoryPage() {
    const [history, setHistory] = useState<InterviewHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            // Fetch from API
            const response = await fetch("/api/candidate/history");
            if (response.ok) {
                const data = await response.json();
                setHistory(data.history);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
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
                <h1 className="text-3xl font-bold mb-8">Interview History</h1>

                {/* Timeline */}
                <div className="space-y-6">
                    {history.map((interview, index) => (
                        <div
                            key={interview.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                            onClick={() => router.push(`/candidate/feedback/${interview.id}`)}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-2xl">
                                        {index + 1}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold mb-2">
                                        {interview.role}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <span>Score: {interview.score}/100</span>
                                        <span>•</span>
                                        <span>
                                            {new Date(interview.completedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            interview.score >= 80
                                                ? "bg-green-100 text-green-800"
                                                : interview.score >= 60
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {interview.score >= 80
                                            ? "Excellent"
                                            : interview.score >= 60
                                            ? "Good"
                                            : "Needs Improvement"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {history.length === 0 && (
                    <div className="text-center py-12">
                        <span className="text-6xl mb-4 block">📋</span>
                        <h3 className="text-xl font-semibold mb-2">No history yet</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Complete interviews to see your history here
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
