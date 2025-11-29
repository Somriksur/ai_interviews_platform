"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PlacementReport {
  id: string;
  studentId: string;
  driveId: string;
  overallScore: number;
  technicalScore: number;
  communicationRating: number;
  salaryBand: string;
  placementCategory: string;
  strengths: string[];
  weaknesses: string[];
  generatedAt: any;
}

export default function ReportsPage({ params }: { params: { orgId: string } }) {
  const [reports] = useState<PlacementReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    // In a real implementation, fetch reports from API
    // For now, showing the structure
    setLoading(false);
  }, [params.orgId]);

  const getSalaryBandColor = (band: string) => {
    const colors = {
      high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return colors[band as keyof typeof colors] || colors.medium;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${params.orgId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Placement Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            AI-generated placement reports with job matching
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter by Salary Band:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Students</option>
              <option value="high">High Range (8+ LPA)</option>
              <option value="medium">Mid Range (4-8 LPA)</option>
              <option value="low">Entry Level (2-4 LPA)</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Reports will appear here after interview drives are completed
            </p>
            <Link
              href={`/organization/${params.orgId}/interview-drives`}
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View Interview Drives
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Student Report</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${getSalaryBandColor(
                        report.salaryBand
                      )}`}
                    >
                      {report.placementCategory}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{report.overallScore}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Technical Score</div>
                    <div className="text-2xl font-semibold">{report.technicalScore}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Communication Rating
                    </div>
                    <div className="text-2xl font-semibold">{report.communicationRating}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">
                      ✅ Strengths
                    </h4>
                    <ul className="text-sm space-y-1">
                      {report.strengths.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-orange-600 dark:text-orange-400">
                      📈 Areas for Improvement
                    </h4>
                    <ul className="text-sm space-y-1">
                      {report.weaknesses.map((weakness, idx) => (
                        <li key={idx}>• {weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/organization/${params.orgId}/reports/${report.id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Full Report
                  </Link>
                  <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                    📄 Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
