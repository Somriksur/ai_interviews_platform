"use client";

import React, { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";
import Image from "next/image";

type ConnectionStatus = "idle" | "starting" | "in-call" | "ended" | "error";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}

export default function VoiceInterview() {
    const [status, setStatus] = useState<ConnectionStatus>("idle");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vapiRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (vapiRef.current) return;

        const PUBLIC_KEY =
            process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN ||
            "63c11b0b-ba09-42d9-b25e-4c8985b7197b";

        console.log("🔑 Initializing Vapi client with key:", PUBLIC_KEY.slice(0, 8));

        try {
            // Handle both default and named exports
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const VapiConstructor = (Vapi as any).default || Vapi;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const client = new (VapiConstructor as any)(PUBLIC_KEY);
            vapiRef.current = client;

            // Enhanced event listeners with better error handling
            client.on?.("call-start", () => {
                console.log("✅ Call started successfully");
                setStatus("in-call");
                setErrorMessage("");
            });

            client.on?.("call-end", () => {
                console.log("📞 Call ended");
                setStatus("ended");
            });

            client.on?.("error", (error: Error & { error?: string }) => {
                console.error("❌ Vapi error:", error);
                const errorMsg = error?.message || error?.error || "Unknown error occurred";
                setErrorMessage(errorMsg);
                setStatus("error");
            });

            client.on?.("message", (message: { type?: string; error?: string; transcriptType?: string; role?: string; transcript?: string }) => {
                console.log("📨 Vapi message:", message);
                
                // Handle specific error messages
                if (message?.type === "error") {
                    setErrorMessage(message.error || "Call failed");
                    setStatus("error");
                }

                // Handle transcript messages with enhanced validation
                if (message?.type === "transcript" && message.transcript) {
                    // Accept both "final" and "partial" transcripts, but prefer final
                    const isFinal = message.transcriptType === "final";
                    const isPartial = message.transcriptType === "partial";
                    
                    // Only process if we have meaningful content
                    if (message.transcript.trim().length > 2) {
                        const newMessage: Message = {
                            role: message.role === "assistant" ? "assistant" : "user",
                            content: message.transcript.trim(),
                            timestamp: new Date()
                        };
                        
                        console.log(`📝 Capturing ${isFinal ? 'FINAL' : 'PARTIAL'} transcript:`, {
                            role: newMessage.role,
                            content: newMessage.content.substring(0, 100) + '...',
                            length: newMessage.content.length
                        });
                        
                        // For final transcripts, always add
                        // For partial transcripts, only add if it's significantly different from the last message
                        if (isFinal) {
                            setMessages(prev => {
                                // Remove any partial transcript from the same role that might be similar
                                const filtered = prev.filter((msg, index) => {
                                    if (index === prev.length - 1 && msg.role === newMessage.role) {
                                        // If the last message is from the same role and very similar, replace it
                                        const similarity = calculateSimilarity(msg.content, newMessage.content);
                                        return similarity < 0.8; // Keep if less than 80% similar
                                    }
                                    return true;
                                });
                                return [...filtered, newMessage];
                            });
                        } else if (isPartial) {
                            // For partial transcripts, update the last message if it's from the same role
                            setMessages(prev => {
                                if (prev.length > 0 && prev[prev.length - 1].role === newMessage.role) {
                                    // Update the last message with the partial transcript
                                    const updated = [...prev];
                                    updated[updated.length - 1] = newMessage;
                                    return updated;
                                } else {
                                    // Add as new message if different role
                                    return [...prev, newMessage];
                                }
                            });
                        }
                    }
                }
            });

        } catch (error) {
            console.error("❌ Failed to initialize Vapi:", error);
            setErrorMessage("Failed to initialize Vapi client");
            setStatus("error");
        }

        return () => {
            if (vapiRef.current) {
                void vapiRef.current.stop?.();
                vapiRef.current = null;
            }
        };
    }, []);

    const startInterview = async () => {
        setStatus("starting");
        setErrorMessage("");
        setMessages([]);
        
        try {
            const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
            
            if (!vapiRef.current) {
                throw new Error("Vapi client not initialized");
            }

            if (assistantId) {
                // Use assistant ID from environment (recommended)
                console.log("🎯 Starting interview with assistant ID:", assistantId);
                await vapiRef.current.start(assistantId, {
                    // Override assistant instructions to enforce English
                    assistantOverrides: {
                        firstMessage: "Hello! I'm your HireFlow interviewer. Please note that this interview must be conducted in English only. Let's begin with the first question.",
                        model: {
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a HireFlow interviewer. IMPORTANT: If the candidate speaks in any language other than English, politely interrupt them and say: 'I apologize, but this interview must be conducted in English only. Please answer in English.' Then repeat the current question. Only proceed with the interview if the candidate responds in English."
                                }
                            ]
                        }
                    }
                });
            } else {
                // Show warning about missing assistant ID
                console.warn("⚠️ No NEXT_PUBLIC_VAPI_ASSISTANT_ID found in environment");
                console.warn("💡 You need to create an assistant at https://dashboard.vapi.ai");
                console.warn("📝 Then add NEXT_PUBLIC_VAPI_ASSISTANT_ID to your .env.local file");
                
                setErrorMessage(
                    "No assistant configured. Please create an assistant in Vapi dashboard and add NEXT_PUBLIC_VAPI_ASSISTANT_ID to .env.local"
                );
                setStatus("error");
                return;
            }
        } catch (error) {
            console.error("❌ Failed to start interview:", error);
            const errorMsg = error instanceof Error ? error.message : "Failed to start call";
            setErrorMessage(errorMsg);
            setStatus("error");
        }
    };

    const endInterview = async () => {
        console.log('🔚 Ending interview...');
        
        // Validate that we have captured responses before ending
        const userMessages = messages.filter(msg => msg.role === 'user');
        
        if (userMessages.length === 0) {
            console.warn('⚠️ No user responses captured!');
            const shouldContinue = confirm(
                'No responses were captured during this interview. This might be due to microphone issues. ' +
                'Do you want to end the interview anyway? (This will result in a low score)'
            );
            
            if (!shouldContinue) {
                return; // Don't end the interview
            }
        } else {
            console.log('✅ Interview validation passed:', {
                totalMessages: messages.length,
                userResponses: userMessages.length,
                avgResponseLength: userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / userMessages.length
            });
        }
        
        await vapiRef.current?.stop?.();
        setStatus("ended");
    };

    // Helper function to calculate text similarity
    const calculateSimilarity = (text1: string, text2: string): number => {
        const words1 = text1.toLowerCase().split(/\s+/);
        const words2 = text2.toLowerCase().split(/\s+/);
        
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-6 max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-semibold text-white">AI Voice Interview</h2>
            
            <div className="flex flex-col items-center space-y-2">
                <p className="text-gray-300">Status: <span className="font-semibold">{status}</span></p>
                {errorMessage && (
                    <div className="max-w-md p-4 bg-red-900/30 border border-red-500 rounded-lg">
                        <p className="text-red-300 text-sm">{errorMessage}</p>
                    </div>
                )}
            </div>

            {!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && status === "idle" && (
                <div className="max-w-2xl p-6 bg-yellow-900/20 border border-yellow-500 rounded-lg">
                    <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Setup Required</h3>
                    <p className="text-yellow-200 text-sm mb-3">
                        You need to create an assistant in the Vapi dashboard before you can start interviews.
                    </p>
                    <ol className="text-yellow-200 text-sm space-y-2 list-decimal list-inside">
                        <li>Go to <a href="https://dashboard.vapi.ai" target="_blank" rel="noopener noreferrer" className="underline">dashboard.vapi.ai</a></li>
                        <li>Create a new assistant</li>
                        <li>Copy the assistant ID</li>
                        <li>Add <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_VAPI_ASSISTANT_ID=your-id</code> to .env.local</li>
                        <li>Restart your dev server</li>
                    </ol>
                </div>
            )}

            {messages.length > 0 && (
                <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6 max-h-96 overflow-y-auto shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Conversation</h3>
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <Image
                                        src={message.role === "user" ? "/user-avatar.png" : "/robot.png"}
                                        alt={message.role === "user" ? "Candidate" : "HireFlow Interviewer"}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-300">
                                            {message.role === "user" ? "Candidate" : "HireFlow Interviewer"}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {message.timestamp.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className={`p-3 rounded-lg ${
                                        message.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-700 text-gray-100"
                                    }`}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {status === "idle" || status === "ended" ? (
                <button
                    onClick={startInterview}
                    className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
                >
                    🎙️ Start Interview
                </button>
            ) : status === "in-call" ? (
                <button
                    onClick={endInterview}
                    className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium shadow-md transition"
                >
                    ⏹️ End Interview
                </button>
            ) : status === "starting" ? (
                <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <p className="text-yellow-400">Connecting to Vapi...</p>
                </div>
            ) : status === "error" ? (
                <button
                    onClick={() => {
                        setStatus("idle");
                        setErrorMessage("");
                    }}
                    className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md transition"
                >
                    🔄 Try Again
                </button>
            ) : null}
        </div>
    );
}
