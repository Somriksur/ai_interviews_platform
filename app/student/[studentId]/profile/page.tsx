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
  skills: string[];
  collegeId: string;
  collegeName?: string; // Original casing
  normalizedCollegeName?: string;
}

interface Interview {
  id: string;
  role: string;
  status: string;
  score: number | null;
  completedAt: any;
  createdAt: any;
  driveId: string;
}

// Helper function to format Firestore timestamp
function formatFirestoreDate(timestamp: any): string {
  if (!timestamp) return '-';
  
  try {
    let date: Date;
    
    if (timestamp.seconds) {
      // Firestore Timestamp object
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp._seconds) {
      // Firestore Timestamp with underscore
      date = new Date(timestamp._seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      // ISO string or milliseconds
      date = new Date(timestamp);
    } else {
      return '-';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

export default function StudentProfilePage({ params }: { params: Promise<{ studentId: string }> }) {
  const [studentId, setStudentId] = useState<string>("");
  const [student, setStudent] = useState<Student | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setStudentId(resolvedParams.studentId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);

  const [assignedDrives, setAssignedDrives] = useState<any[]>([]);

  const fetchStudentData = async () => {
    try {
      // Fetch student details
      const studentResponse = await fetch(`/api/students/${studentId}`);
      if (studentResponse.ok) {
        const studentData = await studentResponse.json();
        setStudent(studentData);
      }

      // Fetch student interviews
      const interviewsResponse = await fetch(`/api/students/${studentId}/interviews`);
      if (interviewsResponse.ok) {
        const interviewsData = await interviewsResponse.json();
        setInterviews(interviewsData.interviews || []);
      }

      // Fetch student reports
      const reportsResponse = await fetch(`/api/students/${studentId}/reports`);
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.reports || []);
      }

      // Fetch assigned interview drives
      const drivesResponse = await fetch(`/api/students/${studentId}/assigned-drives`);
      if (drivesResponse.ok) {
        const drivesData = await drivesResponse.json();
        console.log('📊 Assigned Drives Data:', drivesData);
        console.log('📊 Number of drives:', drivesData.drives?.length || 0);
        if (drivesData.drives && drivesData.drives.length > 0) {
          console.log('📊 Drive details:', drivesData.drives.map((d: any) => ({
            id: d.id,
            name: d.name,
            status: d.status,
            role: d.role,
            colleges: d.colleges
          })));
        }
        setAssignedDrives(drivesData.drives || []);
      } else {
        console.error('❌ Failed to fetch drives:', drivesResponse.status);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
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

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student not found</h2>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  const completedInterviews = interviews.filter((i) => i.status === "completed");
  const averageScore = completedInterviews.length > 0
    ? completedInterviews.reduce((sum, i) => sum + (i.score || 0), 0) / completedInterviews.length
    : 0;

  // Filter out drives that have already been completed (but keep pending ones)
  const completedDriveIds = new Set(
    interviews.filter((i) => i.status === "completed").map((i) => i.driveId)
  );
  const availableDrives = assignedDrives.filter((drive) => !completedDriveIds.has(drive.id));
  
  console.log('📊 Interview Status:', {
    totalInterviews: interviews.length,
    completedDriveIds: Array.from(completedDriveIds),
    assignedDrives: assignedDrives.length,
    availableDrives: availableDrives.length,
  });

  console.log('🔍 Debugging Start Interview Button:');
  console.log('  - Total assigned drives:', assignedDrives.length);
  console.log('  - Completed interviews:', completedDriveIds.size);
  console.log('  - Available drives (should show button):', availableDrives.length);
  
  if (assignedDrives.length === 0) {
    console.log('  ⚠️ NO DRIVES ASSIGNED: No interview drives are assigned to this student\'s college');
  } else if (availableDrives.length === 0 && assignedDrives.length > 0) {
    console.log('  ⚠️ ALL DRIVES COMPLETED: Student has completed all assigned interviews');
    console.log('  Completed drive IDs:', Array.from(completedDriveIds));
  } else {
    console.log('  ✅ Button should be visible for these drives:');
    availableDrives.forEach((drive: any) => {
      console.log(`     - ${drive.name} (${drive.id})`);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/college/${student.collegeId}/students`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Students
          </Link>
          <h1 className="text-3xl font-bold mb-2">{student.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {student.rollNumber} • {student.branch} • Year {student.year}
            {student.collegeName && ` • ${student.collegeName}`}
          </p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
              <p className="font-medium">{student.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">CGPA</p>
              <p className="font-medium">{student.cgpa}</p>
            </div>
            {student.collegeName && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">College</p>
                <p className="font-medium">{student.collegeName}</p>
              </div>
            )}
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Skills</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {student.skills && student.skills.length > 0 ? (
                  student.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills listed</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Interviews</p>
                <p className="text-3xl font-bold mt-2">{interviews.length}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold mt-2">{completedInterviews.length}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                <p className="text-3xl font-bold mt-2">{averageScore.toFixed(1)}%</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>
        </div>

        {/* Assigned Interview Drives */}
        {availableDrives.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Assigned Interview Drives</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableDrives.map((drive) => (
                <div
                  key={drive.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-2">{drive.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {drive.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Role: {drive.role}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Questions: {drive.questions?.length || 0}
                      </p>
                    </div>
                    <Link href={`/student/${studentId}/interview/${drive.id}`}>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Start Interview
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : assignedDrives.length > 0 ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-yellow-900 dark:text-yellow-100">
              🎉 All Interviews Completed!
            </h2>
            <p className="text-yellow-800 dark:text-yellow-200">
              You have completed all assigned interview drives. Check back later for new opportunities!
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-blue-900 dark:text-blue-100">
              📋 No Interview Drives Assigned
            </h2>
            <p className="text-blue-800 dark:text-blue-200">
              No interview drives have been assigned to you yet. Your college will notify you when new opportunities become available.
            </p>
          </div>
        )}

        {/* Interview History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Interview History</h2>
            {interviews.length > 0 && (
              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to clear all interview history? This cannot be undone.')) {
                    try {
                      const response = await fetch(`/api/students/${studentId}/interviews`, {
                        method: 'DELETE',
                      });
                      if (response.ok) {
                        setInterviews([]);
                        alert('Interview history cleared successfully!');
                      } else {
                        alert('Failed to clear history. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error clearing history:', error);
                      alert('An error occurred. Please try again.');
                    }
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                🗑️ Clear All History
              </button>
            )}
          </div>
          {interviews.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No interviews yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Score</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {interviews.map((interview) => (
                    <tr key={interview.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3">{interview.role}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            interview.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : interview.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {interview.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {interview.score !== null && interview.score !== undefined ? `${Math.round(interview.score)}%` : "-"}
                      </td>
                      <td className="p-3">
                        {formatFirestoreDate(interview.completedAt || interview.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Placement Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Placement Reports</h2>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">No placement reports yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{report.driveId}</h3>
                    <span className="text-sm text-gray-600">
                      {formatFirestoreDate(report.generatedAt || report.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Overall Score: {report.overallScore}%
                  </p>
                  <p className="text-sm">{report.evaluationSummary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
