"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface BulkInterviewCreatorProps {
    interviewData: {
        role: string;
        level: string;
        type: string;
        techstack: string[];
        questions: string[];
    };
}

export default function BulkInterviewCreator({ interviewData }: BulkInterviewCreatorProps) {
    const [emails, setEmails] = useState("");
    const [loading, setLoading] = useState(false);

    const handleBulkCreate = async () => {
        const emailList = emails
            .split(/[,\n]/)
            .map(e => e.trim())
            .filter(e => e && e.includes("@"));

        if (emailList.length === 0) {
            toast.error("Please enter at least one valid email");
            return;
        }

        setLoading(true);
        let successCount = 0;
        let failCount = 0;

        for (const email of emailList) {
            try {
                const res = await fetch("/api/recruiter/create-interview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...interviewData,
                        candidateEmail: email,
                    }),
                });

                if (res.ok) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch {
                failCount++;
            }
        }

        setLoading(false);
        toast.success(`Created ${successCount} interviews! ${failCount > 0 ? `(${failCount} failed)` : ""}`);
        setEmails("");
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold">📦 Bulk Interview Creation</h3>
            <p className="text-sm text-gray-500">
                Enter multiple candidate emails (comma or newline separated)
            </p>
            <textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="candidate1@example.com, candidate2@example.com&#10;candidate3@example.com"
                className="w-full h-32 p-3 border rounded-lg bg-background"
            />
            <Button
                onClick={handleBulkCreate}
                disabled={loading || !emails.trim()}
                className="w-full"
            >
                {loading ? "Creating..." : `Create ${emails.split(/[,\n]/).filter(e => e.trim() && e.includes("@")).length} Interviews`}
            </Button>
        </div>
    );
}
