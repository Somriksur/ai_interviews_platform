'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CollegeNavigation } from '@/components/college/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  BookOpen,
  Calendar,
  AlertCircle,
  Loader2,
  Filter,
} from 'lucide-react';

interface RegistrationRequest {
  id: string;
  studentName: string;
  email: string;
  collegeName: string;
  rollNumber?: string;
  branch?: string;
  year?: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function RegistrationRequestsPage() {
  const params = useParams();
  const collegeId = params.collegeId as string;

  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Approval/Rejection dialog state
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [collegeId, statusFilter]);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/colleges/${collegeId}/registration-requests?status=${statusFilter}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch registration requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/registration-requests/${selectedRequest.id}/approve`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve request');
      }

      // Refresh the list
      await fetchRequests();
      setShowApproveDialog(false);
      setSelectedRequest(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/registration-requests/${selectedRequest.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject request');
      }

      // Refresh the list
      await fetchRequests();
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
      <CollegeNavigation collegeId={collegeId} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Student Registration Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and manage student registration requests for your college
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400 dark:text-yellow-500" />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-500">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400 dark:text-green-500" />
            </div>
          </Card>
          <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-500">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400 dark:text-red-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All ({stats.total})
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Approved ({stats.approved})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected ({stats.rejected})
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && requests.length === 0 && (
          <Card className="p-12 text-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <User className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Registration Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {statusFilter === 'pending'
                ? 'There are no pending registration requests at this time.'
                : `No ${statusFilter} registration requests found.`}
            </p>
          </Card>
        )}

        {/* Requests List */}
        {!isLoading && requests.length > 0 && (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {request.studentName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted {formatDate(request.submittedAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{request.email}</span>
                  </div>
                  {request.rollNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Roll Number:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{request.rollNumber}</span>
                    </div>
                  )}
                  {request.branch && (
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Branch:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{request.branch}</span>
                    </div>
                  )}
                  {request.year && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">Year:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">Year {request.year}</span>
                    </div>
                  )}
                </div>

                {request.status === 'rejected' && request.rejectionReason && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Rejection Reason:</strong> {request.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}

                {request.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowApproveDialog(true);
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRejectDialog(true);
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}

                {request.status === 'approved' && request.reviewedAt && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-green-600 dark:text-green-500">
                      ✓ Approved on {formatDate(request.reviewedAt)}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Registration Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this registration request?
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="py-4">
                <p className="font-medium">{selectedRequest.studentName}</p>
                <p className="text-sm text-gray-600">{selectedRequest.email}</p>
                <Alert className="mt-4">
                  <AlertDescription>
                    This will create a student account and send an approval notification
                    to the student.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowApproveDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Registration Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this registration request.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="py-4 space-y-4">
                <div>
                  <p className="font-medium">{selectedRequest.studentName}</p>
                  <p className="text-sm text-gray-600">{selectedRequest.email}</p>
                </div>
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium mb-2">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., Invalid roll number, Not a current student, etc."
                    rows={4}
                    disabled={isProcessing}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing || !rejectionReason.trim()}
                variant="destructive"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </>
  );
}
