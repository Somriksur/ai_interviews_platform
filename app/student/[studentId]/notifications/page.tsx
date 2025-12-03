'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Bell, BellOff, Trash2, Mail, Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentNavigation } from "@/components/student/Navigation";

interface Notification {
  id: string;
  type: string;
  action?: 'selected' | 'rejected';
  title?: string;
  message: string;
  driveName?: string;
  organizationName?: string;
  collegeName?: string;
  notes?: string;
  status?: string;
  read: boolean;
  createdAt: any;
  priority?: string;
  messageId?: string;
}

export default function StudentNotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    unread: 0,
    byType: {
      selection: 0,
      rejection: 0,
      message: 0,
      drive_assignment: 0,
    },
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, typeFilter, readFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (readFilter !== 'all') params.append('read', readFilter);
      params.append('page', (pagination?.page || 1).toString());
      params.append('limit', (pagination?.limit || 20).toString());

      const response = await fetch(`/api/students/${studentId}/notifications?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setSummary(data.summary);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch notifications');
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch(`/api/students/${studentId}/notifications/mark-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        toast.success('Marked as read');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/notifications/mark-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.ok) {
        toast.success('All notifications marked as read');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/students/${studentId}/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Notification deleted');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handlePageChange = async (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // Fetch notifications with new page
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (readFilter !== 'all') params.append('read', readFilter);
      params.append('page', newPage.toString());
      params.append('limit', pagination.limit.toString());

      const response = await fetch(`/api/students/${studentId}/notifications?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setSummary(data.summary);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'selection':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'rejection':
        return <XCircle className="h-6 w-6 text-gray-600" />;
      case 'message':
        return <Mail className="h-6 w-6 text-blue-600" />;
      case 'drive_assignment':
        return <Bell className="h-6 w-6 text-purple-600" />;
      default:
        return <Bell className="h-6 w-6 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      selection: { label: 'Selected', className: 'bg-green-600 hover:bg-green-700' },
      rejection: { label: 'Not Selected', className: 'bg-gray-600 hover:bg-gray-700' },
      message: { label: 'Message', className: 'bg-blue-600 hover:bg-blue-700' },
      drive_assignment: { label: 'Drive Assigned', className: 'bg-purple-600 hover:bg-purple-700' },
    };
    return badges[type] || { label: 'Notification', className: 'bg-gray-600' };
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <StudentNavigation studentId={studentId} />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Stay updated on interview drives, selections, and messages
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/student/${studentId}/dashboard`)} variant="outline">
            ← Dashboard
          </Button>
          {(summary?.unread || 0) > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <BellOff className="mr-2 h-4 w-4" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.unread || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Selections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary?.byType?.selection || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary?.byType?.message || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Drives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary?.byType?.drive_assignment || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="selection">Selections</SelectItem>
                  <SelectItem value="rejection">Rejections</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="drive_assignment">Drive Assignments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="false">Unread Only</SelectItem>
                  <SelectItem value="true">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No notifications found</p>
              <p className="text-sm text-muted-foreground">
                {typeFilter !== 'all' || readFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : "You'll be notified when there are updates"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {notifications.map((notification) => {
              const badge = getNotificationBadge(notification.type);
              return (
                <Card
                  key={notification.id}
                  className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getNotificationIcon(notification.type)}
                          <Badge variant="default" className={badge.className}>
                            {badge.label}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                              New
                            </Badge>
                          )}
                          {notification.priority === 'high' && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                        </div>

                        <p className="text-lg font-medium mb-2">
                          {notification.title || notification.message}
                        </p>

                        {notification.title && notification.message !== notification.title && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                        )}

                        <div className="space-y-1 text-sm text-muted-foreground">
                          {notification.driveName && (
                            <p>
                              <span className="font-medium">Drive:</span> {notification.driveName}
                            </p>
                          )}
                          {notification.organizationName && (
                            <p>
                              <span className="font-medium">Organization:</span>{' '}
                              {notification.organizationName}
                            </p>
                          )}
                          {notification.notes && (
                            <p>
                              <span className="font-medium">Notes:</span> {notification.notes}
                            </p>
                          )}
                          <p className="text-xs">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead([notification.id])}
                            title="Mark as read"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Pagination */}
            {(pagination?.totalPages || 0) > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {pagination?.page || 1} of {pagination?.totalPages || 1} ({pagination?.total || 0} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange((pagination?.page || 1) - 1)}
                        disabled={!pagination?.hasPrev}
                      >
                        ← Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange((pagination?.page || 1) + 1)}
                        disabled={!pagination?.hasNext}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      </div>
    </>
  );
}
