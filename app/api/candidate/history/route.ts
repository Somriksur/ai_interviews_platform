import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole, requireUserMatch } from "@/lib/security/guards";

const adminDb = db!;

export async function GET(request: NextRequest) {
    try {
        const authResult = await getAuthContext(request);
        if (!authResult.ok) return authResult.response;

        const roleError = requireRole(authResult.context, ["candidate", "student"]);
        if (roleError) return roleError;

        const userId = request.nextUrl.searchParams.get("userId") || authResult.context.user.id;

        const ownershipError = requireUserMatch(authResult.context, userId);
        if (ownershipError) return ownershipError;

        // Resolve student's canonical ID and fetch completed interview sessions.
        const studentSnapshot = await adminDb
            .collection("students")
            .where("userId", "==", userId)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? userId : studentSnapshot.docs[0].id;

        const sessionsSnapshot = await adminDb
            .collection("interview_sessions")
            .where("studentId", "==", studentId)
            .where("status", "==", "completed")
            .orderBy("completedAt", "desc")
            .get();

        const history = await Promise.all(sessionsSnapshot.docs.map(async (doc) => {
            const data = doc.data() || {};
            let score = 0;
            if (data.evaluationId) {
                const reportDoc = await adminDb.collection("evaluation_reports").doc(data.evaluationId).get();
                const reportData = reportDoc.data() || {};
                score = Number(reportData.overallScore ?? reportData.scores?.overall ?? 0);
            }
            return {
                id: doc.id,
                role: data.role || "Interview",
                score,
                completedAt: data.completedAt?.toDate() || new Date(),
                status: data.status,
                level: data.level,
                type: data.type,
            };
        }));

        return NextResponse.json({ history });
    } catch (error) {
        console.error("Error fetching interview history:", error);
        return NextResponse.json(
            { error: "Failed to fetch history" },
            { status: 500 }
        );
    }
}
