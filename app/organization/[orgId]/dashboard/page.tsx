"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  email: string;
  settings: {
    maxColleges: number;
    maxStudentsPerDrive: number;
  };
}

interface Stats {
  totalColleges: number;
  totalStudents: number;
  totalDrives: number;
  completedDrives: number;
}

export default function OrganizationDashboard({ params }: { params: { orgId: string } }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalColleges: 0,
    totalStudents: 0,
    totalDrives: 0,
    completedDrives: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchOrganizationData();
  }, [params.orgId]);

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const orgResponse = await fetch(`/api/organization/${params.orgId}`);
      if (orgResponse.ok) {
        const orgData = await orgResponse.json();
        setOrganization(orgData);
      }

      // Fetch colleges
      const collegesResponse = await fetch(`/api/organization/${params.orgId}/colleges`);
      if (collegesResponse.ok) {
        const { colleges } = await collegesResponse.json();
        setStats((prev) => ({ ...prev, totalColleges: colleges.length }));
      }

      // Fetch interview drives
      const drivesResponse = await fetch(`/api/organization/${params.orgId}/interview-drives`);
      if (drivesResponse.ok) {
        const { drives } = await drivesResponse.json();
        setStats((prev) => ({
          ...prev,
          totalDrives: drives.length,
          completedDrives: drives.filter((d: any) => d.status === 'completed').length,
        }));
      }
    } catch (error) {
      console.error('Error fetching organization data:', error);
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
          <h1 className="text-3xl font-bold mb-2">{organization?.name || 'Organization'} Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage colleges, students, and campus placement drives
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Colleges</p>
                <p className="text-3xl font-bold mt-2">{stats.totalColleges}</p>
              </div>
              <div className="text-4xl">🏫</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Students</p>
                <p className="text-3xl font-bold mt-2">{stats.totalStudents}</p>
              </div>
              <div className="text-4xl">👨‍🎓</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Interview Drives</p>
                <p className="text-3xl font-bold mt-2">{stats.totalDrives}</p>
              </div>
              <div className="text-4xl">📋</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed Drives</p>
                <p className="text-3xl font-bold mt-2">{stats.completedDrives}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href={`/organization/${params.orgId}/colleges`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">🏫</div>
              <div>
                <h3 className="text-lg font-semibold">Manage Colleges</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add, edit, or remove colleges
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/organization/${params.orgId}/interview-drives`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📋</div>
              <div>
                <h3 className="text-lg font-semibold">Interview Drives</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create and manage placement drives
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/organization/${params.orgId}/job-profiles`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">💼</div>
              <div>
                <h3 className="text-lg font-semibold">Job Profiles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage job openings and requirements
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/organization/${params.orgId}/reports`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">Placement Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View AI-generated placement reports
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/organization/${params.orgId}/students`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">👥</div>
              <div>
                <h3 className="text-lg font-semibold">All Students</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View students across all colleges
                </p>
              </div>
            </div>
          </Link>

          <Link
            href={`/organization/${params.orgId}/settings`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="text-5xl">⚙️</div>
              <div>
                <h3 className="text-lg font-semibold">Settings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Organization settings and preferences
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
