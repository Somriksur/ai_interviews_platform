"use server";

import { db } from "@/firebase/admin";

export async function getAvailableInterviews(candidateEmail: string) {
    try {
        const studentSnapshot = await db
            .collection("students")
            .where("email", "==", candidateEmail.toLowerCase())
            .limit(1)
            .get();
        if (studentSnapshot.empty) return [];

        const studentId = studentSnapshot.docs[0].id;
        const sessionsSnapshot = await db
            .collection("interview_sessions")
            .where("studentId", "==", studentId)
            .where("status", "in", ["assigned", "pending"])
            .limit(50)
            .get();

        const sessions = await Promise.all(sessionsSnapshot.docs.map(async (doc) => {
            const data = doc.data() as any;
            const driveDoc = data.driveId
                ? await db.collection("interview_drives").doc(data.driveId).get()
                : null;
            const driveData = driveDoc?.data() as any;
            return {
                id: doc.id,
                role: driveData?.role || data.role || "Interview",
                level: data.level || "mid-level",
                type: data.type || "technical",
                techstack: data.techstack || [],
                createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                organizationId: data.organizationId || driveData?.organizationId || "",
                status: data.status || "assigned",
            } as Interview;
        }));

        return sessions.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error("Error fetching available interviews:", error);
        return [];
    }
}

export async function getCandidateInterviews(candidateId: string) {
    try {
        const studentSnapshot = await db
            .collection("students")
            .where("userId", "==", candidateId)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? candidateId : studentSnapshot.docs[0].id;

        const sessionsSnapshot = await db
            .collection("interview_sessions")
            .where("studentId", "==", studentId)
            .get();

        const interviews = await Promise.all(
            sessionsSnapshot.docs.map(async (doc) => {
                const data = doc.data() as any;
                const driveDoc = data.driveId
                    ? await db.collection("interview_drives").doc(data.driveId).get()
                    : null;
                const driveData = driveDoc?.data() as any;

                let totalScore: number | undefined = undefined;
                let feedbackId: string | undefined = undefined;
                if (data.evaluationId) {
                    const reportDoc = await db.collection("evaluation_reports").doc(data.evaluationId).get();
                    const reportData = reportDoc.data() as any;
                    totalScore = Number(reportData?.overallScore ?? reportData?.scores?.overall ?? 0);
                    feedbackId = data.evaluationId;
                }

                return {
                    id: doc.id,
                    role: driveData?.role || data.role || "Interview",
                    level: data.level || "mid-level",
                    type: data.type || "technical",
                    techstack: data.techstack || [],
                    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                    organizationId: data.organizationId || driveData?.organizationId || "",
                    status: data.status || "assigned",
                    feedbackId,
                    totalScore,
                } as Interview & { feedbackId?: string; totalScore?: number };
            })
        );

        return interviews.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    } catch (error) {
        console.error("Error fetching candidate interviews:", error);
        return [];
    }
}

export async function startInterview(interviewId: string, candidateId: string, candidateEmail: string) {
    try {
        const studentSnapshot = await db
            .collection("students")
            .where("userId", "==", candidateId)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? candidateId : studentSnapshot.docs[0].id;

        const sessionDoc = await db.collection("interview_sessions").doc(interviewId).get();
        if (!sessionDoc.exists) {
            return {
                success: false,
                error: "Interview session not found",
            };
        }

        const session = sessionDoc.data() as any;

        // Check if interview is assigned to this candidate
        if (session.studentId !== studentId) {
            return {
                success: false,
                error: "This interview is not assigned to you",
            };
        }

        // Check if candidate already took this interview
        if (session.evaluationId || session.status === "completed") {
            return {
                success: false,
                error: "You have already taken this interview",
            };
        }

        // Update interview status to in-progress
        await db.collection("interview_sessions").doc(interviewId).update({
            status: "in-progress",
            updatedAt: new Date(),
            startedAt: session.startedAt || new Date(),
        });

        const driveDoc = session.driveId
            ? await db.collection("interview_drives").doc(session.driveId).get()
            : null;
        const driveData = driveDoc?.data() as any;

        return {
            success: true,
            interview: {
                id: sessionDoc.id,
                role: driveData?.role || session.role || "Interview",
                level: session.level || "mid-level",
                type: session.type || "technical",
                techstack: session.techstack || [],
                questions: session.questions || driveData?.questions || [],
                createdAt: session.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
                organizationId: session.organizationId || driveData?.organizationId || "",
                status: "in-progress",
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
