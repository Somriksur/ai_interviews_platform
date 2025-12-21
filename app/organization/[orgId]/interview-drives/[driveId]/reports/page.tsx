"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Report {
  id: string;
  reportType: "evaluation" | "placement";
  studentId: string;
  generatedAt: string;
  scores?: {
    overall?: number;
    technical?: number;
    communication?: number;
  };
  overallScore?: number;
  selectionStatus?: "selected" | "rejected" | null;
  student?: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    branch: string;
    cgpa: number;
  };
  college?: {
    id: string;
    name: string;
  };
}

interface Drive {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function InterviewDriveReportsPage({
  params,
}: {
  params: Promise<{ orgId: string; driveId: string }>;
}) {
  const [orgId, setOrgId] = useState<string>("");
  const [driveId, setDriveId] = useState<string>("");
  const [reports, setReports] = useState<Report[]>([]);
  const [drive, setDrive] = useState<Drive | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setOrgId(resolvedParams.orgId);
      setDriveId(resolvedParams.driveId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (orgId && driveId) {
      fetchReports();
    }
  }, [orgId, driveId]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organization/${orgId}/interview-drives/${driveId}/reports`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setDrive(data.drive);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      report.student?.name?.toLowerCase().includes(searchLower) ||
      report.student?.email?.toLowerCase().includes(searchLower) ||
      report.student?.rollNumber?.toLowerCase().includes(searchLower) ||
      report.college?.name?.toLowerCase().includes(searchLower)
    );
  });

  const getScore = (report: Report) => {
    if (report.reportType === "evaluation") {
      return report.scores?.overall || 0;
    }
    return report.overallScore || 0;
  };

  const averageScore =
    reports.length > 0
      ? reports.reduce((sum, r) => sum + getScore(r), 0) / reports.length
      : 0;

  const handleSelectStudent = async (report: Report) => {
    if (!confirm(`Select ${report.student?.name} for this position?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organization/${orgId}/interview-drives/${driveId}/select-student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: report.studentId,
            collegeId: report.college?.id,
            action: "selected",
            score: getScore(report),
          }),
        }
      );

      if (response.ok) {
        alert(
          `${report.student?.name} has been selected! Both college and student have been notified.`
        );
        // Update the report status in the UI
        setReports((prevReports) =>
          prevReports.map((r) =>
            r.id === report.id ? { ...r, selectionStatus: "selected" } : r
          )
        );
      } else {
        alert("Failed to select student. Please try again.");
      }
    } catch (error) {
      console.error("Error selecting student:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleRejectStudent = async (report: Report) => {
    if (!confirm(`Reject ${report.student?.name}?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/organization/${orgId}/interview-drives/${driveId}/select-student`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: report.studentId,
            collegeId: report.college?.id,
            action: "rejected",
            score: getScore(report),
          }),
        }
      );

      if (response.ok) {
        alert(
          `${report.student?.name} has been rejected. Both college and student have been notified.`
        );
        // Update the report status in the UI
        setReports((prevReports) =>
          prevReports.map((r) =>
            r.id === report.id ? { ...r, selectionStatus: "rejected" } : r
          )
        );
      } else {
        alert("Failed to reject student. Please try again.");
      }
    } catch (error) {
      console.error("Error rejecting student:", error);
      alert("An error occurred. Please try again.");
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
            href={`/organization/${orgId}/interview-drives/${driveId}`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Interview Drive
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            {drive?.name || "Interview Drive"} - Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Role: {drive?.role} • Status: {drive?.status}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Reports
                </p>
                <p className="text-3xl font-bold mt-2">{reports.length}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average Score
                </p>
                <p className="text-3xl font-bold mt-2">
                  {averageScore.toFixed(1)}%
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Evaluation Reports
                </p>
                <p className="text-3xl font-bold mt-2">
                  {reports.filter((r) => r.reportType === "evaluation").length}
                </p>
              </div>
              <div className="text-4xl">🤖</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by student name, email, roll number, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Reports Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "No reports found matching your search"
                  : "No reports generated yet"}
              </p>
              {reports.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Reports will appear here after students complete their
                  interviews
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left p-4 font-semibold">Student</th>
                    <th className="text-left p-4 font-semibold">College</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Generated</th>
                    <th className="text-left p-4 font-semibold">Selection</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {report.student?.name || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.student?.rollNumber}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        {report.college?.name || "Unknown"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            report.reportType === "evaluation"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {report.reportType === "evaluation"
                            ? "Auto Evaluation"
                            : "Placement Report"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">
                          {getScore(report).toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {report.selectionStatus === "selected" ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                            ✓ Selected
                          </span>
                        ) : report.selectionStatus === "rejected" ? (
                          <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium">
                            ✗ Rejected
                          </span>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSelectStudent(report)}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              ✓ Select
                            </button>
                            <button
                              onClick={() => handleRejectStudent(report)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/student/${report.studentId}/profile`}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Profile →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        {reports.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                // TODO: Implement export functionality
                alert("Export functionality coming soon!");
              }}
              variant="outline"
            >
              📥 Export Reports
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
