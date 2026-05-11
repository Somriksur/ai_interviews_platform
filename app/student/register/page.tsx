'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CollegeSearchInput } from '@/components/student/CollegeSearchInput';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Upload } from 'lucide-react';
import { storage } from '@/firebase/client';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
    // Validate resume file if uploaded
    if (resumeFile) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(resumeFile.type)) {
        return 'Resume must be PDF, DOC, DOCX, or TXT format';
      }
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (resumeFile.size > maxSize) {
        return 'Resume file size must be less than 5MB';
      }
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
    setUploadProgress(0);

    try {
      let resumeUrl = "";
      let resumeText = "";

      // Process resume if uploaded - REAL FIREBASE STORAGE UPLOAD
      if (resumeFile) {
        try {
          // Read resume text for NLP processing
          resumeText = await resumeFile.text();
          
          // Upload to Firebase Storage
          const timestamp = Date.now();
          const sanitizedFileName = resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storageRef = ref(storage, `resumes/${timestamp}_${sanitizedFileName}`);
          
          const uploadTask = uploadBytesResumable(storageRef, resumeFile);
          
          // Monitor upload progress
          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              'state_changed',
              (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(Math.round(progress));
              },
              (error) => {
                console.error("Upload error:", error);
                reject(error);
              },
              async () => {
                try {
                  resumeUrl = await getDownloadURL(uploadTask.snapshot.ref);
                  resolve();
                } catch (err) {
                  reject(err);
                }
              }
            );
          });
          
          console.log('✅ Resume uploaded successfully:', resumeUrl);
        } catch (err) {
          console.error("Error uploading resume:", err);
          setError("Failed to upload resume file. Please try again.");
          setIsSubmitting(false);
          setUploadProgress(0);
          return;
        }
      }

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
          ...(resumeUrl && { resumeUrl, resumeText }),
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
      setUploadProgress(0);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
        {/* Full-screen gradient background - Success theme */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7] to-[#bbf7d0] dark:from-[#1c1c1e] dark:via-[#1e2e23] dark:to-[#1f3a29]" />
        
        {/* Animated background elements - Green success colors */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#34c759]/20 dark:bg-[#32d74b]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#30d158]/20 dark:bg-[#30d158]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#34c759]/20 dark:bg-[#32d74b]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Content */}
        <Card className="relative z-10 max-w-2xl w-full p-8 backdrop-blur-xl bg-white/80 dark:bg-[#2c2c2e]/80 shadow-2xl border border-[#d2d2d7]/50 dark:border-[#38383a]/50">
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
    <div className="min-h-screen w-full py-12 px-4 relative overflow-hidden">
      {/* Full-screen gradient background - Warm Light / Comfortable Dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7] via-[#f5f5f7] to-[#e8e8ed] dark:from-[#1c1c1e] dark:via-[#2c2c2e] dark:to-[#3a3a3c]" />
      
      {/* Animated background elements - Apple colors */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#007aff]/20 dark:bg-[#0a84ff]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#34c759]/20 dark:bg-[#32d74b]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#af52de]/20 dark:bg-[#bf5af2]/20 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#007aff] to-[#5856d6] dark:from-[#0a84ff] dark:to-[#5e5ce6] mb-4 shadow-lg">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-4xl font-semibold mb-2 bg-gradient-to-r from-[#007aff] to-[#5856d6] dark:from-[#0a84ff] dark:to-[#5e5ce6] bg-clip-text text-transparent">
            Student Registration
          </h1>
          <p className="text-lg text-[#86868b] dark:text-[#98989d]">
            Register to access campus placement opportunities
          </p>
        </div>

        <Card className="p-8 backdrop-blur-xl bg-white/80 dark:bg-[#2c2c2e]/80 shadow-2xl border border-[#d2d2d7]/50 dark:border-[#38383a]/50">
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

            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                Resume Upload (Optional)
              </label>
              <div className="space-y-2">
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                />
                {resumeFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Selected: <strong>{resumeFile.name}</strong>
                    </p>
                    <p className="text-xs text-green-600">
                      {(resumeFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading resume...</span>
                      <span className="font-medium text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500">
                  Upload your resume to auto-extract skills and improve your profile (PDF, DOC, DOCX, TXT - Max 5MB)
                </p>
              </div>
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
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <a href="/auth/signin" className="text-blue-600 hover:underline dark:text-blue-400">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
