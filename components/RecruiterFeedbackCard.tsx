"use client";

import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { cn, getRandomInterviewCover } from "@/lib/utils";

interface RecruiterFeedbackCardProps {
    feedbackId: string;
    candidateName: string;
    candidateEmail: string;
    role: string;
    type: string;
    level: string;
    techstack: string[];
    totalScore: number;
    createdAt: string;
    interviewId: string;
}

const RecruiterFeedbackCard = ({
    feedbackId,
    candidateName,
    candidateEmail,
    role,
    type,
    level,
    techstack,
    totalScore,
    createdAt,
    interviewId,
}: RecruiterFeedbackCardProps) => {
    const [deleting, setDeleting] = useState(false);
    
    const normalizedType = /mix/gi.test(type) ? "Mixed" : type;

    const badgeColor =
        {
            Behavioral: "bg-light-400",
            Mixed: "bg-light-600",
            Technical: "bg-light-800",
        }[normalizedType] || "bg-light-600";

    const formattedDate = dayjs(createdAt || Date.now()).format("MMM D, YYYY");

    const scoreColor =
        totalScore >= 80
            ? "text-green-500"
            : totalScore >= 60
            ? "text-yellow-500"
            : "text-red-500";

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

                    {/* Candidate Info */}
                    <div className="mt-3 space-y-1">
                        <p className="text-sm">
                            <span className="text-gray-400">Candidate:</span>{" "}
                            <span className="font-semibold">{candidateName}</span>
                        </p>
                        <p className="text-xs text-gray-500">{candidateEmail}</p>
                    </div>

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
                            <Image src="/star.svg" width={22} height={22} alt="star" />
                            <p className={scoreColor}>{totalScore}/100</p>
                        </div>
                    </div>

                    {/* Level & Tech Stack Preview */}
                    <p className="mt-5 text-sm">
                        <span className="text-gray-400">Level:</span>{" "}
                        <span className="capitalize">{level}</span>
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-2">
                        {techstack.slice(0, 3).map((tech, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 bg-primary/20 rounded text-xs"
                            >
                                {tech}
                            </span>
                        ))}
                        {techstack.length > 3 && (
                            <span className="px-2 py-1 bg-primary/20 rounded text-xs">
                                +{techstack.length - 3}
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button className="btn-primary flex-1">
                            <Link href={`/recruiter/feedback/${feedbackId}`}>
                                View Detailed Feedback
                            </Link>
                        </Button>

                        <button
                            type="button"
                            onClick={async (e) => {
                                e.preventDefault();
                                
                                if (!confirm(`Are you sure you want to delete ${candidateName}'s feedback? This action cannot be undone.`)) {
                                    return;
                                }

                                setDeleting(true);
                                
                                try {
                                    const res = await fetch(`/api/recruiter/delete-feedback/${feedbackId}`, {
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecruiterFeedbackCard;
