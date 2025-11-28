"use client";

import dayjs from "dayjs";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import DisplayTechIconsClient from "./DisplayTechIconsClient";
import InterviewInvitation from "./InterviewInvitation";

import { cn, getRandomInterviewCover } from "@/lib/utils";

interface RecruiterInterviewCardProps {
    interviewId: string;
    role: string;
    type: string;
    techstack: string[];
    createdAt: string;
    candidateEmail?: string;
    status: string;
}

const RecruiterInterviewCard = ({
    interviewId,
    role,
    type,
    techstack,
    createdAt,
    candidateEmail,
    status,
}: RecruiterInterviewCardProps) => {
    const [deleting, setDeleting] = useState(false);
    const [showInvitation, setShowInvitation] = useState(false);

    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

    const badgeColor =
        {
            Behavioral: "bg-light-400",
            Mixed: "bg-light-600",
            Technical: "bg-light-800",
        }[normalizedType] || "bg-light-600";

    const formattedDate = dayjs(createdAt || Date.now()).format("MMM D, YYYY");

    const statusColors = {
        assigned: "bg-blue-500",
        "in-progress": "bg-yellow-500",
        completed: "bg-green-500",
        draft: "bg-gray-500",
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("🗑️ Delete clicked for interview:", interviewId);
        
        if (!confirm("Are you sure you want to delete this interview? This action cannot be undone.")) {
            console.log("❌ Delete cancelled by user");
            return;
        }

        setDeleting(true);
        console.log("🔄 Starting delete process...");
        
        try {
            const url = `/api/recruiter/delete-interview/${interviewId}`;
            console.log("📡 Sending DELETE request to:", url);
            
            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("📥 Response status:", res.status);
            const data = await res.json();
            console.log("📥 Response data:", data);

            if (res.ok && data.success) {
                console.log("✅ Interview deleted successfully");
                toast.success("Interview deleted successfully");
                
                // Force a hard refresh to update the page
                window.location.reload();
            } else {
                console.error("❌ Delete failed:", data.error);
                toast.error(data.error || "Failed to delete interview");
                setDeleting(false);
            }
        } catch (error) {
            console.error("❌ Delete error:", error);
            toast.error("Failed to delete interview");
            setDeleting(false);
        }
    };

    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96" style={{ pointerEvents: 'auto' }}>
            <div className="card-interview" style={{ pointerEvents: 'auto' }}>
                <div>
                    {/* Type Badge */}
                    <div
                        className={cn(
                            "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
                            badgeColor
                        )}
                    >
                        <p className="badge-text">{normalizedType}</p>
                    </div>

                    {/* Cover Image */}
                    <Image
                        src={getRandomInterviewCover(interviewId)}
                        alt="cover-image"
                        width={90}
                        height={90}
                        className="rounded-full object-fit size-[90px]"
                    />

                    {/* Interview Role */}
                    <h3 className="mt-5 capitalize">{role} Interview</h3>

                    {/* Date & Status */}
                    <div className="flex flex-row gap-5 mt-3">
                        <div className="flex flex-row gap-2">
                            <Image
                                src="/calendar.svg"
                                width={22}
                                height={22}
                                alt="calendar"
                            />
                            <p>{formattedDate}</p>
                        </div>

                        <div className="flex flex-row gap-2 items-center">
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full",
                                    statusColors[status as keyof typeof statusColors] || "bg-gray-500"
                                )}
                            />
                            <p className="capitalize text-sm">{status}</p>
                        </div>
                    </div>

                    {/* Candidate Email */}
                    <p className="mt-5 text-sm">
                        <span className="text-gray-400">Assigned to:</span>{" "}
                        <span className="font-semibold">{candidateEmail || "Not assigned"}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <DisplayTechIconsClient techStack={techstack} />

                    <button
                        type="button"
                        onClick={() => setShowInvitation(!showInvitation)}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        <Mail className="w-4 h-4" />
                        {showInvitation ? "Hide Invitations" : "Invite Candidates"}
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                    >
                        {deleting ? "Deleting..." : "🗑️ Delete"}
                    </button>
                </div>
            </div>

            {/* Invitation Panel */}
            {showInvitation && (
                <div className="mt-4 p-4 border-t border-gray-700">
                    <InterviewInvitation 
                        interviewId={interviewId}
                        interviewTitle={`${role} Interview`}
                    />
                </div>
            )}
        </div>
    );
};

export default RecruiterInterviewCard;
