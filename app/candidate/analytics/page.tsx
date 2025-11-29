"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import PerformanceCharts from "@/components/PerformanceCharts";
import { calculateCandidateAnalytics, compareToPeers } from "@/lib/analytics/candidate-analytics";

export default function CandidateAnalyticsPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data - In production, fetch from API
        const mockInterviews = [
            {
                id: "1",
                role: "Frontend Developer",
                totalScore: 75,
                categoryScores: [
                    { name: "Technical Skills", score: 80 },
                    { name: "Problem Solving", score: 70 },
                    { name: "Communication", score: 75 },
                ],
                techstack: ["React", "TypeScript", "CSS"],
                createdAt: "2024-01-15",
                strengths: ["Strong React knowledge", "Good code structure"],
                areasForImprovement: ["Algorithm optimization", "Testing"],
            },
            {
                id: "2",
                role: "Full Stack Developer",
                totalScore: 82,
                categoryScores: [
                    { name: "Technical Skills", score: 85 },
                    { name: "Problem Solving", score: 80 },
                    { name: "Communication", score: 80 },
                ],
                techstack: ["React", "Node.js", "PostgreSQL"],
                createdAt: "2024-02-20",
                strengths: ["Full stack expertise", "Database design"],
                areasForImprovement: ["System design", "Scalability"],
            },
        ];

        const result = calculateCandidateAnalytics(mockInterviews);
        setAnalytics(result);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="container-responsive py-8 text-center">
                <div className="animate-spin text-4xl">⏳</div>
                <p className="mt-4">Loading analytics...</p>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="container-responsive py-8 text-center">
                <p>No analytics data available</p>
            </div>
        );
    }

    const peerComparison = compareToPeers(analytics.averageScore, [65, 70, 75, 80, 85, 90]);

    return (
        <div className="container-responsive py-8 space-mobile">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-responsive-2xl font-bold">Performance Analytics</h1>
                    <p className="text-gray-500 mt-1">Track your progress and improvement</p>
                </div>
                <Button onClick={() => router.back()} variant="outline">
                    ← Back
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card card-mobile bg-blue-50 dark:bg-blue-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Average Score
                    </h3>
                    <p className="text-3xl font-bold mt-2">{analytics.averageScore}</p>
                    <p className="text-xs text-gray-500 mt-1">Out of 100</p>
                </div>

                <div className="card card-mobile bg-green-50 dark:bg-green-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Improvement
                    </h3>
                    <p className={`text-3xl font-bold mt-2 ${analytics.improvement >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {analytics.improvement >= 0 ? "+" : ""}{analytics.improvement}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Since first interview</p>
                </div>

                <div className="card card-mobile bg-purple-50 dark:bg-purple-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Total Interviews
                    </h3>
                    <p className="text-3xl font-bold mt-2">{analytics.totalInterviews}</p>
                    <p className="text-xs text-gray-500 mt-1">Completed</p>
                </div>

                <div className="card card-mobile bg-yellow-50 dark:bg-yellow-900/20">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Peer Ranking
                    </h3>
                    <p className="text-3xl font-bold mt-2">{peerComparison.ranking}</p>
                    <p className="text-xs text-gray-500 mt-1">{peerComparison.percentile}th percentile</p>
                </div>
            </div>

            {/* Charts */}
            <PerformanceCharts
                scoreTrends={analytics.scoreTrends}
                skillProficiency={analytics.skillProficiency}
                categoryBreakdown={analytics.categoryBreakdown}
            />

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="card card-mobile">
                    <h3 className="text-lg font-semibold mb-4 text-green-600">
                        ✅ Your Strengths
                    </h3>
                    <ul className="space-y-2">
                        {analytics.strengths.map((strength: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500">•</span>
                                <span>{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="card card-mobile">
                    <h3 className="text-lg font-semibold mb-4 text-yellow-600">
                        📈 Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                        {analytics.weaknesses.map((weakness: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-yellow-500">•</span>
                                <span>{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="card card-mobile mt-8">
                <h3 className="text-lg font-semibold mb-4">🤖 AI-Powered Recommendations</h3>
                <div className="space-y-3">
                    {analytics.recommendations.map((rec: string, i: number) => (
                        <div
                            key={i}
                            className="p-4 bg-primary/10 rounded-lg border border-primary/20"
                        >
                            <p className="text-sm">{rec}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Export Button */}
            <div className="mt-8 text-center">
                <Button className="tap-target">
                    📄 Export Analytics Report (PDF)
                </Button>
            </div>
        </div>
    );
}
