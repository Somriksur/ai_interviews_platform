"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InterviewCompletePage({
  params,
}: {
  params: Promise<{ studentId: string; driveId: string }>;
}) {
  const { studentId } = use(params);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Interview Completed!</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Thank you for completing the interview
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
            What happens next?
          </h2>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200 text-left">
            <li>✓ Your interview has been saved successfully</li>
            <li>✓ Our AI system will evaluate your responses</li>
            <li>✓ A detailed report will be generated</li>
            <li>✓ The report will be shared with your college and the organization</li>
            <li>✓ You'll be notified once the evaluation is complete</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link href={`/student/${studentId}/dashboard`}>
            <Button size="lg" className="w-full">
              Return to Dashboard
            </Button>
          </Link>
          <p className="text-sm text-gray-500">
            You can view your interview results in your dashboard once they're ready
          </p>
        </div>
      </div>
    </div>
  );
}
