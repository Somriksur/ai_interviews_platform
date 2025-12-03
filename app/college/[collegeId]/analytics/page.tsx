"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CollegeAnalyticsPage({ params }: { params: Promise<{ collegeId: string }> }) {
  const [collegeId, setCollegeId] = useState<string>("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCollegeId(resolvedParams.collegeId);
    };
    loadParams();
  }, [params]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href={`/college/${collegeId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View detailed analytics and insights
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Placement Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Placements</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Average Package</span>
                <span className="font-bold">₹0 LPA</span>
              </div>
              <div className="flex justify-between">
                <span>Highest Package</span>
                <span className="font-bold">₹0 LPA</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Interview Performance</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Interviews</span>
                <span className="font-bold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Average Score</span>
                <span className="font-bold">0%</span>
              </div>
              <div className="flex justify-between">
                <span>Pass Rate</span>
                <span className="font-bold">0%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed analytics charts and reports will be available here once you start conducting interviews.
          </p>
        </div>
      </div>
    </div>
  );
}
