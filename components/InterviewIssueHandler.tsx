"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface InterviewIssueHandlerProps {
  evaluationId: string;
  currentScore: number;
  driveId?: string;
  studentId?: string;
}

export default function InterviewIssueHandler({ 
  evaluationId, 
  currentScore, 
  driveId,
  studentId
}: InterviewIssueHandlerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [issueType, setIssueType] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  // Show for any score below 30 (covers both missing responses and empty transcripts)
  const shouldShow = currentScore < 30;

  if (!shouldShow) {
    return null;
  }

  const checkIssueType = async () => {
    setIsChecking(true);
    
    try {
      const response = await fetch('/api/debug/transcript-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: evaluationId
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.analysis.transcriptLength === 0) {
          setIssueType('empty_transcript');
        } else if (data.analysis.userResponses.length === 0) {
          setIssueType('missing_responses');
        } else {
          setIssueType('low_quality_responses');
        }
      } else {
        setIssueType('unknown');
      }
    } catch (error) {
      console.error('Error checking issue type:', error);
      setIssueType('unknown');
    } finally {
      setIsChecking(false);
    }
  };

  const handleFix = async () => {
    if (issueType === 'empty_transcript') {
      // Can't fix empty transcripts - need to retake interview
      toast.error(
        "This interview has no recorded transcript. You'll need to take the interview again.",
        { duration: 5000 }
      );
      return;
    }

    setIsFixing(true);
    
    try {
      const response = await fetch('/api/debug/fix-specific-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationId: evaluationId,
          forceReEvaluate: true
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newScore = data.improvements?.newScore || currentScore;
        const improvement = newScore - currentScore;
        
        toast.success(
          `Interview scores fixed! Score improved from ${currentScore} to ${newScore} (+${improvement} points)`,
          { duration: 5000 }
        );
        
        setTimeout(() => {
          localStorage.setItem('scoresJustFixed', 'true');
          window.location.reload();
        }, 2000);
        
      } else {
        toast.error(data.error || 'Failed to fix scores');
      }
    } catch (error) {
      console.error('Error fixing scores:', error);
      toast.error('Network error while fixing scores');
    } finally {
      setIsFixing(false);
    }
  };

  const getIssueMessage = () => {
    switch (issueType) {
      case 'empty_transcript':
        return {
          title: "No Interview Data Found",
          message: "This interview has no recorded transcript. This usually means there was a technical issue during the interview session.",
          action: "Retake Interview",
          actionType: "retake" as const
        };
      case 'missing_responses':
        return {
          title: "Missing Responses Detected", 
          message: "Your interview was recorded but your responses weren't properly captured during evaluation.",
          action: "Fix My Scores",
          actionType: "fix" as const
        };
      case 'low_quality_responses':
        return {
          title: "Response Quality Issue",
          message: "Your responses were captured but may not have been processed correctly.",
          action: "Re-evaluate Interview", 
          actionType: "fix" as const
        };
      default:
        return {
          title: "Low Score Detected",
          message: "Your score appears unusually low. This might be due to a technical issue.",
          action: "Check Issue",
          actionType: "check" as const
        };
    }
  };

  const issueInfo = getIssueMessage();

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <span className="text-red-600 text-xl">🚨</span>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 mb-1">
            {issueInfo.title}
          </h4>
          <p className="text-red-700 text-sm mb-3">
            {issueInfo.message}
          </p>
          
          {issueType === null ? (
            <Button
              onClick={checkIssueType}
              disabled={isChecking}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              {isChecking ? (
                <>
                  <span className="animate-spin mr-2">🔄</span>
                  Checking Issue...
                </>
              ) : (
                <>
                  <span className="mr-2">🔍</span>
                  {issueInfo.action}
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              {issueType === 'empty_transcript' ? (
                <div className="space-y-2">
                  <p className="text-red-800 font-medium text-sm">
                    ❌ No transcript data found - interview needs to be retaken
                  </p>
                  {driveId && (
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/candidate/retake-interview', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ driveId })
                          });
                          
                          const data = await response.json();
                          
                          if (data.success) {
                            toast.success("Interview prepared for retake!");
                            window.location.href = data.interviewUrl;
                          } else {
                            toast.error(data.error || "Failed to prepare retake");
                          }
                        } catch (error) {
                          toast.error("Network error while preparing retake");
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <span className="mr-2">🔄</span>
                      Retake Interview
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  onClick={handleFix}
                  disabled={isFixing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {isFixing ? (
                    <>
                      <span className="animate-spin mr-2">🔄</span>
                      Fixing...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🔧</span>
                      {issueInfo.action}
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}