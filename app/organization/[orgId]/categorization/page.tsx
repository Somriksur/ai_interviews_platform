"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { categorizeStudentsByLPA } from "@/lib/services/categorization.service";

interface Student {
  studentId: string;
  studentName: string;
  score: number;
  email: string;
  rollNumber: string;
  branch: string;
  cgpa: number;
  college: string;
}

export default function CategorizationPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const [loading, setLoading] = useState(true);
  const [categorized, setCategorized] = useState<{
    high: Student[];
    medium: Student[];
    low: Student[];
  }>({
    high: [],
    medium: [],
    low: [],
  });

  useEffect(() => {
    fetchAndCategorizeStudents();
  }, [orgId]);

  const fetchAndCategorizeStudents = async () => {
    try {
      // Fetch all reports for this organization
      const response = await fetch(`/api/organization/${orgId}/reports`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const { reports } = await response.json();

      // Transform reports for categorization
      const reportsForCategorization = reports.map((report: any) => ({
        studentId: report.student?.id || report.studentId,
        studentName: report.student?.name || 'Unknown',
        technicalScore: report.technicalScore || 0,
        communicationRating: report.communicationRating || 0,
        overallScore: report.overallScore || 0,
        skillInsights: report.skillInsights || {
          technical: [],
          communication: [],
          problemSolving: [],
          leadership: [],
        },
        email: report.student?.email || '',
        rollNumber: report.student?.rollNumber || '',
        branch: report.student?.branch || '',
        cgpa: report.student?.cgpa || 0,
        college: report.college?.name || '',
      }));

      // Categorize students
      const categorizedData = categorizeStudentsByLPA(reportsForCategorization);

      // Add additional student info
      const enrichedData = {
        high: categorizedData.high.map(s => {
          const fullData = reportsForCategorization.find((r: any) => r.studentId === s.studentId);
          return { ...s, ...fullData };
        }),
        medium: categorizedData.medium.map(s => {
          const fullData = reportsForCategorization.find((r: any) => r.studentId === s.studentId);
          return { ...s, ...fullData };
        }),
        low: categorizedData.low.map(s => {
          const fullData = reportsForCategorization.find((r: any) => r.studentId === s.studentId);
          return { ...s, ...fullData };
        }),
      };

      setCategorized(enrichedData);
    } catch (error) {
      console.error('Error fetching and categorizing students:', error);
      toast.error('Failed to load student categorization');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}? This will remove all their data.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Student deleted successfully');
        fetchAndCategorizeStudents(); // Refresh the list
      } else {
        toast.error('Failed to delete student');
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('An error occurred while deleting');
    }
  };

  const getCategoryColor = (category: 'high' | 'medium' | 'low') => {
    if (category === 'high') return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (category === 'medium') return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  const totalStudents = categorized.high.length + categorized.medium.length + categorized.low.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/organization/${orgId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Student Categorization by LPA</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Students grouped by placement potential and salary bands
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Students</div>
            <div className="text-3xl font-bold mt-2">{totalStudents}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow p-6">
            <div className="text-sm text-green-600 dark:text-green-400">High Range (8+ LPA)</div>
            <div className="text-3xl font-bold mt-2 text-green-600 dark:text-green-400">
              {categorized.high.length}
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg shadow p-6">
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Mid Range (4-8 LPA)</div>
            <div className="text-3xl font-bold mt-2 text-yellow-600 dark:text-yellow-400">
              {categorized.medium.length}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">Entry Level (2-4 LPA)</div>
            <div className="text-3xl font-bold mt-2">{categorized.low.length}</div>
          </div>
        </div>

        {/* Categorized Students */}
        {totalStudents === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Student Data</h3>
            <p className="text-gray-600 dark:text-gray-400">
              No student reports have been generated yet
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* High Range Students */}
            {categorized.high.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">High-Range Package (8+ LPA)</h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor('high')}`}>
                    {categorized.high.length} students
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorized.high.map((student, index) => (
                    <div
                      key={`high-${student.studentId}-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-green-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{student.studentName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student.rollNumber} • {student.branch} • CGPA: {student.cgpa}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.college}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {student.score}
                            </div>
                            <div className="text-xs text-gray-500">Overall Score</div>
                          </div>
                          <button
                            onClick={() => handleDeleteStudent(student.studentId, student.studentName)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mid Range Students */}
            {categorized.medium.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">Mid-Range Package (4-8 LPA)</h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor('medium')}`}>
                    {categorized.medium.length} students
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorized.medium.map((student, index) => (
                    <div
                      key={`medium-${student.studentId}-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-yellow-500"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{student.studentName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student.rollNumber} • {student.branch} • CGPA: {student.cgpa}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.college}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                              {student.score}
                            </div>
                            <div className="text-xs text-gray-500">Overall Score</div>
                          </div>
                          <button
                            onClick={() => handleDeleteStudent(student.studentId, student.studentName)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entry Level Students */}
            {categorized.low.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">Entry-Level Package (2-4 LPA)</h2>
                  <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor('low')}`}>
                    {categorized.low.length} students
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorized.low.map((student, index) => (
                    <div
                      key={`low-${student.studentId}-${index}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 border-gray-400"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{student.studentName}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {student.rollNumber} • {student.branch} • CGPA: {student.cgpa}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{student.college}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{student.score}</div>
                            <div className="text-xs text-gray-500">Overall Score</div>
                          </div>
                          <button
                            onClick={() => handleDeleteStudent(student.studentId, student.studentName)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
