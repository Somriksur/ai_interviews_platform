"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Drive {
  id: string;
  name: string;
  description: string;
  role: string;
  colleges: string[];
  status: string;
  finalized?: boolean;
  createdAt: any;
  interviewConfig?: {
    level: string;
    type: string;
    techstack: string[];
    amount: number;
  };
}

interface College {
  id: string;
  name: string;
  location?: string;
}

export default function DriveDetailsPage({
  params,
}: {
  params: Promise<{ orgId: string; driveId: string }>;
}) {
  const { orgId, driveId } = use(params);
  const [drive, setDrive] = useState<Drive | null>(null);
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeError, setFinalizeError] = useState<string | null>(null);

  useEffect(() => {
    fetchDriveDetails();
  }, [driveId]);

  const fetchDriveDetails = async () => {
    try {
      // Fetch drive details
      const driveResponse = await fetch(`/api/interview-drives/${driveId}`);
      if (driveResponse.ok) {
        const driveData = await driveResponse.json();
        setDrive(driveData);

        // Fetch college details
        if (driveData.colleges && driveData.colleges.length > 0) {
          const collegePromises = driveData.colleges.map(async (collegeId: string) => {
            try {
              const res = await fetch(`/api/colleges/${collegeId}`);
              if (res.ok) {
                return await res.json();
              }
              return null;
            } catch (error) {
              console.error(`Error fetching college ${collegeId}:`, error);
              return null;
            }
          });
          const collegesData = await Promise.all(collegePromises);
          // Filter out null values from failed requests
          setColleges(collegesData.filter((c): c is College => c !== null && c.id));
        }
      }
    } catch (error) {
      console.error("Error fetching drive details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateResults = async () => {
    if (!confirm("Generate rankings and readiness scores for this drive? This action will finalize all evaluation results.")) {
      return;
    }

    setFinalizing(true);
    setFinalizeError(null);

    try {
      const response = await fetch(`/api/interview-drives/${driveId}/finalize-results`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate results");
      }

      const result = await response.json();
      console.log("✅ Results generated:", result);

      // Update drive state
      setDrive((prev) => prev ? { ...prev, finalized: true } : null);

      alert(`Results generated successfully!\n\nRankings: ${result.rankingCount}\nReadiness Scores: ${result.readinessCount}\nVersion: ${result.version}`);
      
      // FIX: Auto-redirect to reports page
      router.push(`/organization/${orgId}/interview-drives/${driveId}/reports`);
    } catch (error) {
      console.error("❌ Error generating results:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Check if it's an index building error
      if (errorMessage.includes("currently building") || errorMessage.includes("cannot be used yet")) {
        setFinalizeError("Database indexes are still building. Please wait 2-3 minutes and try again.");
        alert("Database indexes are still building. This is normal for new deployments.\n\nPlease wait 2-3 minutes and try again.");
      } else {
        setFinalizeError(errorMessage);
        alert(`Failed to generate results: ${errorMessage}`);
      }
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!drive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Drive not found</h2>
          <Link
            href={`/organization/${orgId}/interview-drives`}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Drives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${orgId}/interview-drives`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Drives
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{drive.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {drive.description || "No description"}
              </p>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                drive.status === "active"
                  ? "bg-green-100 text-green-800"
                  : drive.status === "completed"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {drive.status}
            </span>
          </div>
        </div>

        {/* Drive Details Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Drive Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Job Role</p>
              <p className="font-medium">{drive.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="font-medium">
                {drive.createdAt
                  ? new Date(drive.createdAt.seconds * 1000).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            {drive.interviewConfig && (
              <>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Experience Level</p>
                  <p className="font-medium capitalize">{drive.interviewConfig.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Interview Type</p>
                  <p className="font-medium capitalize">{drive.interviewConfig.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Number of Questions</p>
                  <p className="font-medium">{drive.interviewConfig?.amount || 'N/A'}</p>
                </div>
                {drive.interviewConfig?.techstack && drive.interviewConfig.techstack.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tech Stack</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {drive.interviewConfig.techstack.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Participating Colleges */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Participating Colleges ({colleges.length})
          </h2>
          {colleges.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No colleges selected</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colleges.map((college) => {
                return (
                  <div key={college.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <h3 className="font-semibold">{college.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {college.location || "Location not specified"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Generation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Results & Rankings</h2>
          {drive?.finalized ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold">Results Generated</p>
                  <p className="text-sm">Rankings and readiness scores are available</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => window.location.href = `/organization/${orgId}/analytics`}
              >
                📊 View Analytics
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Generate rankings and placement readiness scores for all completed interviews.
              </p>
              {finalizeError && (
                <div className={`mb-4 p-4 rounded-lg ${
                  finalizeError.includes("building") || finalizeError.includes("wait")
                    ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-2 border-yellow-400"
                    : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-xl">
                      {finalizeError.includes("building") || finalizeError.includes("wait") ? "⏳" : "❌"}
                    </span>
                    <div>
                      <p className="font-semibold mb-1">
                        {finalizeError.includes("building") || finalizeError.includes("wait") 
                          ? "Database Indexes Building" 
                          : "Error"}
                      </p>
                      <p>{finalizeError}</p>
                    </div>
                  </div>
                </div>
              )}
              <Button
                onClick={handleGenerateResults}
                disabled={finalizing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {finalizing ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Generating Results...
                  </>
                ) : (
                  <>
                    🎯 Generate Results
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                This will compute weighted rankings and readiness scores based on all evaluation reports.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex gap-3">
            <Button
              onClick={() =>
                window.location.href = `/organization/${orgId}/interview-drives/${driveId}/reports`
              }
            >
              📊 View Reports
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                window.location.href = `/organization/${orgId}/interview-drives/${driveId}/students`
              }
            >
              👨‍🎓 View Students
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
