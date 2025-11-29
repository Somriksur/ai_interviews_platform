"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InterviewDrive {
  id: string;
  name: string;
  description: string;
  role: string;
  status: string;
  createdAt: any;
  stats: {
    totalStudents: number;
    completedInterviews: number;
    averageScore: number;
  };
}

export default function InterviewDrivesPage({ params }: { params: { orgId: string } }) {
  const [drives, setDrives] = useState<InterviewDrive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, [params.orgId]);

  const fetchDrives = async () => {
    try {
      const response = await fetch(`/api/organization/${params.orgId}/interview-drives`);
      if (response.ok) {
        const { drives } = await response.json();
        setDrives(drives);
      }
    } catch (error) {
      console.error("Error fetching drives:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/organization/${params.orgId}/dashboard`}
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Interview Drives</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage campus placement drives
            </p>
          </div>
          <Link href={`/organization/${params.orgId}/interview-drives/create`}>
            <Button>+ Create New Drive</Button>
          </Link>
        </div>

        {/* Drives List */}
        {drives.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold mb-2">No Interview Drives Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first campus placement drive
            </p>
            <Link href={`/organization/${params.orgId}/interview-drives/create`}>
              <Button>+ Create Drive</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {drives.map((drive) => (
              <div
                key={drive.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{drive.name}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(
                          drive.status
                        )}`}
                      >
                        {drive.status}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{drive.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>📋 Role: {drive.role}</span>
                      <span>
                        📅 Created:{" "}
                        {new Date(drive.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{drive.stats.totalStudents}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Tagged Students
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{drive.stats.completedInterviews}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {drive.stats.averageScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Score</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/organization/${params.orgId}/interview-drives/${drive.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  {drive.status === "completed" && (
                    <Link
                      href={`/organization/${params.orgId}/interview-drives/${drive.id}/reports`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      📊 Reports
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
