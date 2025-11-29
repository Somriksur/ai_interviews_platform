"use client";

import { useState } from "react";
import { Button } from "./ui/button";

interface FeedbackRequestProps {
    interviewId: string;
    candidateId: string;
    recruiterId: string;
    onSuccess?: () => void;
}

export default function FeedbackRequest({
    interviewId,
    candidateId,
    recruiterId,
    onSuccess,
}: FeedbackRequestProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!question.trim()) return;

        setLoading(true);
        try {
            const response = await fetch("/api/feedback-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId,
                    candidateId,
                    recruiterId,
                    question: question.trim(),
                }),
            });

            if (response.ok) {
                setQuestion("");
                setIsOpen(false);
                onSuccess?.();
                alert("✅ Feedback request sent successfully!");
            } else {
                alert("❌ Failed to send request. Please try again.");
            }
        } catch (error) {
            console.error("Error sending feedback request:", error);
            alert("❌ An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6">
            {!isOpen ? (
                <Button
                    onClick={() => setIsOpen(true)}
                    variant="outline"
                    className="w-full tap-target"
                >
                    💬 Request Additional Feedback
                </Button>
            ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <h3 className="font-semibold mb-3">Request Additional Feedback</h3>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask your recruiter a specific question about your performance..."
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[100px] bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-3">
                        <span className="text-sm text-gray-500">
                            {question.length}/500 characters
                        </span>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setIsOpen(false)}
                                variant="outline"
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!question.trim() || loading}
                            >
                                {loading ? "Sending..." : "Send Request"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
