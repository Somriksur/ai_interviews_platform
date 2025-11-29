"use client";

import {
    LineChart,
    Line,
    BarChart,
    Bar,
    RadarChart,
    Radar,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface ScoreTrendData {
    date: string;
    score: number;
    role: string;
}

interface SkillData {
    skill: string;
    score: number;
    fullMark: number;
}

interface CategoryData {
    category: string;
    score: number;
}

interface PerformanceChartsProps {
    scoreTrends?: ScoreTrendData[];
    skillProficiency?: SkillData[];
    categoryBreakdown?: CategoryData[];
    className?: string;
}

export default function PerformanceCharts({
    scoreTrends = [],
    skillProficiency = [],
    categoryBreakdown = [],
    className = "",
}: PerformanceChartsProps) {
    return (
        <div className={`space-y-8 ${className}`}>
            {/* Score Trends Over Time */}
            {scoreTrends.length > 0 && (
                <div className="card card-mobile">
                    <h3 className="text-lg font-semibold mb-4">📈 Score Trends Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={scoreTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Skill Proficiency Radar Chart */}
            {skillProficiency.length > 0 && (
                <div className="card card-mobile">
                    <h3 className="text-lg font-semibold mb-4">🎯 Tech Stack Proficiency</h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={skillProficiency}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="skill" />
                            <PolarRadiusAxis domain={[0, 100]} />
                            <Radar
                                name="Proficiency"
                                dataKey="score"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.6}
                            />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Category Breakdown Bar Chart */}
            {categoryBreakdown.length > 0 && (
                <div className="card card-mobile">
                    <h3 className="text-lg font-semibold mb-4">📊 Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="score" fill="#10b981" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
