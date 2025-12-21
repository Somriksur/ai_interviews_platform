"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CollegeNavigation } from "@/components/college/Navigation";

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

export default function CollegeDashboard({ params }: { params: Promise<{ collegeId: string }> }) {
  const [college, setCollege] = useState<College | null>(null);
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string>("");
  const [notificationCounts, setNotificationCounts] = useState({
    driveSelections: 0,
    jobNotifications: 0,
    registrationRequests: 0,
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setCollegeId(resolvedParams.collegeId);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (collegeId) {
      fetchCollegeData();
      fetchNotificationCounts();
    }
  }, [collegeId]);

  const fetchCollegeData = async () => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}`);
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

  const fetchNotificationCounts = async () => {
    try {
      // Fetch registration requests count
      const registrationRequestsRes = await fetch(`/api/colleges/${collegeId}/registration-requests?status=pending`);
      if (registrationRequestsRes.ok) {
        const data = await registrationRequestsRes.json();
        const pendingCount = data.requests?.length || 0;
        setNotificationCounts(prev => ({ ...prev, registrationRequests: pendingCount }));
      }

      // Fetch drive selections count
      const driveSelectionsRes = await fetch(`/api/colleges/${collegeId}/drive-selections`);
      if (driveSelectionsRes.ok) {
        const data = await driveSelectionsRes.json();
        const pendingCount = data.notifications?.filter((n: any) => n.status === 'pending').length || 0;
        setNotificationCounts(prev => ({ ...prev, driveSelections: pendingCount }));
      }

      // Fetch job notifications count
      const jobNotificationsRes = await fetch(`/api/colleges/${collegeId}/job-notifications`);
      if (jobNotificationsRes.ok) {
        const data = await jobNotificationsRes.json();
        const pendingCount = data.notifications?.filter((n: any) => n.status === 'pending').length || 0;
        setNotificationCounts(prev => ({ ...prev, jobNotifications: pendingCount }));
      }
    } catch (error) {
      console.error("Error fetching notification counts:", error);
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
    <>
      <CollegeNavigation collegeId={collegeId} />
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
          {/* Student Management */}
          <Link
            href={`/college/${collegeId}/registration-requests`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200 relative"
          >
            {notificationCounts.registrationRequests > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {notificationCounts.registrationRequests}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="text-5xl">📝</div>
              <div>
                <h3 className="text-lg font-semibold">Registration Requests</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Approve or reject student registrations
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/college/${collegeId}/students`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">👥</div>
              <div>
                <h3 className="text-lg font-semibold">Manage Students</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and manage student list
                </p>
              </div>
            </div>
          </Link>

          {/* Job & Interview Management */}
          <Link
            href={`/college/${collegeId}/job-notifications`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200 relative"
          >
            {notificationCounts.jobNotifications > 0 && (
              <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {notificationCounts.jobNotifications}
              </div>
            )}
            <div className="flex items-center gap-4">
              <div className="text-5xl">📬</div>
              <div>
                <h3 className="text-lg font-semibold">Job Notifications</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and respond to job opportunities
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/college/${collegeId}/selections`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">✅</div>
              <div>
                <h3 className="text-lg font-semibold">Student Selections</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View all student placement selections
                </p>
              </div>
            </div>
          </Link>

          {/* Reports & Analytics */}
          <Link
            href={`/college/${collegeId}/reports`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">Reports & Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View placement reports and analytics
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}
