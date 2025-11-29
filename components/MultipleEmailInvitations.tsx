"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import CSVEmailImporter from "./CSVEmailImporter";

interface MultipleEmailInvitationsProps {
    interviewData: {
        role: string;
        level: string;
        type: string;
        techstack: string[];
        questions: string[];
    };
    onSuccess?: () => void;
}

export default function MultipleEmailInvitations({ 
    interviewData, 
    onSuccess 
}: MultipleEmailInvitationsProps) {
    const [emails, setEmails] = useState("");
    const [loading, setLoading] = useState(false);
    const [sendEmails, setSendEmails] = useState(true);
    const [results, setResults] = useState<{
        success: string[];
        failed: { email: string; error: string }[];
    } | null>(null);

    const parseEmails = (text: string): string[] => {
        return text
            .split(/[,;\n]/)
            .map(e => e.trim())
            .filter(e => e && e.includes("@"));
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleBulkInvite = async () => {
        const emailList = parseEmails(emails);

        if (emailList.length === 0) {
            toast.error("Please enter at least one valid email address");
            return;
        }

        // Validate all emails
        const invalidEmails = emailList.filter(email => !validateEmail(email));
        if (invalidEmails.length > 0) {
            toast.error(`Invalid email(s): ${invalidEmails.join(", ")}`);
            return;
        }

        // Check for duplicates
        const uniqueEmails = [...new Set(emailList)];
        if (uniqueEmails.length !== emailList.length) {
            toast.warning(`Removed ${emailList.length - uniqueEmails.length} duplicate email(s)`);
        }

        setLoading(true);
        const successList: string[] = [];
        const failedList: { email: string; error: string }[] = [];

        // Process each email
        for (const email of uniqueEmails) {
            try {
                const res = await fetch("/api/recruiter/create-interview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...interviewData,
                        candidateEmail: email,
                        sendEmail: sendEmails,
                    }),
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    successList.push(email);
                } else {
                    failedList.push({ 
                        email, 
                        error: data.error || "Unknown error" 
                    });
                }
            } catch (error) {
                failedList.push({ 
                    email, 
                    error: error instanceof Error ? error.message : "Network error" 
                });
            }
        }

        setLoading(false);
        setResults({ success: successList, failed: failedList });

        // Show summary toast
        if (successList.length > 0) {
            toast.success(
                `✅ Successfully created ${successList.length} interview(s)!` +
                (failedList.length > 0 ? ` (${failedList.length} failed)` : "")
            );
        } else {
            toast.error("❌ All invitations failed. Please check the errors below.");
        }

        // Clear input on success
        if (successList.length > 0 && failedList.length === 0) {
            setEmails("");
        }

        // Call success callback
        if (onSuccess && successList.length > 0) {
            onSuccess();
        }
    };

    const emailCount = parseEmails(emails).length;
    const validEmailCount = parseEmails(emails).filter(validateEmail).length;

    return (
        <div className="space-y-4 p-6 border-2 border-primary/20 rounded-lg bg-gradient-to-br from-primary/5 to-purple-500/5">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        📧 Multiple Email Invitations
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Send interview invitations to multiple candidates at once
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium">
                        Candidate Emails
                        <span className="text-gray-400 ml-2">
                            (Separate by comma, semicolon, or new line)
                        </span>
                    </label>
                    <CSVEmailImporter 
                        onImport={(importedEmails) => {
                            const currentEmails = emails.trim();
                            const newEmails = currentEmails 
                                ? currentEmails + "\n" + importedEmails.join("\n")
                                : importedEmails.join("\n");
                            setEmails(newEmails);
                        }}
                    />
                </div>
                <textarea
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="candidate1@example.com, candidate2@example.com&#10;candidate3@example.com&#10;candidate4@example.com&#10;&#10;Or click 'Import File' to upload from CSV, Excel, PDF, or Word"
                    className="w-full h-40 p-4 border-2 rounded-lg bg-background font-mono text-sm focus:border-primary transition-colors"
                    disabled={loading}
                />
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        {emailCount > 0 ? (
                            <>
                                {validEmailCount} valid email{validEmailCount !== 1 ? "s" : ""} detected
                                {emailCount !== validEmailCount && (
                                    <span className="text-yellow-500 ml-2">
                                        ({emailCount - validEmailCount} invalid)
                                    </span>
                                )}
                            </>
                        ) : (
                            "No emails entered"
                        )}
                    </span>
                    <button
                        onClick={() => setEmails("")}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={loading || !emails}
                    >
                        Clear All
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                <input
                    type="checkbox"
                    id="sendEmails"
                    checked={sendEmails}
                    onChange={(e) => setSendEmails(e.target.checked)}
                    className="w-4 h-4"
                    disabled={loading}
                />
                <label htmlFor="sendEmails" className="text-sm cursor-pointer">
                    Send email notifications to candidates
                </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">
                    📋 Interview Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200">
                    <div><strong>Role:</strong> {interviewData.role}</div>
                    <div><strong>Level:</strong> {interviewData.level}</div>
                    <div><strong>Type:</strong> {interviewData.type}</div>
                    <div><strong>Questions:</strong> {interviewData.questions.length}</div>
                    <div className="col-span-2">
                        <strong>Tech Stack:</strong> {interviewData.techstack.join(", ")}
                    </div>
                </div>
            </div>

            <Button
                onClick={handleBulkInvite}
                disabled={loading || validEmailCount === 0}
                className="w-full h-12 text-lg"
                size="lg"
            >
                {loading ? (
                    <>
                        <span className="animate-spin mr-2">⏳</span>
                        Creating {validEmailCount} interview{validEmailCount !== 1 ? "s" : ""}...
                    </>
                ) : (
                    <>
                        🚀 Send {validEmailCount} Invitation{validEmailCount !== 1 ? "s" : ""}
                    </>
                )}
            </Button>

            {/* Results Section */}
            {results && (
                <div className="space-y-3 mt-4 p-4 bg-background rounded-lg border-2">
                    <h4 className="font-semibold">📊 Results</h4>
                    
                    {results.success.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <span className="text-xl">✅</span>
                                <span className="font-semibold">
                                    Successfully Created ({results.success.length})
                                </span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {results.success.map((email, idx) => (
                                    <div 
                                        key={idx} 
                                        className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800"
                                    >
                                        {email}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {results.failed.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                <span className="text-xl">❌</span>
                                <span className="font-semibold">
                                    Failed ({results.failed.length})
                                </span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-1">
                                {results.failed.map((item, idx) => (
                                    <div 
                                        key={idx} 
                                        className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800"
                                    >
                                        <div className="font-medium">{item.email}</div>
                                        <div className="text-xs text-red-600 dark:text-red-400">
                                            {item.error}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={() => setResults(null)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                    >
                        Clear Results
                    </Button>
                </div>
            )}

            {/* Quick Tips */}
            <div className="text-xs text-gray-500 space-y-1 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="font-semibold mb-1">💡 Tips:</div>
                <ul className="list-disc list-inside space-y-1">
                    <li>You can paste emails from Excel/CSV files</li>
                    <li>Duplicate emails will be automatically removed</li>
                    <li>Invalid email formats will be rejected</li>
                    <li>Each candidate will receive a unique interview link</li>
                </ul>
            </div>
        </div>
    );
}
