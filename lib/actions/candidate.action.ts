"use server";

import { db } from "@/firebase/admin";

export async function getAvailableInterviews(candidateEmail: string) {
    try {
        // Get interviews assigned to this candidate's email
        const snapshot = await db
            .collection("interviews")
            .where("candidateEmail", "==", candidateEmail)
            .limit(50)
            .get();

        const interviews = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Interview[];

        // Filter to only show "assigned" or "in-progress" status (not completed)
        const availableInterviews = interviews.filter(i => 
            i.status === "assigned" || i.status === "in-progress"
        );

        return availableInterviews.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error("Error fetching available interviews:", error);
        return [];
    }
}

export async function getCandidateInterviews(candidateId: string) {
    try {
        // Simplified query without orderBy to avoid index requirement
        const snapshot = await db
            .collection("feedbacks")
            .where("candidateId", "==", candidateId)
            .get();

        const feedbacks = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Feedback[];

        // Sort in memory
        feedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Get interview details for each feedback
        const interviews = await Promise.all(
            feedbacks.map(async (feedback) => {
                const interviewDoc = await db
                    .collection("interviews")
                    .doc(feedback.interviewId)
                    .get();

                return {
                    id: interviewDoc.id,
                    ...interviewDoc.data(),
                    feedbackId: feedback.id,
                    totalScore: feedback.totalScore,
                } as Interview & { feedbackId: string; totalScore: number };
            })
        );

        // Remove duplicates based on feedback ID
        const uniqueInterviews = Array.from(
            new Map(interviews.map(i => [i.feedbackId, i])).values()
        );

        return uniqueInterviews;
    } catch (error) {
        console.error("Error fetching candidate interviews:", error);
        return [];
    }
}

export async function startInterview(interviewId: string, candidateId: string, candidateEmail: string) {
    try {
        // Get interview details
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        if (!interviewDoc.exists) {
            return {
                success: false,
                error: "Interview not found",
            };
        }

        const interview = interviewDoc.data() as Interview;

        // Check if interview is assigned to this candidate
        if (interview.candidateEmail !== candidateEmail) {
            return {
                success: false,
                error: "This interview is not assigned to you",
            };
        }

        // Check if candidate already took this interview
        const existingFeedback = await db
            .collection("feedbacks")
            .where("interviewId", "==", interviewId)
            .where("candidateId", "==", candidateId)
            .get();

        if (!existingFeedback.empty) {
            return {
                success: false,
                error: "You have already taken this interview",
            };
        }

        // Update interview status to in-progress
        await db.collection("interviews").doc(interviewId).update({
            status: "in-progress",
            candidateId: candidateId,
        });

        return {
            success: true,
            interview: {
                ...interview,
                id: interviewDoc.id,
            } as Interview,
        };
    } catch (error) {
        console.error("Error starting interview:", error);
        return {
            success: false,
            error: "Failed to start interview",
        };
    }
}
