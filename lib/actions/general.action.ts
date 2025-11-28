"use server";

import { db } from "@/firebase/admin";

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

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
/*                    (DEPRECATED - Use NLP API instead)                      */
/* -------------------------------------------------------------------------- */

// This function is no longer used. Feedback is now generated via Pure NLP API
// at /api/nlp/generate-feedback which provides faster, cost-free analysis.

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
