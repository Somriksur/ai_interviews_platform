"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Question {
  text: string;
  order: number;
  generatedBy: string;
}

interface InterviewDrive {
  id: string;
  name: string;
  description: string;
  role: string;
  questions: Question[];
  organizationId: string;
  taggedColleges?: string[]; // Original casing
  organizationName?: string;
  status?: string; // active, completed, cancelled
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  collegeName: string; // Original casing
  normalizedCollegeName: string;
}

export default function StudentInterviewPage({
  params,
}: {
  params: Promise<{ studentId: string; driveId: string }>;
}) {
  const { studentId, driveId } = use(params);
  const router = useRouter();
  const [drive, setDrive] = useState<InterviewDrive | null>(null);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<{
    completed: boolean;
    selected: boolean;
    rejected: boolean;
  }>({ completed: false, selected: false, rejected: false });

  useEffect(() => {
    fetchStudentProfile();
    fetchInterviewDrive();
    checkInterviewStatus();
  }, [driveId, studentId]);

  const fetchStudentProfile = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}`);
      if (response.ok) {
        const data = await response.json();
        setStudent(data);
      }
    } catch (err) {
      console.error('Error fetching student profile:', err);
    }
  };

  const checkInterviewStatus = async () => {
    try {
      // Check if interview is already completed
      const sessionsResponse = await fetch(`/api/students/${studentId}/assigned-interviews`);
      if (sessionsResponse.ok) {
        const { interviews } = await sessionsResponse.json();
        const thisInterview = interviews.find((i: any) => i.driveId === driveId);
        
        if (thisInterview && thisInterview.status === 'completed') {
          setInterviewStatus(prev => ({ ...prev, completed: true }));
        }
      }

      // Check if student has been selected/rejected
      const dashboardResponse = await fetch(`/api/students/${studentId}/dashboard`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const selectionStatus = dashboardData.selectionStatus?.find(
          (s: any) => s.driveId === driveId
        );
        
        if (selectionStatus) {
          if (selectionStatus.status === 'selected') {
            setInterviewStatus(prev => ({ ...prev, selected: true }));
          } else if (selectionStatus.status === 'rejected') {
            setInterviewStatus(prev => ({ ...prev, rejected: true }));
          }
        }
      }
    } catch (err) {
      console.error('Error checking interview status:', err);
    }
  };

  const fetchInterviewDrive = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interview-drives/${driveId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch interview drive");
      }

      const data = await response.json();
      setDrive(data); // API returns drive data directly
    } catch (err) {
      console.error("Error fetching interview drive:", err);
      setError("Failed to load interview details");
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    // Navigate to the actual interview conductor page
    router.push(`/student/${studentId}/interview/${driveId}/conduct`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Interview not found"}</p>
          <Link href={`/student/${studentId}/profile`}>
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/student/${studentId}/profile`}
            className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">{drive.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{drive.description}</p>
        </div>

        {/* Interview Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Interview Information</h2>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-32">Role:</span>
              <span className="font-medium">{drive.role}</span>
            </div>
            {drive.organizationName && (
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 w-32">Organization:</span>
                <span className="font-medium">{drive.organizationName}</span>
              </div>
            )}
            {student && (
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 w-32">Your College:</span>
                <span className="font-medium">{student.collegeName}</span>
              </div>
            )}
            {drive.taggedColleges && drive.taggedColleges.length > 0 && (
              <div className="flex items-start">
                <span className="text-gray-600 dark:text-gray-400 w-32">Tagged Colleges:</span>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {drive.taggedColleges.map((college, idx) => (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-sm ${
                          student && college.toLowerCase() === student.normalizedCollegeName
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {college}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-32">Questions:</span>
              <span className="font-medium">{drive.questions?.length || 0} questions</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 w-32">Type:</span>
              <span className="font-medium">AI Voice Interview</span>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {drive.questions && drive.questions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Interview Questions</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              You will be asked the following questions during the interview:
            </p>
            <div className="space-y-3">
              {drive.questions
                .sort((a, b) => a.order - b.order)
                .map((question, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="font-medium text-blue-600 mr-2">
                      Q{index + 1}.
                    </span>
                    <span>{question.text}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            📋 Interview Instructions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• Ensure you have a stable internet connection</li>
            <li>• Allow microphone access when prompted</li>
            <li>• Find a quiet place for the interview</li>
            <li>• Speak clearly and at a moderate pace</li>
            <li>• The AI will ask questions one at a time</li>
            <li>• Take your time to think before answering</li>
            <li>• You can end the interview at any time</li>
          </ul>
        </div>

        {/* Status Messages */}
        {drive.status === 'completed' && (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              📋 Interview Drive Completed
            </h3>
            <p className="text-gray-800 dark:text-gray-200">
              This interview drive has been completed. No new interviews are being accepted.
            </p>
          </div>
        )}

        {drive.status === 'cancelled' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-red-900 dark:text-red-100">
              ❌ Interview Drive Cancelled
            </h3>
            <p className="text-red-800 dark:text-red-200">
              This interview drive has been cancelled and is no longer active.
            </p>
          </div>
        )}

        {interviewStatus.selected && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-100">
              🎉 Congratulations! You've Been Selected
            </h3>
            <p className="text-green-800 dark:text-green-200">
              You have already been selected for this position. The interview process is complete.
            </p>
          </div>
        )}

        {interviewStatus.rejected && (
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Interview Process Complete
            </h3>
            <p className="text-gray-800 dark:text-gray-200">
              The selection process for this interview drive has been completed.
            </p>
          </div>
        )}

        {interviewStatus.completed && !interviewStatus.selected && !interviewStatus.rejected && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-900 dark:text-blue-100">
              ✅ Interview Completed
            </h3>
            <p className="text-blue-800 dark:text-blue-200">
              You have already completed this interview. Please wait for the selection results.
            </p>
          </div>
        )}

        {/* Start Interview Button */}
        <div className="text-center">
          {!interviewStatus.completed && !interviewStatus.selected && !interviewStatus.rejected && drive.status !== 'completed' && drive.status !== 'cancelled' ? (
            <>
              <Button
                onClick={handleStartInterview}
                size="lg"
                className="px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                🎤 Start Interview
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                The interview will begin once you click the button above
              </p>
            </>
          ) : (
            <>
              <Button
                disabled
                size="lg"
                className="px-8 py-6 text-lg bg-gray-400 cursor-not-allowed opacity-60"
              >
                {drive.status === 'completed' ? '📋 Drive Completed' :
                 drive.status === 'cancelled' ? '❌ Drive Cancelled' :
                 interviewStatus.selected ? '✅ Selected' : 
                 interviewStatus.rejected ? '📋 Process Complete' : 
                 '✅ Interview Completed'}
              </Button>
              <p className="text-sm text-gray-500 mt-4">
                {drive.status === 'completed' ? 'This interview drive has been completed' :
                 drive.status === 'cancelled' ? 'This interview drive has been cancelled' :
                 interviewStatus.selected || interviewStatus.rejected
                  ? 'The selection process is complete'
                  : 'You have already completed this interview'}
              </p>
              <Link href={`/student/${studentId}/dashboard`} className="block mt-4">
                <Button variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  ← Back to Dashboard
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
