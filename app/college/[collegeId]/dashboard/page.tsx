"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  college: {
    id: string;
    name: string;
    location: string;
    email: string;
  };
  statistics: {
    totalStudents: number;
    registeredStudents: number;
    pendingRequests: number;
    totalDrives: number;
    activeDrives: number;
    totalSelections: number;
  };
  recentStudents: Array<{
    id: string;
    name: string;
    email: string;
    branch: string;
    year: number;
  }>;
  recentDrives: Array<{
    id: string;
    name: string;
    organizationName: string;
    role: string;
    status: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: any;
  }>;
}

export default function CollegeDashboard() {
  const params = useParams();
  const router = useRouter();
  const collegeId = params.collegeId as string;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [collegeId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel API calls for better performance
      const [collegeResponse, studentsResponse, requestsResponse, selectionsResponse, driveSelectionsResponse] = await Promise.all([
        fetch(`/api/colleges/${collegeId}`),
        fetch(`/api/colleges/${collegeId}/students`),
        fetch(`/api/colleges/${collegeId}/registration-requests`),
        fetch(`/api/colleges/${collegeId}/selections`),
        fetch(`/api/colleges/${collegeId}/drive-selections`)
      ]);

      if (!collegeResponse.ok) {
        throw new Error("Failed to fetch college data");
      }
      
      const collegeData = await collegeResponse.json();
      const studentsData = studentsResponse.ok ? await studentsResponse.json() : { students: [] };
      const requestsData = requestsResponse.ok ? await requestsResponse.json() : { requests: [] };
      const selectionsData = selectionsResponse.ok ? await selectionsResponse.json() : { selections: [] };
      const driveSelectionsData = driveSelectionsResponse.ok ? await driveSelectionsResponse.json() : { drives: [] };
      
      const students = studentsData.students || [];
      const requests = requestsData.requests || [];
      const selections = selectionsData.selections || [];
      const drives = driveSelectionsData.drives || [];

      const pendingRequests = requests.filter((r: any) => r.status === "pending").length;
      const activeDrives = drives.filter((d: any) => d.status === "active").length;

      // Get recent students (last 5)
      const recentStudents = students
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      // Get recent drives (last 5)
      const recentDrives = drives.slice(0, 5);

      // Generate recent activity
      const recentActivity = [
        ...students.slice(0, 2).map((s: any) => ({
          id: s.id,
          type: "student",
          message: `New student registered: ${s.name}`,
          timestamp: s.createdAt,
        })),
        ...requests.slice(0, 2).map((r: any) => ({
          id: r.id,
          type: "request",
          message: `Registration request from ${r.studentName}`,
          timestamp: r.createdAt,
        })),
        ...selections.slice(0, 2).map((sel: any) => ({
          id: sel.id,
          type: "selection",
          message: `Student selected: ${sel.studentName || "Unknown"}`,
          timestamp: sel.selectedAt || sel.createdAt,
        })),
      ]
        .sort((a, b) => {
          const aTime = a.timestamp?.seconds || new Date(a.timestamp).getTime() / 1000 || 0;
          const bTime = b.timestamp?.seconds || new Date(b.timestamp).getTime() / 1000 || 0;
          return bTime - aTime;
        })
        .slice(0, 5);

      setDashboardData({
        college: {
          id: collegeData.id,
          name: collegeData.name,
          location: collegeData.location || "Location not specified",
          email: collegeData.email,
        },
        statistics: {
          totalStudents: students.length,
          registeredStudents: students.filter((s: any) => s.status === "approved").length,
          pendingRequests,
          totalDrives: drives.length,
          activeDrives,
          totalSelections: selections.length,
        },
        recentStudents,
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

  const { college, statistics, recentStudents, recentDrives, recentActivity } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {college.name}! 👋</h1>
            <p className="text-muted-foreground mt-1">
              {college.location} • {college.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/college/${collegeId}/upload-students`}>
              <Button>➕ Upload Students</Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <span className="text-2xl">👨‍🎓</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalStudents}</div>
              <p className="text-xs text-muted-foreground">All students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.registeredStudents}</div>
              <p className="text-xs text-muted-foreground">Approved students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <span className="text-2xl">⏳</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
              <CardTitle className="text-sm font-medium">Selections</CardTitle>
              <span className="text-2xl">🎉</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalSelections}</div>
              <p className="text-xs text-muted-foreground">Students placed</p>
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
                onClick={() => router.push(`/college/${collegeId}/students`)}
              >
                <span className="text-2xl mb-1">👨‍🎓</span>
                <span className="text-sm">View Students</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/college/${collegeId}/registration-requests`)}
              >
                <span className="text-2xl mb-1">📝</span>
                <span className="text-sm">Registration Requests</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/college/${collegeId}/drive-selections`)}
              >
                <span className="text-2xl mb-1">📋</span>
                <span className="text-sm">Interview Drives</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push(`/college/${collegeId}/selections`)}
              >
                <span className="text-2xl mb-1">🎉</span>
                <span className="text-sm">Selections</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Registration Requests */}
        {statistics.pendingRequests > 0 && (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span>⏳</span>
                  Pending Registration Requests
                </CardTitle>
                <Link href={`/college/${collegeId}/registration-requests`}>
                  <Button variant="outline" size="sm">Review →</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                You have <strong>{statistics.pendingRequests}</strong> pending registration request(s) waiting for approval.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Students</CardTitle>
              <Link href={`/college/${collegeId}/students`}>
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No students registered yet</p>
                <Link href={`/college/${collegeId}/upload-students`}>
                  <Button>Upload Students</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.branch} • Year {student.year} • {student.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Interview Drives */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Interview Drives</CardTitle>
              <Link href={`/college/${collegeId}/drive-selections`}>
                <Button variant="ghost" size="sm">View All →</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentDrives.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No interview drives yet</p>
            ) : (
              <div className="space-y-3">
                {recentDrives.map((drive) => (
                  <div
                    key={drive.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{drive.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {drive.organizationName} • {drive.role}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        drive.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
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
                      {activity.type === "student" ? "👨‍🎓" : activity.type === "request" ? "📝" : "🎉"}
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
