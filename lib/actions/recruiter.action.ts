import { db } from "@/firebase/admin";

// Recruiter action functions
export async function getInterviewsByRecruiterId(recruiterId: string) {
    try {
        const snapshot = await db
            .collection("interviews")
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
        const snapshot = await db
            .collection("feedbacks")
            .where("recruiterId", "==", recruiterId)
            .orderBy("createdAt", "desc")
            .get();

        const feedbacks = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const feedbackData = doc.data();
                
                // Get interview details
                const interviewDoc = await db
                    .collection("interviews")
                    .doc(feedbackData.interviewId)
                    .get();
                
                const interviewData = interviewDoc.data();
                
                // Get candidate details
                const candidateDoc = await db
                    .collection("users")
                    .doc(feedbackData.candidateId)
                    .get();
                
                const candidateData = candidateDoc.data();

                return {
                    id: doc.id,
                    ...feedbackData,
                    interview: {
                        id: interviewDoc.id,
                        role: interviewData?.role,
                        type: interviewData?.type,
                        level: interviewData?.level,
                        techstack: interviewData?.techstack,
                    },
                    candidate: {
                        id: candidateDoc.id,
                        name: candidateData?.name,
                        email: candidateData?.email,
                    },
                };
            })
        );

        // Remove duplicates based on feedback ID
        const uniqueFeedbacks = Array.from(
            new Map(feedbacks.map(f => [f.id, f])).values()
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
            createdAt: new Date().toISOString(),
        };

        const docRef = await db.collection("interviews").add(interviewData);

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
