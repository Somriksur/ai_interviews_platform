/**
 * Helper functions to send notifications
 */

import { NotificationType } from "./types";

export async function sendNotification({
    userId,
    type,
    title,
    message,
    link,
    metadata = {},
}: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    metadata?: Record<string, unknown>;
}) {
    try {
        const response = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId,
                type,
                title,
                message,
                link,
                metadata,
            }),
        });

        if (!response.ok) {
            throw new Error("Failed to send notification");
        }

        return await response.json();
    } catch (error) {
        console.error("Error sending notification:", error);
        return { success: false, error };
    }
}

// Convenience functions for common notifications

export async function notifyInterviewAssignedNotification(
    candidateId: string,
    role: string,
    interviewId: string
) {
    return sendNotification({
        userId: candidateId,
        type: "interview_assigned",
        title: "New Interview Assigned",
        message: `You have been assigned a new interview for ${role}`,
        link: `/candidate/interview/${interviewId}`,
        metadata: { interviewId, role },
    });
}

export async function notifyInterviewCompletedNotification(
    recruiterId: string,
    candidateName: string,
    role: string,
    interviewId: string
) {
    return sendNotification({
        userId: recruiterId,
        type: "interview_completed",
        title: "Interview Completed",
        message: `${candidateName} has completed the ${role} interview`,
        link: `/recruiter/interviews/${interviewId}`,
        metadata: { interviewId, candidateName, role },
    });
}

export async function notifyFeedbackReadyNotification(
    candidateId: string,
    role: string,
    score: number,
    interviewId: string
) {
    return sendNotification({
        userId: candidateId,
        type: "feedback_ready",
        title: "Feedback Ready",
        message: `Your feedback for ${role} interview is ready. Score: ${score}/100`,
        link: `/candidate/feedback/${interviewId}`,
        metadata: { interviewId, role, score },
    });
}

export async function notifyInterviewReminder(
    candidateId: string,
    role: string,
    interviewId: string,
    hoursRemaining: number
) {
    return sendNotification({
        userId: candidateId,
        type: "interview_reminder",
        title: "Interview Reminder",
        message: `Don't forget to complete your ${role} interview. ${hoursRemaining} hours remaining!`,
        link: `/candidate/interview/${interviewId}`,
        metadata: { interviewId, role, hoursRemaining },
    });
}
