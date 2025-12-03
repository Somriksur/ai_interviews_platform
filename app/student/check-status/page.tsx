'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

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

export default function CheckStatusPage() {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearched(false);

    try {
      const response = await fetch(
        `/api/students/registration-requests?email=${encodeURIComponent(email.trim())}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch registration requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Check Registration Status
          </h1>
          <p className="text-lg text-gray-600">
            Enter your email to view your registration requests
          </p>
        </div>

        <Card className="p-8 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  placeholder="your.email@example.com"
                  disabled={isSearching}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {searched && requests.length === 0 && (
          <Card className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Registration Requests Found
            </h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any registration requests for <strong>{email}</strong>
            </p>
            <Button onClick={() => window.location.href = '/student/register'}>
              Create New Registration Request
            </Button>
          </Card>
        )}

        {requests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Registration Requests
            </h2>
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.collegeName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Request ID: {request.id}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Student Name</p>
                    <p className="font-medium">{request.studentName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{request.email}</p>
                  </div>
                  {request.rollNumber && (
                    <div>
                      <p className="text-sm text-gray-500">Roll Number</p>
                      <p className="font-medium">{request.rollNumber}</p>
                    </div>
                  )}
                  {request.branch && (
                    <div>
                      <p className="text-sm text-gray-500">Branch</p>
                      <p className="font-medium">{request.branch}</p>
                    </div>
                  )}
                  {request.year && (
                    <div>
                      <p className="text-sm text-gray-500">Year</p>
                      <p className="font-medium">Year {request.year}</p>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Submitted At</p>
                      <p className="text-sm font-medium">{formatDate(request.submittedAt)}</p>
                    </div>
                    {request.reviewedAt && (
                      <div>
                        <p className="text-sm text-gray-500">Reviewed At</p>
                        <p className="text-sm font-medium">{formatDate(request.reviewedAt)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {request.status === 'pending' && (
                  <Alert className="mt-4">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Your request is pending review by {request.collegeName} administrators.
                      You'll receive an email notification once it's reviewed.
                    </AlertDescription>
                  </Alert>
                )}

                {request.status === 'approved' && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-2">
                        <p className="font-semibold">Congratulations! Your registration has been approved.</p>
                        <p className="text-sm">
                          <strong>Next Step:</strong> Create your account to access the system.
                        </p>
                        <ol className="text-sm list-decimal list-inside space-y-1 ml-2">
                          <li>
                            Go to{' '}
                            <a href="/auth/sign-in" className="font-medium underline">
                              Sign Up page
                            </a>
                          </li>
                          <li>Click "Don't have an account? Sign up"</li>
                          <li>Use your registered email: <strong>{request.email}</strong></li>
                          <li>Create a password and select "Student" as your role</li>
                          <li>Then sign in with your new credentials</li>
                        </ol>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {request.status === 'rejected' && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Request Rejected</strong>
                      {request.rejectionReason && (
                        <p className="mt-1">Reason: {request.rejectionReason}</p>
                      )}
                      <p className="mt-2">
                        You may submit a new registration request with corrected information.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/support" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
