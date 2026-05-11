"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  organization: {
    id: string;
    name: string;
    email: string;
    industry: string;
  };
  statistics: {
    totalStudents: number;
    totalDrives: number;
    activeDrives: number;
    completedDrives: number;
    totalReports: number;
  };
  recentDrives: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    createdAt: any;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: any;
  }>;
}

export default function OrganizationDashboard() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [orgId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel API calls for better performance
      const [orgResponse, drivesResponse, reportsResponse] = await Promise.all([
        fetch(`/api/organization/${orgId}`),
        fetch(`/api/organization/${orgId}/interview-drives`),
        fetch(`/api/organization/${orgId}/reports`)
      ]);

      if (!orgResponse.ok) {
        throw new Error("Failed to fetch organization data");
      }
      
      const orgData = await orgResponse.json();
      const drivesData = drivesResponse.ok ? await drivesResponse.json() : { drives: [] };
      const reportsData = reportsResponse.ok ? await reportsResponse.json() : { reports: [] };
      
      const drives = drivesData.drives || [];
      const reports = reportsData.reports || [];

      // Calculate statistics
      const activeDrives = drives.filter((d: any) => d.status === "active").length;
      const completedDrives = drives.filter((d: any) => d.status === "completed").length;
      const uniqueStudents = new Set(reports.map((r: any) => r.student?.id).filter(Boolean));

      // Get recent drives (last 5)
      const recentDrives = drives
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      // Generate recent activity
      const recentActivity = [
        ...drives.slice(0, 3).map((d: any) => ({
          id: d.id,
          type: "drive",
          message: `Interview drive "${d.name}" created`,
          timestamp: d.createdAt,
        })),
        ...reports.slice(0, 2).map((r: any) => ({
          id: r.id,
          type: "report",
          message: `New evaluation report for ${r.student?.name || "student"}`,
          timestamp: r.generatedAt,
        })),
      ]
        .sort((a, b) => {
          const aTime = a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000 || 0;
          const bTime = b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000 || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setDashboardData({
        organization: {
          id: orgData.id,
          name: orgData.name,
          email: orgData.email,
          industry: orgData.industry || "Technology",
        },
        statistics: {
          totalStudents: uniqueStudents.size,
          totalDrives: drives.length,
          activeDrives,
          completedDrives,
          totalReports: reports.length,
        },
        recentDrives,
        recentActivity,
      });
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      if (timestamp.seconds) {
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error || "Unable to load dashboard data"}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { organization, statistics, recentDrives, recentActivity } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {organization.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              {organization.industry} • {organization.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/organization/${orgId}/interview-drives/create`}>
              <Button>➕ Create Interview Drive</Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <span className="text-2xl">👨‍🎓</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Interviewed candidates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drives</CardTitle>
              <span className="text-2xl">📋</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalDrives}</div>
              <p className="text-xs text-muted-foreground">Interview campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drives</CardTitle>
              <span className="text-2xl">🔄</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.activeDrives}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.completedDrives}</div>
              <p className="text-xs text-muted-foreground">Finished drives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalReports}</div>
              <p className="text-xs text-muted-foreground">Evaluations generated</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/organization/${orgId}/interview-drives`)}
              >
                <span className="text-2xl mb-1">📋</span>
                <span className="text-sm">Interview Drives</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/organization/${orgId}/students`)}
              >
                <span className="text-2xl mb-1">👨‍🎓</span>
                <span className="text-sm">View Students</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/organization/${orgId}/reports`)}
              >
                <span className="text-2xl mb-1">📊</span>
                <span className="text-sm">View Reports</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/organization/${orgId}/colleges`)}
              >
                <span className="text-2xl mb-1">🏫</span>
                <span className="text-sm">Colleges</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Interview Drives */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Interview Drives</CardTitle>
              <Link href={`/organization/${orgId}/interview-drives`}>
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentDrives.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No interview drives yet</p>
                <Link href={`/organization/${orgId}/interview-drives/create`}>
                  <Button>Create Your First Drive</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => router.push(`/organization/${orgId}/interview-drives/${drive.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{drive.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {drive.role} • Created {formatDate(drive.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        drive.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : drive.status === "completed"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {drive.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <span className="text-xl">
                      {activity.type === "drive" ? "📋" : "📊"}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
