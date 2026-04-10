import { db } from "@/firebase/admin";

// Recruiter action functions
export async function getInterviewsByRecruiterId(recruiterId: string) {
    try {
        const snapshot = await db
            .collection("interview_sessions")
            .where("recruiterId", "==", recruiterId)
            .orderBy("createdAt", "desc")
            .get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        })) as Interview[];
    } catch (error) {
        console.error("Error fetching interviews:", error);
        return [];
    }
}

export async function getFeedbacksByRecruiterId(recruiterId: string) {
    try {
        const sessionSnapshot = await db
            .collection("interview_sessions")
            .where("recruiterId", "==", recruiterId)
            .orderBy("createdAt", "desc")
            .get();

        const feedbacks = await Promise.all(
            sessionSnapshot.docs.map(async (sessionDoc) => {
                const sessionData = sessionDoc.data();
                if (!sessionData?.evaluationId) return null;

                const reportDoc = await db
                    .collection("evaluation_reports")
                    .doc(sessionData.evaluationId)
                    .get();
                if (!reportDoc.exists) return null;

                const feedbackData = reportDoc.data() || {};

                const studentDoc = sessionData.studentId
                    ? await db.collection("students").doc(sessionData.studentId).get()
                    : null;
                const studentData = studentDoc?.data();

                return {
                    id: reportDoc.id,
                    ...feedbackData,
                    interview: {
                        id: sessionDoc.id,
                        role: sessionData?.role,
                        type: sessionData?.type,
                        level: sessionData?.level,
                        techstack: sessionData?.techstack,
                    },
                    candidate: {
                        id: studentDoc?.id || sessionData?.studentId,
                        name: studentData?.name,
                        email: studentData?.email,
                    },
                };
            })
        );

        // Remove duplicates based on feedback ID
        const uniqueFeedbacks = Array.from(
            new Map(feedbacks.filter(Boolean).map((f: any) => [f.id, f])).values()
        );

        return uniqueFeedbacks;
    } catch (error) {
        console.error("Error fetching feedbacks:", error);
        return [];
    }
}

export async function createInterview(data: {
    recruiterId: string;
    role: string;
    level: string;
    type: string;
    techstack: string[];
    questions: string[];
    candidateEmail?: string;
}): Promise<{ success: boolean; interviewId?: string; error?: string }> {
    try {
        const interviewData = {
            ...data,
            status: data.candidateEmail ? "assigned" : "draft",
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await db.collection("interview_sessions").add(interviewData);

        return {
            success: true,
            interviewId: docRef.id,
        };
    } catch (error) {
        console.error("Error creating interview:", error);
        return {
            success: false,
            error: "Failed to create interview",
        };
    }
}
