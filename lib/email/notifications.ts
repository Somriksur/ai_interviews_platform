/**
 * Email Notification Helpers
 * Trigger emails for various interview events
 */

import { sendEmail, getInterviewAssignedEmail, getInterviewCompletedEmail, getFeedbackReadyEmail } from "./send-email";

export async function notifyInterviewAssigned(
    candidateEmail: string,
    candidateName: string,
    role: string,
    questionsCount: number,
    interviewId: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const interviewLink = `${baseUrl}/candidate/interview/${interviewId}`;

    const html = getInterviewAssignedEmail(candidateName, role, questionsCount, interviewLink);

    return await sendEmail({
        to: candidateEmail,
        subject: `New Interview: ${role} Position`,
        html,
    });
}

export async function notifyInterviewCompleted(
    recruiterEmail: string,
    recruiterName: string,
    candidateName: string,
    role: string,
    score: number,
    interviewId: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const feedbackLink = `${baseUrl}/recruiter/feedback/${interviewId}`;

    const html = getInterviewCompletedEmail(recruiterName, candidateName, role, score, feedbackLink);

    return await sendEmail({
        to: recruiterEmail,
        subject: `Interview Completed: ${candidateName} - ${role}`,
        html,
    });
}

export async function notifyFeedbackReady(
    candidateEmail: string,
    candidateName: string,
    role: string,
    score: number,
    interviewId: string
) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const feedbackLink = `${baseUrl}/candidate/feedback/${interviewId}`;

    const html = getFeedbackReadyEmail(candidateName, role, score, feedbackLink);

    return await sendEmail({
        to: candidateEmail,
        subject: `Your Interview Feedback is Ready - ${role}`,
        html,
    });
}
