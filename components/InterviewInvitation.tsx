"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Mail, X } from "lucide-react";

interface InterviewInvitationProps {
    interviewId: string;
    interviewTitle?: string;
}

export default function InterviewInvitation({ interviewId, interviewTitle }: InterviewInvitationProps) {
    const [emails, setEmails] = useState<string[]>([]);
    const [emailInput, setEmailInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [message, setMessage] = useState("");
    const [showLinkCopied, setShowLinkCopied] = useState(false);

    const interviewLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/candidate/interview/${interviewId}`;

    const addEmail = () => {
        const trimmedEmail = emailInput.trim();
        if (trimmedEmail && isValidEmail(trimmedEmail) && !emails.includes(trimmedEmail)) {
            setEmails([...emails, trimmedEmail]);
            setEmailInput("");
        }
    };

    const removeEmail = (emailToRemove: string) => {
        setEmails(emails.filter(email => email !== emailToRemove));
    };

    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEmail();
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(interviewLink);
            setShowLinkCopied(true);
            setTimeout(() => setShowLinkCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy link:", err);
        }
    };

    const sendInvitations = async () => {
        if (emails.length === 0) {
            setMessage("Please add at least one email address");
            return;
        }

        setIsSending(true);
        setMessage("");

        try {
            const response = await fetch("/api/recruiter/send-invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    interviewId,
                    emails,
                    interviewLink,
                    interviewTitle
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(`✅ Invitations sent successfully to ${emails.length} candidate(s)!`);
                setEmails([]);
            } else {
                setMessage(`❌ Error: ${data.error || "Failed to send invitations"}`);
            }
        } catch (error) {
            console.error("Error sending invitations:", error);
            setMessage("❌ Failed to send invitations. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h3 className="text-xl font-semibold text-white">Invite Candidates</h3>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Interview Link</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={interviewLink}
                        readOnly
                        className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg border border-gray-600 focus:outline-none"
                    />
                    <Button
                        onClick={copyLink}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        {showLinkCopied ? "Copied!" : "Copy"}
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Add Candidate Emails</label>
                <div className="flex gap-2">
                    <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="candidate@example.com"
                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                    />
                    <Button
                        onClick={addEmail}
                        disabled={!emailInput.trim() || !isValidEmail(emailInput.trim())}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                    >
                        Add
                    </Button>
                </div>
            </div>

            {emails.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                        Tagged Candidates ({emails.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {emails.map((email) => (
                            <div
                                key={email}
                                className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                            >
                                <span>{email}</span>
                                <button
                                    onClick={() => removeEmail(email)}
                                    className="hover:bg-blue-700 rounded-full p-1"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button
                onClick={sendInvitations}
                disabled={emails.length === 0 || isSending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
                <Mail className="w-4 h-4 mr-2" />
                {isSending ? "Sending..." : `Send Invitations to ${emails.length} Candidate(s)`}
            </Button>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.includes("✅") 
                        ? "bg-green-900/30 border border-green-500 text-green-300"
                        : "bg-red-900/30 border border-red-500 text-red-300"
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
}
