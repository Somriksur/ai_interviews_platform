'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CollegeSearchInput } from '@/components/student/CollegeSearchInput';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface College {
  id: string;
  name: string;
  location: string;
}

export default function StudentRegistrationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    studentName: '',
    email: '',
    collegeName: '',
    rollNumber: '',
    branch: '',
    year: '',
  });
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    setFormData((prev) => ({ ...prev, collegeName: college.name }));
    setError(null);
  };

  const validateForm = (): string | null => {
    if (!formData.studentName.trim()) {
      return 'Please enter your name';
    }
    if (formData.studentName.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      return 'Please enter your email';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!selectedCollege) {
      return 'Please select your college from the search results';
    }
    if (formData.year && (parseInt(formData.year) < 1 || parseInt(formData.year) > 5)) {
      return 'Year must be between 1 and 5';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/students/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName: formData.studentName.trim(),
          email: formData.email.trim().toLowerCase(),
          collegeName: selectedCollege!.name,
          rollNumber: formData.rollNumber.trim() || undefined,
          branch: formData.branch.trim() || undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit registration request');
      }

      setSuccess(true);
      setRequestId(data.requestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Registration Request Submitted!
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Your registration request has been sent to {selectedCollege?.name} for approval.
            </p>
            <Alert className="mb-6 text-left">
              <AlertDescription>
                <strong>What happens next?</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>College administrators will review your request</li>
                  <li>You'll receive an email notification once your request is reviewed</li>
                  <li>If approved, you'll be able to access your student dashboard</li>
                </ul>
              </AlertDescription>
            </Alert>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600">
                <strong>Request ID:</strong> {requestId}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Email:</strong> {formData.email}
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => router.push('/student/check-status')}
                variant="outline"
              >
                Check Status
              </Button>
              <Button onClick={() => router.push('/')}>
                Return to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Student Registration
          </h1>
          <p className="text-lg text-gray-600">
            Register to access campus placement opportunities
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="studentName"
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                placeholder="Enter your full name"
                disabled={isSubmitting}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Use your college email if available
              </p>
            </div>

            <div>
              <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-2">
                College Name <span className="text-red-500">*</span>
              </label>
              <CollegeSearchInput
                value={formData.collegeName}
                onChange={(value) => handleInputChange('collegeName', value)}
                onSelectCollege={handleCollegeSelect}
                placeholder="Search for your college..."
              />
              {selectedCollege && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✓ Selected: <strong>{selectedCollege.name}</strong>
                  </p>
                  <p className="text-xs text-green-600">{selectedCollege.location}</p>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Start typing to search for your college
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Roll Number
                </label>
                <Input
                  id="rollNumber"
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  placeholder="e.g., 2021CS001"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                  Year
                </label>
                <Input
                  id="year"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.year}
                  onChange={(e) => handleInputChange('year', e.target.value)}
                  placeholder="e.g., 3"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                Branch/Department
              </label>
              <Input
                id="branch"
                type="text"
                value={formData.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="e.g., Computer Science"
                disabled={isSubmitting}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Important Information</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Your registration request will be sent to your college for approval</li>
                <li>College administrators will verify your details before approval</li>
                <li>You'll receive an email notification once your request is reviewed</li>
                <li>Make sure all information is accurate to avoid delays</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !selectedCollege}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Registration Request'
                )}
              </Button>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-blue-600 hover:underline">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
