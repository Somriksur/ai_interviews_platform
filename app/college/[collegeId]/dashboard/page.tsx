"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface College {
  id: string;
  name: string;
  organizationId: string;
  stats: {
    totalStudents: number;
    interviewsCompleted: number;
    averagePlacementScore: number;
  };
}

export default function CollegeDashboard({ params }: { params: { collegeId: string } }) {
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollegeData();
  }, [params.collegeId]);

  const fetchCollegeData = async () => {
    try {
      const response = await fetch(`/api/colleges/${params.collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setCollege(data);
      }
    } catch (error) {
      console.error("Error fetching college data:", error);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${college?.organizationId}/colleges`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Colleges
          </Link>
          <h1 className="text-3xl font-bold mb-2">{college?.name} Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage students and view placement statistics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-3xl font-bold mt-2">{college?.stats.totalStudents || 0}</p>
              </div>
              <div className="text-4xl">👨‍🎓</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Interviews Completed</p>
                <p className="text-3xl font-bold mt-2">{college?.stats.interviewsCompleted || 0}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-3xl font-bold mt-2">
                  {college?.stats.averagePlacementScore.toFixed(1) || 0}
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href={`/college/${params.collegeId}/students`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">👥</div>
              <div>
                <h3 className="text-lg font-semibold">Manage Students</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add and manage student list
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/college/${params.collegeId}/reports`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">Placement Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View student placement reports
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/college/${params.collegeId}/analytics`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📈</div>
              <div>
                <h3 className="text-lg font-semibold">Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View detailed analytics
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
