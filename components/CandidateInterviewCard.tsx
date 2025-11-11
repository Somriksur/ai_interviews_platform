"use client";

import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "./ui/button";
import DisplayTechIconsClient from "./DisplayTechIconsClient";

import { cn, getRandomInterviewCover } from "@/lib/utils";

interface CandidateInterviewCardProps {
    interviewId: string;
    role: string;
    type: string;
    techstack: string[];
    createdAt: string;
    status: string;
    hasFeedback?: boolean;
    feedbackId?: string;
    totalScore?: number;
}

const CandidateInterviewCard = ({
    interviewId,
    role,
    type,
    techstack,
    createdAt,
    status,
    hasFeedback,
    feedbackId,
    totalScore,
}: CandidateInterviewCardProps) => {
    const [deleting, setDeleting] = useState(false);
    
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
    };

    return (
        <div className="card-border w-[360px] max-sm:w-full min-h-96">
            <div className="card-interview">
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

                    {/* Date & Score */}
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
                            {hasFeedback ? (
                                <>
                                    <Image src="/star.svg" width={22} height={22} alt="star" />
                                    <p>{totalScore || "---"}/100</p>
                                </>
                            ) : (
                                <>
                                    <div
                                        className={cn(
                                            "w-2 h-2 rounded-full",
                                            statusColors[status as keyof typeof statusColors] || "bg-gray-500"
                                        )}
                                    />
                                    <p className="capitalize text-sm">{status}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2 mt-5">
                        {hasFeedback
                            ? "Interview completed! View your feedback and scores."
                            : status === "assigned"
                            ? "New interview assigned to you. Start when ready!"
                            : "Interview in progress..."}
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <DisplayTechIconsClient techStack={techstack} />

                    <div className="flex gap-2 w-full">
                        <Button className="btn-primary flex-1">
                            <Link
                                href={
                                    hasFeedback && feedbackId
                                        ? `/candidate/feedback/${feedbackId}`
                                        : `/candidate/interview/${interviewId}`
                                }
                            >
                                {hasFeedback ? "Check Feedback" : "Start Interview"}
                            </Link>
                        </Button>

                        {hasFeedback && feedbackId && (
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault();
                                    
                                    if (!confirm("Are you sure you want to delete this feedback? This action cannot be undone.")) {
                                        return;
                                    }

                                    setDeleting(true);
                                    
                                    try {
                                        const res = await fetch(`/api/candidate/delete-feedback/${feedbackId}`, {
                                            method: "DELETE",
                                        });

                                        const data = await res.json();

                                        if (res.ok && data.success) {
                                            toast.success("Feedback deleted successfully");
                                            window.location.reload();
                                        } else {
                                            toast.error(data.error || "Failed to delete feedback");
                                            setDeleting(false);
                                        }
                                    } catch (error) {
                                        console.error("Delete error:", error);
                                        toast.error("Failed to delete feedback");
                                        setDeleting(false);
                                    }
                                }}
                                disabled={deleting}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-medium transition-colors"
                            >
                                {deleting ? "..." : "🗑️"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidateInterviewCard;
