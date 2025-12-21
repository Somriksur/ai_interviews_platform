"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface InterviewDrive {
  id: string;
  name: string;
  description: string;
  role: string;
  status: string;
  createdAt: any;
  collegeNames?: string[];
  stats: {
    totalStudents: number;
    completedInterviews: number;
    averageScore: number;
  };
}

export default function InterviewDrivesPage({ params }: { params: Promise<{ orgId: string }> }) {
  const { orgId } = use(params);
  const [drives, setDrives] = useState<InterviewDrive[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, [orgId]);

  const fetchDrives = async () => {
    try {
      const response = await fetch(`/api/organization/${orgId}/interview-drives`);
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
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pending Approval",
      active: "Active",
      "in-progress": "In Progress", 
      completed: "Completed",
      cancelled: "Cancelled",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handleDeleteDrive = async (driveId: string, driveName: string) => {
    if (!confirm(`Are you sure you want to delete "${driveName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/interview-drives/${driveId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("✅ Interview drive deleted successfully!");
        fetchDrives(); // Refresh the list
      } else {
        alert("❌ Failed to delete interview drive");
      }
    } catch (error) {
      console.error("Error deleting drive:", error);
      alert("❌ An error occurred");
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href={`/organization/${orgId}/dashboard`}
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Interview Drives</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Create and manage campus placement drives
            </p>
          </div>
          <Link href={`/organization/${orgId}/interview-drives/create`}>
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
            <Link href={`/organization/${orgId}/interview-drives/create`}>
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
                        {getStatusLabel(drive.status)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">{drive.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                      <span>📋 Role: {drive.role}</span>
                      <span>
                        📅 Created:{" "}
                        {new Date(drive.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                    {drive.collegeNames && drive.collegeNames.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">🏫 Colleges:</span>
                        <div className="flex flex-wrap gap-1">
                          {drive.collegeNames.map((collegeName, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                            >
                              {collegeName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
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
                    href={`/organization/${orgId}/interview-drives/${drive.id}`}
                    className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Details
                  </Link>
                  {drive.status === "completed" && (
                    <Link
                      href={`/organization/${orgId}/interview-drives/${drive.id}/reports`}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      📊 Reports
                    </Link>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteDrive(drive.id, drive.name)}
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
