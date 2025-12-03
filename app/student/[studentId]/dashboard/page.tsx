"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { StudentNavigation } from "@/components/student/Navigation";

interface DashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    branch: string;
    year: number;
    cgpa: number;
    collegeId: string;
    collegeName: string;
  };
  statistics: {
    totalInterviews: number;
    pendingInterviews: number;
    completedInterviews: number;
    averageScore: number;
  };
  recentNotifications: any[];
  unreadCount: number;
  assignedDrives: any[];
  selectionStatus: {
    driveId: string;
    driveName: string;
    organizationName: string;
    status: 'pending' | 'selected' | 'rejected' | 'completed';
    notes?: string;
    date: any;
  }[];
  summary: {
    totalDrives: number;
    completedDrives: number;
    pendingDrives: number;
    selectedCount: number;
    rejectedCount: number;
  };
}

export default function StudentDashboard() {
  const params = useParams();
  const studentId = params.studentId as string;

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [studentId]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      const response = await fetch(`/api/students/${studentId}/dashboard`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard data received:', data);
        setDashboardData(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to fetch dashboard:', response.status, errorData);
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      selected: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };
    return variants[status] || variants.pending;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      selected: '🎉',
      rejected: '📋',
      pending: '⏳',
      completed: '✅',
    };
    return icons[status] || '📋';
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString();
      }
      // Handle ISO string or Date object
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'N/A';
      }
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error Loading Dashboard</h1>
          <p className="text-muted-foreground mt-2">Unable to load your dashboard data.</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { student, statistics, recentNotifications, unreadCount, assignedDrives, selectionStatus, summary } = dashboardData;

  return (
    <>
      <StudentNavigation studentId={studentId} />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {student.name}! 👋</h1>
          <p className="text-muted-foreground mt-1">
            {student.branch} • <span className="font-medium text-foreground">{student.collegeName}</span> • Roll: {student.rollNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/student/${studentId}/notifications`}>
            <Button variant="outline" className="relative">
              📧 Notifications
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 px-2 py-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href={`/student/${studentId}/profile`}>
            <Button variant="outline">👤 Profile</Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
            <span className="text-2xl">📝</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalInterviews}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.completedInterviews} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Interviews</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pendingInterviews}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <span className="text-2xl">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.averageScore > 0 ? statistics.averageScore.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selections</CardTitle>
            <span className="text-2xl">🎉</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.selectedCount}</div>
            <p className="text-xs text-muted-foreground">
              {summary.rejectedCount} rejections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <Link href={`/student/${studentId}/notifications`}>
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notifications yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotifications.slice(0, 5).map((notification: any) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border ${
                    notification.read
                      ? 'bg-background'
                      : 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Badge variant="default" className="ml-2">New</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Drive Status</CardTitle>
        </CardHeader>
        <CardContent>
          {selectionStatus.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No interview drives assigned yet
            </p>
          ) : (
            <div className="space-y-3">
              {selectionStatus.map((status) => (
                <div
                  key={status.driveId}
                  className="p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getStatusIcon(status.status)}</span>
                        <div>
                          <p className="font-medium">{status.driveName}</p>
                          <p className="text-sm text-muted-foreground">
                            {status.organizationName}
                          </p>
                        </div>
                      </div>
                      {status.notes && (
                        <p className="text-sm text-muted-foreground mt-2 ml-7">
                          Note: {status.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2 ml-7">
                        {formatDate(status.date)}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(status.status)}>
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assigned Drives - Only show pending interviews */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Interview Drives</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // Filter out completed interviews - only show pending ones
            const pendingDrives = assignedDrives.filter((drive: any) => {
              const driveStatus = selectionStatus.find(s => s.driveId === drive.id);
              const isCompleted = driveStatus?.status === 'completed' || 
                                 driveStatus?.status === 'selected' || 
                                 driveStatus?.status === 'rejected';
              return !isCompleted;
            });

            if (pendingDrives.length === 0) {
              return (
                <p className="text-center text-muted-foreground py-8">
                  No pending interview drives
                </p>
              );
            }

            return (
              <div className="space-y-3">
                {pendingDrives.slice(0, 5).map((drive: any) => (
                  <div
                    key={drive.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{drive.name || 'Interview Drive'}</p>
                        <p className="text-sm text-muted-foreground">
                          {drive.organizationName || 'Organization'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created: {formatDate(drive.createdAt)}
                        </p>
                      </div>
                      <Link href={`/student/${studentId}/interview/${drive.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
      </div>
    </>
  );
}
