"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { UnifiedNotification, isDriveNotification, isJobPostingNotification } from "@/types/drive-notification";

export default function JobNotificationsPage({
  params,
}: {
  params: Promise<{ collegeId: string }>;
}) {
  const { collegeId } = use(params);
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed" | "declined">("all");
  
  // Dialog state for decline with notes
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<UnifiedNotification | null>(null);
  const [declineNotes, setDeclineNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<UnifiedNotification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [collegeId]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/colleges/${collegeId}/job-notifications`);
      if (response.ok) {
        const { notifications } = await response.json();
        setNotifications(notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (notification: UnifiedNotification) => {
    setIsProcessing(true);
    try {
      // Route to appropriate API based on notification type
      const apiEndpoint = notification.type === "interview_drive"
        ? `/api/drive-notifications/${notification.id}/respond`
        : `/api/job-notifications/${notification.id}/respond`;
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm" }),
      });

      if (response.ok) {
        const itemType = notification.type === "interview_drive" ? "Interview drive" : "Job";
        toast.success(`${itemType} confirmed successfully!`);
        fetchNotifications();
      } else {
        toast.error("Failed to confirm notification");
      }
    } catch (error) {
      console.error("Error confirming notification:", error);
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const openDeclineDialog = (notification: UnifiedNotification) => {
    setSelectedNotification(notification);
    setDeclineNotes("");
    setShowDeclineDialog(true);
  };

  const handleDecline = async () => {
    if (!selectedNotification) return;

    setIsProcessing(true);
    try {
      // Route to appropriate API based on notification type
      const apiEndpoint = selectedNotification.type === "interview_drive"
        ? `/api/drive-notifications/${selectedNotification.id}/respond`
        : `/api/job-notifications/${selectedNotification.id}/respond`;
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "decline",
          notes: declineNotes.trim() || undefined
        }),
      });

      if (response.ok) {
        const itemType = selectedNotification.type === "interview_drive" ? "Interview drive" : "Job";
        toast.success(`${itemType} declined successfully`);
        setShowDeclineDialog(false);
        setSelectedNotification(null);
        setDeclineNotes("");
        fetchNotifications();
      } else {
        toast.error("Failed to decline notification");
      }
    } catch (error) {
      console.error("Error declining notification:", error);
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteNotification = async (notification: UnifiedNotification) => {
    setIsProcessing(true);
    try {
      // Route to appropriate API based on notification type
      const apiEndpoint = notification.type === "interview_drive"
        ? `/api/drive-notifications/${notification.id}`
        : `/api/job-notifications/${notification.id}`;
      
      const response = await fetch(apiEndpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        const itemType = notification.type === "interview_drive" ? "Interview drive" : "Job";
        toast.success(`${itemType} notification deleted successfully!`);
        setShowDeleteDialog(false);
        setNotificationToDelete(null);
        fetchNotifications();
      } else {
        toast.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("An error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatSalary = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    return n.status === filter;
  });

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
            href={`/college/${collegeId}/dashboard`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Job Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and respond to job opportunities from organizations
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="all">All Notifications</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="declined">Declined</option>
            </select>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredNotifications.length} notification(s)
            </span>
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📬</div>
            <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === "all"
                ? "You haven't received any notifications yet"
                : `No ${filter} notifications`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNotifications.map((notification) => {
              const isJobPosting = isJobPostingNotification(notification);
              const isDrive = isDriveNotification(notification);
              
              return (
                <div
                  key={notification.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">
                          {isJobPosting && notification.jobPosting?.role}
                          {isDrive && notification.interviewDrive?.role}
                          {!isJobPosting && !isDrive && "Opportunity"}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(notification.status)}`}>
                          {notification.status}
                        </span>
                        {isDrive && (
                          <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Interview Drive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        From: {notification.organization?.name || "Unknown Organization"}
                      </p>
                    </div>
                    <div className="text-3xl">{isDrive ? "🎯" : "💼"}</div>
                  </div>

                  {/* Job Posting Details */}
                  {isJobPosting && notification.jobPosting && (
                    <>
                      <div className="mb-4">
                        <p className="text-gray-700 dark:text-gray-300">
                          {notification.jobPosting.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Vacancies</div>
                          <div className="text-lg font-semibold">{notification.jobPosting.vacancies}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Salary Range</div>
                          <div className="text-lg font-semibold">
                            {formatSalary(notification.jobPosting.salaryRange.min)} -{" "}
                            {formatSalary(notification.jobPosting.salaryRange.max)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Required Skills:</div>
                        <div className="flex flex-wrap gap-2">
                          {notification.jobPosting.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Interview Drive Details */}
                  {isDrive && notification.interviewDrive && (
                    <>
                      <div className="mb-4">
                        <h4 className="text-lg font-semibold mb-2">{notification.interviewDrive.name}</h4>
                        <p className="text-gray-700 dark:text-gray-300">
                          {notification.interviewDrive.description}
                        </p>
                      </div>

                      {notification.interviewDrive.interviewConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
                            <div className="text-lg font-semibold capitalize">
                              {notification.interviewDrive.interviewConfig.level}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Type</div>
                            <div className="text-lg font-semibold capitalize">
                              {notification.interviewDrive.interviewConfig.type}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
                            <div className="text-lg font-semibold">
                              {notification.interviewDrive.interviewConfig.amount}
                            </div>
                          </div>
                        </div>
                      )}

                      {notification.interviewDrive.interviewConfig?.techstack && 
                       notification.interviewDrive.interviewConfig.techstack.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium mb-2">Tech Stack:</div>
                          <div className="flex flex-wrap gap-2">
                            {notification.interviewDrive.interviewConfig.techstack.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Organization Contact */}
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-sm font-medium mb-1">Organization Contact:</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      📧 {notification.organization?.email} • 📞 {notification.organization?.phone}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {notification.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirm(notification)}
                        disabled={isProcessing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        ✓ Confirm Participation
                      </Button>
                      <Button
                        onClick={() => openDeclineDialog(notification)}
                        disabled={isProcessing}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        ✗ Decline
                      </Button>
                      <Button
                        onClick={() => {
                          setNotificationToDelete(notification);
                          setShowDeleteDialog(true);
                        }}
                        disabled={isProcessing}
                        variant="ghost"
                        className="text-gray-600 hover:text-red-600"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  )}

                  {notification.status === "confirmed" && (
                    <div className="flex gap-2">
                      {isJobPosting && (
                        <Link
                          href={`/college/${collegeId}/upload-students?jobId=${notification.jobPosting?.id}`}
                          className="inline-block"
                        >
                          <Button>📤 Upload Students</Button>
                        </Link>
                      )}
                      {isDrive && (
                        <Link
                          href={`/college/${collegeId}/interview-drives/${notification.interviewDrive?.id}/assign-students`}
                          className="inline-block"
                        >
                          <Button className="bg-purple-600 hover:bg-purple-700">
                            👥 Assign Students to Drive
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={() => {
                          setNotificationToDelete(notification);
                          setShowDeleteDialog(true);
                        }}
                        disabled={isProcessing}
                        variant="ghost"
                        className="text-gray-600 hover:text-red-600"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  )}

                  {notification.status === "declined" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setNotificationToDelete(notification);
                          setShowDeleteDialog(true);
                        }}
                        disabled={isProcessing}
                        variant="destructive"
                      >
                        🗑️ Delete Notification
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Opportunity</DialogTitle>
              <DialogDescription>
                Are you sure you want to decline this opportunity? You can optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            {selectedNotification && (
              <div className="py-4 space-y-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="font-medium">
                    {isJobPostingNotification(selectedNotification) && selectedNotification.jobPosting?.role}
                    {isDriveNotification(selectedNotification) && selectedNotification.interviewDrive?.role}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    From: {selectedNotification.organization?.name}
                  </p>
                </div>
                <div>
                  <label htmlFor="declineNotes" className="block text-sm font-medium mb-2">
                    Reason for Declining (Optional)
                  </label>
                  <Textarea
                    id="declineNotes"
                    value={declineNotes}
                    onChange={(e) => setDeclineNotes(e.target.value)}
                    placeholder="e.g., Not aligned with our current placement goals, timing doesn't work, etc."
                    rows={4}
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This note will be shared with the organization
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineNotes("");
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDecline}
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? "Declining..." : "Decline Opportunity"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Notification</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this notification? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {notificationToDelete && (
              <div className="py-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded">
                  <p className="font-medium">
                    {isJobPostingNotification(notificationToDelete) && notificationToDelete.jobPosting?.role}
                    {isDriveNotification(notificationToDelete) && notificationToDelete.interviewDrive?.role}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    From: {notificationToDelete.organization?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {notificationToDelete.status}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setNotificationToDelete(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => notificationToDelete && handleDeleteNotification(notificationToDelete)}
                disabled={isProcessing}
                variant="destructive"
              >
                {isProcessing ? "Deleting..." : "Delete Notification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
