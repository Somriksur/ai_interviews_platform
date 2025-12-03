"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function DriveSelectionsPage() {
  const params = useParams();
  const collegeId = params.collegeId as string;

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  // Dialog state
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState<"acknowledged" | "retag_requested">("acknowledged");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSelections();
  }, [collegeId]);

  const fetchSelections = async () => {
    try {
      console.log('🔍 Fetching selections for college:', collegeId);
      const response = await fetch(`/api/colleges/${collegeId}/drive-selections`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Received data:', {
          notifications: data.notifications?.length || 0,
          students: data.students?.length || 0,
          drives: data.drives?.length || 0,
          summary: data.summary,
        });
        
        setNotifications(data.notifications || []);
        setStudents(data.students || []);
        setDrives(data.drives || []);
        setOrganizations(data.organizations || []);
        setSummary(data.summary);
      } else {
        console.error('❌ Failed to fetch:', response.statusText);
        toast.error("Failed to fetch selections");
      }
    } catch (error) {
      console.error("❌ Error fetching selections:", error);
      toast.error("Error loading selections");
    } finally {
      setLoading(false);
    }
  };

  const getStudent = (studentId: string) => {
    return students.find((s: any) => s.id === studentId);
  };

  const getDrive = (driveId: string) => {
    return drives.find((d: any) => d.id === driveId);
  };

  const getOrganization = (orgId: string) => {
    return organizations.find((o: any) => o.id === orgId);
  };

  const getActionBadge = (action: string) => {
    const badges: any = {
      selected: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return badges[action] || "";
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      retag_requested: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    };
    return badges[status] || "";
  };

  const handleOpenResponseDialog = (notification: any, type: "acknowledged" | "retag_requested") => {
    setSelectedNotification(notification);
    setResponseType(type);
    setNotes("");
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedNotification) return;

    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/college-notifications/${selectedNotification.id}/respond`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            collegeId,
            response: responseType,
            notes: notes.trim() || null,
          }),
        }
      );

      if (response.ok) {
        toast.success(
          responseType === "acknowledged"
            ? "Selection acknowledged successfully"
            : "Re-tag request submitted successfully"
        );
        setShowResponseDialog(false);
        fetchSelections(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to submit response");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
      toast.error("Error submitting response");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filterStatus !== "all" && notification.status !== filterStatus) return false;
    if (filterAction !== "all" && notification.action !== filterAction) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Interview Drive Selections</h1>
        <p className="text-muted-foreground mt-2">
          View and respond to student selections from interview drives
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{summary.total}</p>
          </div>
          <div className="card p-4 bg-green-50 dark:bg-green-900/20">
            <p className="text-sm text-green-800 dark:text-green-200">Selected</p>
            <p className="text-2xl font-bold text-green-800 dark:text-green-200">
              {summary.selected}
            </p>
          </div>
          <div className="card p-4 bg-red-50 dark:bg-red-900/20">
            <p className="text-sm text-red-800 dark:text-red-200">Rejected</p>
            <p className="text-2xl font-bold text-red-800 dark:text-red-200">
              {summary.rejected}
            </p>
          </div>
          <div className="card p-4 bg-yellow-50 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">Pending</p>
            <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
              {summary.pending}
            </p>
          </div>
          <div className="card p-4 bg-purple-50 dark:bg-purple-900/20">
            <p className="text-sm text-purple-800 dark:text-purple-200">Re-tag Requested</p>
            <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
              {summary.retagRequested}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="retag_requested">Re-tag Requested</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Action</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="all">All Actions</option>
              <option value="selected">Selected</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground">No selections found</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const student = getStudent(notification.studentId);
            const drive = getDrive(notification.driveId);
            const organization = getOrganization(notification.organizationId);

            return (
              <div key={notification.id} className="card p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getActionBadge(
                        notification.action
                      )}`}
                    >
                      {notification.action === "selected" ? "✓ Selected" : "✗ Rejected"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                        notification.status
                      )}`}
                    >
                      {notification.status === "pending"
                        ? "Pending Response"
                        : notification.status === "acknowledged"
                        ? "Acknowledged"
                        : "Re-tag Requested"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-medium text-lg">{student?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">
                      {student?.rollNumber} • {student?.branch}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interview Drive</p>
                    <p className="font-medium">{drive?.name || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">{drive?.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{organization?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student CGPA</p>
                    <p className="font-medium">{student?.cgpa || "N/A"}</p>
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg mb-4">
                  <p className="text-sm">{notification.message}</p>
                </div>

                {notification.collegeNotes && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                      Your Notes:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {notification.collegeNotes}
                    </p>
                  </div>
                )}

                {notification.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleOpenResponseDialog(notification, "acknowledged")}
                      variant="default"
                    >
                      Acknowledge
                    </Button>
                    <Button
                      onClick={() => handleOpenResponseDialog(notification, "retag_requested")}
                      variant="outline"
                    >
                      Request Re-tag
                    </Button>
                  </div>
                )}

                {notification.status !== "pending" && notification.respondedAt && (
                  <p className="text-sm text-muted-foreground">
                    Responded on {new Date(notification.respondedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === "acknowledged" ? "Acknowledge Selection" : "Request Re-tag"}
            </DialogTitle>
            <DialogDescription>
              {responseType === "acknowledged"
                ? "Confirm that you acknowledge this selection decision."
                : "Request the organization to re-evaluate this student's selection status."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedNotification && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {getStudent(selectedNotification.studentId)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {getDrive(selectedNotification.driveId)?.name}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Notes {responseType === "retag_requested" && "(Required)"}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  responseType === "acknowledged"
                    ? "Add any notes (optional)"
                    : "Explain why you're requesting a re-tag"
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={submitting || (responseType === "retag_requested" && !notes.trim())}
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
