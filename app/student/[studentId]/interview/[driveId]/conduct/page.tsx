"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Vapi from "@vapi-ai/web";
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
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface VapiTokenResponse {
  token?: string;
  value?: string;
  error?: string;
  message?: string;
}

type VapiErrorLike = {
  type?: string;
  stage?: string;
  message?: string;
  error?: unknown;
  errorMsg?: string;
  action?: string;
};

export default function ConductInterviewPage({
  params,
}: {
  params: Promise<{ studentId: string; driveId: string }>;
}) {
  const { studentId, driveId } = use(params);
  const router = useRouter();
  const [drive, setDrive] = useState<InterviewDrive | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vapiRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const checkInterviewStatus = useCallback(async () => {
    try {
      const sessionsResponse = await fetch(`/api/students/${studentId}/assigned-interviews`);
      if (sessionsResponse.ok) {
        const { interviews } = await sessionsResponse.json();
        const thisInterview = interviews.find((i: any) => i.driveId === driveId);

        if (thisInterview && thisInterview.status === "completed") {
          router.push(`/student/${studentId}/interview/${driveId}/complete`);
          return;
        }
      }

      const dashboardResponse = await fetch(`/api/students/${studentId}/dashboard`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const selectionStatus = dashboardData.selectionStatus?.find(
          (s: any) => s.driveId === driveId
        );

        if (
          selectionStatus &&
          (selectionStatus.status === "selected" || selectionStatus.status === "rejected")
        ) {
          router.push(`/student/${studentId}/interview/${driveId}`);
          return;
        }
      }
    } catch (err) {
      console.error("Error checking interview status:", err);
    }
  }, [driveId, router, studentId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const fetchInterviewDrive = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interview-drives/${driveId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch interview drive");
      }

      const data = await response.json();
      setDrive(data);
    } catch (err) {
      console.error("Error fetching interview drive:", err);
      setError("Failed to load interview details");
    } finally {
      setLoading(false);
    }
  }, [driveId]);

  const stopVapiCall = useCallback(async () => {
    if (!vapiRef.current) {
      return;
    }

    try {
      await vapiRef.current.stop?.();
    } catch (stopError) {
      console.warn("Ignoring VAPI stop error during cleanup:", stopError);
    } finally {
      vapiRef.current = null;
    }
  }, []);

  useEffect(() => {
    void checkInterviewStatus();
    void fetchInterviewDrive();

    return () => {
      void stopVapiCall();
    };
  }, [checkInterviewStatus, fetchInterviewDrive, stopVapiCall]);

  const extractVapiErrorMessage = (rawError: unknown): string => {
    const errorObj = (rawError ?? {}) as VapiErrorLike;

    if (
      errorObj.type === "daily-call-object-creation-error" ||
      errorObj.type === "start-method-error"
    ) {
      return "Failed to start the interview call. Please verify microphone permissions and VAPI assistant configuration.";
    }

    if (errorObj.type === "permission-denied") {
      return "Microphone permission was denied. Please allow microphone access and try again.";
    }

    if (
      errorObj.action === "error" &&
      typeof errorObj.errorMsg === "string" &&
      errorObj.errorMsg.toLowerCase().includes("meeting has ended")
    ) {
      return "Interview room ended unexpectedly. Please try starting the interview again.";
    }

    if (typeof errorObj.message === "string" && errorObj.message.trim().length > 0) {
      return errorObj.message;
    }

    if (typeof errorObj.errorMsg === "string" && errorObj.errorMsg.trim().length > 0) {
      return errorObj.errorMsg;
    }

    if (
      typeof errorObj.error === "object" &&
      errorObj.error !== null &&
      "msg" in (errorObj.error as Record<string, unknown>)
    ) {
      const maybeMessage = (errorObj.error as Record<string, unknown>).msg;
      if (typeof maybeMessage === "string" && maybeMessage.trim().length > 0) {
        return maybeMessage;
      }
    }

    if (typeof rawError === "string" && rawError.trim().length > 0) {
      return rawError;
    }

    return "An unexpected error occurred while starting the interview call.";
  };

  const getFallbackVapiToken = () => {
    const publicToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;

    if (!publicToken) {
      throw new Error("VAPI is not configured. Missing both token API and public web token.");
    }

    return publicToken;
  };

  const fetchVapiToken = async (): Promise<string> => {
    try {
      const response = await fetch("/api/vapi/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      const payload = (await response.json().catch(() => ({}))) as VapiTokenResponse;

      if (!response.ok) {
        console.warn("VAPI token API unavailable, falling back to public token.", {
          status: response.status,
          error: payload.error || payload.message || "Unknown token API error",
        });
        return getFallbackVapiToken();
      }

      const token = payload.token || payload.value;
      if (!token) {
        console.warn("VAPI token API returned no token, falling back to public token.");
        return getFallbackVapiToken();
      }

      return token;
    } catch (tokenError) {
      console.warn("VAPI token API request failed, falling back to public token.", tokenError);
      return getFallbackVapiToken();
    }
  };

  const ensureMicrophonePermission = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone is not supported in this browser.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
  };

  const initializeVAPI = async () => {
    if (isStartingInterview || isInterviewActive) {
      return;
    }

    setError(null);
    setIsStartingInterview(true);

    try {
      if (!drive || !drive.questions || drive.questions.length === 0) {
        throw new Error("No questions available for this interview");
      }

      await ensureMicrophonePermission();

      const vapiToken = await fetchVapiToken();
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

      if (!assistantId) {
        throw new Error("VAPI Assistant ID is not configured. Please contact your administrator.");
      }

      const VapiConstructor = (Vapi as any).default || Vapi;

      await stopVapiCall();

      const vapi = new (VapiConstructor as any)(vapiToken);
      vapiRef.current = vapi;

      const sortedQuestions = [...drive.questions].sort((a, b) => a.order - b.order);
      const questionsText = sortedQuestions.map((q, i) => `${i + 1}. ${q.text}`).join("\n");

      vapi.on("call-start", () => {
        setIsInterviewActive(true);
        setError(null);
        addMessage("assistant", "Hello! Let's begin the interview.");

        vapi.send({
          type: "add-message",
          message: {
            role: "system",
            content: `You are a professional AI interviewer conducting technical interviews for software engineering positions.

CRITICAL LANGUAGE REQUIREMENT:
- This interview MUST be conducted in English only
- If the candidate speaks in ANY language other than English (Spanish, Hindi, French, Chinese, Arabic, etc.), immediately interrupt them politely
- Say: "I apologize, but this interview must be conducted in English only. Please answer the question in English."
- Then repeat the current question
- Do NOT proceed to the next question until the candidate responds in English
- Be firm but polite about the English-only requirement

Your role is to:
1. Greet the candidate warmly and professionally
2. Explain that the interview will be conducted in English only
3. Ask relevant technical questions one at a time
4. Wait for the candidate's complete answer before moving to the next question
5. Ask follow-up questions if answers are unclear or need more detail
6. Be encouraging and supportive throughout the interview
7. Maintain a professional yet friendly tone
8. After all questions are answered, thank the candidate for their time

INTERVIEW GUIDELINES:
- Ask questions about programming concepts, frameworks, and best practices
- Focus on React, JavaScript, Node.js, and web development topics
- Ask about problem-solving approaches and real-world scenarios
- Listen carefully and ask clarifying questions when needed
- Keep questions clear and concise
- Allow candidate time to think and formulate answers

IMPORTANT:
- Ask questions sequentially, one at a time
- Be conversational and natural
- Adapt follow-up questions based on candidate's responses
- Keep the interview professional but comfortable
- ENFORCE English-only communication at all times

You are conducting an interview for the role of ${drive.role}.

QUESTIONS TO ASK (${sortedQuestions.length} questions):
${questionsText}

Start by greeting the candidate, explaining the English-only requirement, and asking question 1 now.`,
          },
        });
      });

      vapi.on("call-end", () => {
        setIsInterviewActive(false);
        void handleInterviewEnd();
      });

      vapi.on("message", (message: any) => {
        if (message.type === "transcript" && message.transcriptType === "final") {
          if (message.role === "user") {
            addMessage("user", message.transcript);
          } else if (message.role === "assistant") {
            addMessage("assistant", message.transcript);
          }
        }
      });

      vapi.on("error", (vapiError: unknown) => {
        const message = extractVapiErrorMessage(vapiError);
        console.error("VAPI error:", vapiError);
        setError(message);
        setIsInterviewActive(false);
      });

      await vapi.start(assistantId);
      await createInterviewSession();
    } catch (err) {
      console.error("Error initializing VAPI:", err);
      setError(extractVapiErrorMessage(err));
      setIsInterviewActive(false);
      await stopVapiCall();
    } finally {
      setIsStartingInterview(false);
    }
  };

  const createInterviewSession = async () => {
    try {
      const response = await fetch("/api/interview-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveId,
          studentId,
          status: "in-progress",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.sessionId);
      }
    } catch (err) {
      console.error("Error creating session:", err);
    }
  };

  const addMessage = (role: "user" | "assistant", content: string) => {
    setTranscript((prev) => [
      ...prev,
      {
        role,
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const handleEndInterview = async () => {
    await stopVapiCall();
    setIsInterviewActive(false);

    await handleInterviewEnd();
  };

  const handleInterviewEnd = async () => {
    try {
      if (sessionId) {
        await fetch(`/api/interview-sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            status: "completed",
            completedAt: new Date().toISOString(),
          }),
        });
      } else {
        console.warn("No session ID - creating minimal session for evaluation");

        try {
          const createResponse = await fetch("/api/interview-sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              driveId,
              studentId,
              status: "completed",
              completedAt: new Date().toISOString(),
              transcript: transcript.length > 0 ? transcript : [],
            }),
          });

          if (!createResponse.ok) {
            console.error("Failed to create minimal session");
          }
        } catch (createError) {
          console.error("Error creating minimal session:", createError);
        }
      }

      router.push(`/student/${studentId}/interview/${driveId}/complete`);
    } catch (err) {
      console.error("Error saving interview:", err);
      router.push(`/student/${studentId}/interview/${driveId}/complete`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !drive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Voice Interview Unavailable</h2>
            <p className="text-red-500 mb-4">{error || "Interview not found"}</p>
          </div>

          {error && drive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">Alternative Option</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                The voice interview system is currently unavailable. You can still complete this interview and receive your evaluation by submitting it without voice recording.
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                Your submission will be evaluated based on the interview questions, and you'll receive a detailed report.
              </p>
              <Button onClick={handleEndInterview} size="lg" className="w-full">
                Complete Interview Without Voice
              </Button>
            </div>
          )}

          <div className="text-center">
            <Link href={`/student/${studentId}/interview/${driveId}`}>
              <Button variant="outline">← Back to Interview Details</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{drive.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">Role: {drive.role}</p>
          </div>
          <div className="flex items-center space-x-2">
            {isInterviewActive && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 dark:text-red-300 font-medium">Recording</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Interview Transcript</h2>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {transcript.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <p>Click "Start Interview" to begin</p>
                  </div>
                ) : (
                  transcript.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">{message.role === "user" ? "You" : "Interviewer"}</p>
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              <div className="border-t pt-4">
                {!isInterviewActive ? (
                  <Button onClick={initializeVAPI} size="lg" className="w-full" disabled={isStartingInterview}>
                    {isStartingInterview ? "Starting Interview..." : "🎤 Start Interview"}
                  </Button>
                ) : (
                  <Button onClick={handleEndInterview} size="lg" variant="destructive" className="w-full">
                    ⏹️ End Interview
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Interview Questions</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {drive.questions
                  ?.sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium text-blue-600 dark:text-blue-400">Q{index + 1}.</span>
                      <p className="text-sm mt-1">{question.text}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
