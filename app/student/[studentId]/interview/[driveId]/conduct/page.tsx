"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Dynamic import for VAPI to avoid SSR issues
// import Vapi from "@vapi-ai/web";

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
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const vapiRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkInterviewStatus();
    fetchInterviewDrive();
    return () => {
      // Cleanup VAPI on unmount
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, [driveId, studentId]);

  const checkInterviewStatus = async () => {
    try {
      // Check if interview is already completed
      const sessionsResponse = await fetch(`/api/students/${studentId}/assigned-interviews`);
      if (sessionsResponse.ok) {
        const { interviews } = await sessionsResponse.json();
        const thisInterview = interviews.find((i: any) => i.driveId === driveId);
        
        if (thisInterview && thisInterview.status === 'completed') {
          // Redirect to complete page
          router.push(`/student/${studentId}/interview/${driveId}/complete`);
          return;
        }
      }

      // Check if student has been selected/rejected
      const dashboardResponse = await fetch(`/api/students/${studentId}/dashboard`);
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const selectionStatus = dashboardData.selectionStatus?.find(
          (s: any) => s.driveId === driveId
        );
        
        if (selectionStatus && (selectionStatus.status === 'selected' || selectionStatus.status === 'rejected')) {
          // Redirect back to interview page
          router.push(`/student/${studentId}/interview/${driveId}`);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking interview status:', err);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom of transcript
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const fetchInterviewDrive = async () => {
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
  };

  const initializeVAPI = async () => {
    try {
      if (!drive || !drive.questions || drive.questions.length === 0) {
        alert("No questions available for this interview");
        return;
      }

      // Check if VAPI token is configured
      const vapiToken = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
      if (!vapiToken) {
        setError("VAPI is not configured. Please contact your administrator.");
        console.error("NEXT_PUBLIC_VAPI_WEB_TOKEN is not set");
        return;
      }

      console.log("Initializing VAPI with token:", vapiToken.substring(0, 8) + "...");

      // Dynamic import VAPI to avoid SSR issues
      const VapiModule = await import("@vapi-ai/web");
      const Vapi = (VapiModule.default || VapiModule) as any;
      
      // Initialize VAPI
      const vapi = new Vapi(vapiToken);
      vapiRef.current = vapi;

      // Prepare questions for the system message
      const sortedQuestions = [...drive.questions].sort((a, b) => a.order - b.order);
      const questionsText = sortedQuestions
        .map((q, i) => `${i + 1}. ${q.text}`)
        .join("\n");

      // Set up event listeners
      vapi.on("call-start", () => {
        console.log("Call started");
        setIsInterviewActive(true);
        addMessage("assistant", "Hello! Let's begin the interview.");
        
        // Send comprehensive system prompt with interview questions
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
        console.log("Call ended");
        setIsInterviewActive(false);
        handleInterviewEnd();
      });

      vapi.on("speech-start", () => {
        console.log("User started speaking");
      });

      vapi.on("speech-end", () => {
        console.log("User stopped speaking");
      });

      vapi.on("message", (message: any) => {
        console.log("Message received:", message);
        
        if (message.type === "transcript" && message.transcriptType === "final") {
          if (message.role === "user") {
            addMessage("user", message.transcript);
          } else if (message.role === "assistant") {
            addMessage("assistant", message.transcript);
          }
        }
      });

      vapi.on("error", (error: any) => {
        console.error("VAPI error details:", {
          error,
          message: error?.message,
          code: error?.code,
          details: error?.details,
          stack: error?.stack,
        });
        
        let errorMessage = "An error occurred during the interview";
        if (error?.message) {
          errorMessage += `: ${error.message}`;
        }
        
        setError(errorMessage);
        setIsInterviewActive(false);
      });

      // Start the call with assistant ID
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      
      if (!assistantId) {
        setError("VAPI Assistant ID is not configured. Please contact your administrator.");
        console.error("NEXT_PUBLIC_VAPI_ASSISTANT_ID is not set");
        return;
      }
      
      console.log("Starting VAPI with assistant:", assistantId);
      console.log("Interview questions:", questionsText);
      
      // Use assistant as-is (you'll need to configure questions in VAPI dashboard)
      await vapi.start(assistantId);

      // Create session in database
      await createInterviewSession();
    } catch (err) {
      console.error("Error initializing VAPI:", err);
      setError("Failed to start interview. Please check your microphone permissions.");
      setIsInterviewActive(false);
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
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setIsInterviewActive(false);
    await handleInterviewEnd();
  };

  const handleInterviewEnd = async () => {
    if (!sessionId) return;

    try {
      // Save transcript to database
      await fetch(`/api/interview-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          status: "completed",
          completedAt: new Date(),
        }),
      });

      // Redirect to completion page
      router.push(`/student/${studentId}/interview/${driveId}/complete`);
    } catch (err) {
      console.error("Error saving interview:", err);
      setError("Failed to save interview. Please try again.");
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Interview not found"}</p>
          <Link href={`/student/${studentId}/interview/${driveId}`}>
            <Button variant="outline">← Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
          {/* Transcript Panel */}
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
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        <p className="text-sm font-medium mb-1">
                          {message.role === "user" ? "You" : "Interviewer"}
                        </p>
                        <p>{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>

              {/* Controls */}
              <div className="border-t pt-4">
                {!isInterviewActive ? (
                  <Button
                    onClick={initializeVAPI}
                    size="lg"
                    className="w-full"
                  >
                    🎤 Start Interview
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndInterview}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                  >
                    ⏹️ End Interview
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Questions Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-semibold mb-4">Interview Questions</h2>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {drive.questions
                  ?.sort((a, b) => a.order - b.order)
                  .map((question, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        Q{index + 1}.
                      </span>
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
