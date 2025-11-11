"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";

type ConnectionStatus = "idle" | "starting" | "in-call" | "ended" | "error";

export default function CandidateInterviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: interviewId } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [interview, setInterview] = useState<Interview | null>(null);
    const [transcript, setTranscript] = useState<Array<{ role: string; content: string }>>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [vapiClient, setVapiClient] = useState<any>(null);

    useEffect(() => {
        // Check authentication first
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                setIsCheckingAuth(false);
            } else {
                setIsCheckingAuth(false);
                toast.error("Please sign in to access this interview");
                router.push(`/auth/sign-in?redirect=/candidate/interview/${interviewId}`);
            }
        });

        return () => unsubscribe();
    }, [interviewId, router]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Fetch interview details
        fetch(`/api/candidate/interview/${interviewId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setInterview(data.interview);
                } else {
                    toast.error(data.error);
                    router.push("/candidate/dashboard");
                }
            });

        // Initialize Vapi
        const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN;
        if (!PUBLIC_KEY) {
            setErrorMessage("Vapi configuration missing");
            return;
        }

        try {
            console.log("Initializing Vapi with token:", PUBLIC_KEY?.substring(0, 10) + "...");
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const VapiConstructor = (Vapi as any).default || Vapi;
            console.log("Vapi constructor loaded:", typeof VapiConstructor);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = new (VapiConstructor as any)(PUBLIC_KEY);
            console.log("Vapi client created");
            
            setVapiClient(client);

            client.on?.("call-start", () => {
                console.log("Interview started");
                setStatus("in-call");
                toast.success("Interview started!");
            });

            client.on?.("call-end", () => {
                console.log("Interview ended");
                setStatus("ended");
                submitInterview();
            });

            client.on?.("message", (message: { type?: string; transcript?: string; role?: string; error?: string }) => {
                console.log("Vapi Message Type:", message.type);
                
                if (message.type === "transcript" && message.transcript) {
                    console.log("Transcript captured:", {
                        role: message.role,
                        text: message.transcript.substring(0, 50) + "..."
                    });
                    setTranscript(prev => {
                        const updated = [...prev, {
                            role: message.role || "assistant",
                            content: message.transcript || "",
                        }];
                        console.log("Total transcript entries:", updated.length);
                        return updated;
                    });
                }

                if (message.type === "error") {
                    console.error("Vapi error:", message.error);
                    setErrorMessage(message.error || "Call failed");
                    setStatus("error");
                }
            });

            client.on?.("error", (error: Error) => {
                console.error("Vapi error:", error);
                setErrorMessage(error?.message || "Unknown error");
                setStatus("error");
            });
        } catch (error) {
            console.error("Failed to initialize Vapi:", error);
            setErrorMessage("Failed to initialize voice system");
        }

        return () => {
            if (vapiClient) {
                vapiClient.stop?.();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId, isAuthenticated]);

    const startInterview = async () => {
        if (!interview) {
            toast.error("Interview not loaded");
            return;
        }

        setStatus("starting");
        setErrorMessage("");

        try {
            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
            
            if (!assistantId) {
                setErrorMessage("Voice assistant not configured. Add NEXT_PUBLIC_VAPI_ASSISTANT_ID to .env.local");
                setStatus("error");
                return;
            }

            console.log("Starting interview with", interview.questions.length, "questions");
            console.log("Using Assistant ID:", assistantId);
            console.log("Vapi client status:", vapiClient ? "Ready" : "Not initialized");
            
            // Log questions for debugging
            console.log("Interview questions:");
            interview.questions.forEach((q, i) => {
                console.log(`   ${i + 1}. ${q.substring(0, 80)}...`);
            });

            if (!vapiClient) {
                throw new Error("Vapi client not initialized");
            }

            console.log("Calling vapiClient.start()...");
            
            // Start Vapi with just the assistant ID
            const result = await vapiClient.start(assistantId);
            
            console.log("Vapi start result:", result);
        } catch (error) {
            console.error("Failed to start interview:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to start interview";
            setErrorMessage(errorMessage);
            setStatus("error");
        }
    };

    const endInterview = async () => {
        await vapiClient?.stop();
        setStatus("ended");
        submitInterview();
    };

    const submitInterview = async () => {
        try {
            const res = await fetch("/api/candidate/submit-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId,
                    transcript,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("Interview submitted! Generating feedback...");
                router.push(`/candidate/feedback/${data.feedbackId}`);
            } else {
                toast.error("Failed to submit interview");
            }
        } catch (error) {
            console.error("Failed to submit interview:", error);
            toast.error("Failed to submit interview");
        }
    };

    if (isCheckingAuth || !isAuthenticated) {
        return (
            <div className="container mx-auto p-6 flex flex-col items-center justify-center min-h-screen space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-gray-400">
                    {isCheckingAuth ? "Checking authentication..." : "Redirecting to sign in..."}
                </p>
            </div>
        );
    }

    if (!interview) {
        return (
            <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="card p-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">{interview.role} Interview</h1>
                    <p className="text-gray-400 mt-2">
                        {interview.level} • {interview.type}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {interview.techstack.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                            {tech}
                        </span>
                    ))}
                </div>

                <div className="border-t pt-6">
                    <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                        <h3 className="font-semibold mb-2 text-blue-400">Interview Information</h3>
                        <p className="text-sm text-gray-300 mb-2">
                            This is a live voice interview with {interview.questions.length} questions.
                        </p>
                        <p className="text-sm text-gray-300">
                            <strong>Note:</strong> Questions will be asked by the HireFlow interviewer during the call. 
                            Listen carefully and answer naturally. This simulates a real interview experience.
                        </p>
                    </div>
                </div>

                <div className="border-t pt-6 flex flex-col items-center space-y-4">
                    <div className="text-center">
                        <p className="text-lg font-semibold">Status: {status}</p>
                        {errorMessage && (
                            <p className="text-red-400 text-sm mt-2">{errorMessage}</p>
                        )}
                    </div>

                    {status === "idle" && (
                        <Button 
                            onClick={() => {
                                console.log("Start Interview button clicked");
                                startInterview();
                            }} 
                            className="btn-primary px-8 py-6 text-lg"
                        >
                            Start Voice Interview
                        </Button>
                    )}

                    {status === "starting" && (
                        <div className="flex flex-col items-center space-y-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-yellow-400">Connecting...</p>
                        </div>
                    )}

                    {status === "in-call" && (
                        <div className="space-y-6 w-full">
                            <div className="flex justify-center items-center gap-3">
                                <div className="animate-pulse bg-red-500 rounded-full h-4 w-4"></div>
                                <span className="text-lg font-medium">Recording...</span>
                            </div>
                            
                            {/* Code Editor for typing answers */}
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">Type Your Answer (Optional)</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    For coding questions or detailed explanations, you can type your answer here in addition to speaking.
                                </p>
                                <textarea
                                    placeholder="Type code or detailed answer here..."
                                    className="w-full h-48 p-4 bg-gray-900 border border-gray-600 rounded-lg font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    spellCheck={false}
                                    onChange={(e) => {
                                        // Add typed answer to transcript
                                        if (e.target.value && e.target.value.length > 10) {
                                            const lastValue = e.target.getAttribute('data-last-value') || '';
                                            if (e.target.value !== lastValue && e.target.value.length > lastValue.length + 50) {
                                                setTranscript(prev => [...prev, {
                                                    role: "user",
                                                    content: `[Typed Answer]: ${e.target.value}`,
                                                }]);
                                                e.target.setAttribute('data-last-value', e.target.value);
                                            }
                                        }
                                    }}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Your typed answers will be included in the interview transcript
                                </p>
                            </div>
                            
                            <Button onClick={endInterview} className="btn-danger w-full py-4 text-lg">
                                End Interview
                            </Button>
                        </div>
                    )}

                    {status === "ended" && (
                        <div className="text-center">
                            <p className="text-green-400 text-lg">Interview completed!</p>
                            <p className="text-sm text-gray-400 mt-2">Generating your feedback...</p>
                        </div>
                    )}

                    {status === "error" && (
                        <Button onClick={() => setStatus("idle")} className="btn-primary">
                            Try Again
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
