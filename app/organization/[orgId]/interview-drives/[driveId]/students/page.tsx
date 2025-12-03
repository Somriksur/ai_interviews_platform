"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  branch: string;
  year: number;
  cgpa: number;
  collegeId: string;
  collegeName: string;
  session: {
    id: string;
    status: string;
    score: number | null;
    completedAt: any;
    createdAt: any;
  };
}

interface Drive {
  id: string;
  name: string;
  role: string;
  status: string;
}

export default function InterviewDriveStudentsPage({
  params,
}: {
  params: Promise<{ orgId: string; driveId: string }>;
}) {
  const [orgId, setOrgId] = useState<string>("");
  const [driveId, setDriveId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
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
      fetchStudents();
    }
  }, [orgId, driveId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/organization/${orgId}/interview-drives/${driveId}/students`
      );
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setDrive(data.drive);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.rollNumber?.toLowerCase().includes(searchLower) ||
      student.collegeName?.toLowerCase().includes(searchLower) ||
      student.branch?.toLowerCase().includes(searchLower)
    );
  });

  const completedCount = students.filter(
    (s) => s.session.status === "completed"
  ).length;
  const inProgressCount = students.filter(
    (s) => s.session.status === "in-progress"
  ).length;
  const pendingCount = students.filter(
    (s) => s.session.status === "assigned" || s.session.status === "pending"
  ).length;

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
            {drive?.name || "Interview Drive"} - Students
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Role: {drive?.role} • Status: {drive?.status}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Students
                </p>
                <p className="text-3xl font-bold mt-2">{students.length}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-3xl font-bold mt-2">{completedCount}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-3xl font-bold mt-2">{inProgressCount}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </p>
                <p className="text-3xl font-bold mt-2">{pendingCount}</p>
              </div>
              <div className="text-4xl">⏰</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, roll number, college, or branch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? "No students found matching your search"
                  : "No students assigned to this drive yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left p-4 font-semibold">Student</th>
                    <th className="text-left p-4 font-semibold">College</th>
                    <th className="text-left p-4 font-semibold">Branch</th>
                    <th className="text-left p-4 font-semibold">Year</th>
                    <th className="text-left p-4 font-semibold">CGPA</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Score</th>
                    <th className="text-left p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student.rollNumber}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">{student.collegeName}</td>
                      <td className="p-4">{student.branch}</td>
                      <td className="p-4">{student.year}</td>
                      <td className="p-4">
                        <span className="font-semibold">{student.cgpa}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            student.session.status === "completed"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : student.session.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {student.session.status === "assigned"
                            ? "Pending"
                            : student.session.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {student.session.score !== null &&
                        student.session.score !== undefined ? (
                          <span className="font-semibold">
                            {student.session.score.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/student/${student.id}/profile`}
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
      </div>
    </div>
  );
}
