"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

interface CreateFeedbackParams {
    interviewId: string;
    userId: string;
    transcript: { role: string; content: string }[];
    feedbackId?: string;
}

interface GetFeedbackByInterviewIdParams {
    interviewId: string;
    userId: string;
}

interface GetLatestInterviewsParams {
    userId: string;
    limit?: number;
}

interface Interview {
    id: string;
    userId: string;
    createdAt: string;
    finalized: boolean;
    [key: string]: unknown;
}

interface Feedback {
    id?: string;
    interviewId: string;
    userId: string;
    totalScore: number;
    categoryScores: Record<string, number>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                           CREATE FEEDBACK FUNCTION                         */
/* -------------------------------------------------------------------------- */

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map((s) => `- ${s.role}: ${s.content}\n`)
            .join("");

        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001"),
            schema: feedbackSchema,
            system:
                "You are a professional interviewer analyzing a mock interview. Evaluate the candidate objectively and provide numerical scores per category.",
            prompt: `
Transcript:
${formattedTranscript}

Score the candidate (0–100) in:
- Communication Skills
- Technical Knowledge
- Problem Solving
- Cultural & Role Fit
- Confidence & Clarity
      `,
        });

        // Convert categoryScores array → Record<string, number>
        const categoryScoresArray = Array.isArray(object.categoryScores)
            ? object.categoryScores
            : [];

        const categoryScores: Record<string, number> = {};
        for (const item of categoryScoresArray) {
            if (item?.name && typeof item.score === "number") {
                categoryScores[item.name] = item.score;
            }
        }

        const feedback: Feedback = {
            interviewId,
            userId,
            totalScore: object.totalScore,
            categoryScores,
            strengths: object.strengths,
            areasForImprovement: object.areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: new Date().toISOString(),
        };

        const feedbackRef = feedbackId
            ? db.collection("feedback").doc(feedbackId)
            : db.collection("feedback").doc();

        await feedbackRef.set(feedback);

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);

        // Dev fallback (offline / Firestore unreachable)
        if (process.env.NODE_ENV !== "production") {
            return {
                success: true,
                feedbackId: "offline-feedback",
                feedback: {
                    interviewId,
                    userId,
                    totalScore: 85,
                    categoryScores: {
                        "Communication Skills": 90,
                        "Technical Knowledge": 80,
                        "Problem Solving": 88,
                        "Cultural & Role Fit": 84,
                        "Confidence & Clarity": 86,
                    },
                    strengths: ["Good articulation", "Strong fundamentals"],
                    areasForImprovement: ["Be more concise in long answers"],
                    finalAssessment: "Strong junior candidate with solid technical understanding.",
                    createdAt: new Date().toISOString(),
                },
            };
        }

        return { success: false, message: String(error) };
    }
}

/* -------------------------------------------------------------------------- */
/*                          FETCH INTERVIEW BY ID                             */
/* -------------------------------------------------------------------------- */

export async function getInterviewById(id: string): Promise<Interview | null> {
    try {
        const interview = await db.collection("interviews").doc(id).get();
        return interview.exists ? ({ id: interview.id, ...interview.data() } as Interview) : null;
    } catch (error) {
        console.warn("Firestore unavailable while fetching interview:", error);

        if (process.env.NODE_ENV !== "production") {
            return {
                id,
                userId: "local_dev_user",
                createdAt: new Date().toISOString(),
                finalized: true,
                role: "Frontend Developer",
                techstack: ["React", "TypeScript"],
            } as Interview;
        }

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/*                        FETCH FEEDBACK BY INTERVIEW ID                      */
/* -------------------------------------------------------------------------- */

export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    try {
        const querySnapshot = await db
            .collection("feedback")
            .where("interviewId", "==", interviewId)
            .where("userId", "==", userId)
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;

        const feedbackDoc = querySnapshot.docs[0];
        return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
    } catch (error) {
        console.warn("Firestore unavailable while fetching feedback:", error);

        if (process.env.NODE_ENV !== "production") {
            return {
                id: "local-feedback",
                interviewId,
                userId,
                totalScore: 88,
                categoryScores: {
                    "Communication Skills": 92,
                    "Technical Knowledge": 86,
                    "Problem Solving": 90,
                    "Cultural & Role Fit": 88,
                    "Confidence & Clarity": 91,
                },
                strengths: ["Great communication", "Strong analytical thinking"],
                areasForImprovement: ["Add more real-world examples"],
                finalAssessment: "Excellent performance overall. Confident and clear.",
                createdAt: new Date().toISOString(),
            };
        }

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/*                        FETCH LATEST INTERVIEWS (OTHERS)                    */
/* -------------------------------------------------------------------------- */

export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    try {
        const interviews = await db
            .collection("interviews")
            .where("status", "==", "completed")
            .where("recruiterId", "!=", userId)
            .orderBy("recruiterId", "asc")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (error) {
        console.warn("Firestore unavailable while fetching latest interviews:", error);

        if (process.env.NODE_ENV !== "production") {
            return [
                {
                    id: "mock-1",
                    userId: "mock-user",
                    createdAt: new Date().toISOString(),
                    finalized: true,
                    role: "Backend Developer",
                    techstack: ["Node.js", "Express", "MongoDB"],
                },
            ];
        }

        return null;
    }
}

/* -------------------------------------------------------------------------- */
/*                       FETCH INTERVIEWS BY USER ID                          */
/* -------------------------------------------------------------------------- */

export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
    try {
        const interviews = await db
            .collection("interviews")
            .where("recruiterId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        return interviews.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (error) {
        console.warn("Firestore unavailable while fetching user interviews:", error);

        if (process.env.NODE_ENV !== "production") {
            return [
                {
                    id: "offline-1",
                    userId,
                    createdAt: new Date().toISOString(),
                    finalized: true,
                    role: "Frontend Developer",
                    techstack: ["React", "TypeScript"],
                },
            ];
        }

        return null;
    }
}
