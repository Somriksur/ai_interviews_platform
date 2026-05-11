import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

const adminDb = db!;

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== "candidate" && user.role !== "student")) {
            return NextResponse.json(
                { success: false, error: "Unauthorized - must be a student or candidate" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const studentSnapshot = await adminDb
            .collection("students")
            .where("userId", "==", user.id)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? user.id : studentSnapshot.docs[0].id;

        const sessionDoc = await adminDb.collection("interview_sessions").doc(id).get();
        if (!sessionDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview session not found" },
                { status: 404 }
            );
        }

        const sessionData = sessionDoc.data();
        if (sessionData?.studentId !== studentId) {
            return NextResponse.json(
                { success: false, error: "This interview is not assigned to you" },
                { status: 403 }
            );
        }

        if (sessionData?.status === "completed") {
            return NextResponse.json(
                { success: false, error: "You have already completed this interview" },
                { status: 400 }
            );
        }

        await adminDb.collection("interview_sessions").doc(id).update({
            status: "in-progress",
            startedAt: sessionData?.startedAt || new Date(),
            updatedAt: new Date(),
        });

        const driveDoc = await adminDb.collection("interview_drives").doc(sessionData?.driveId).get();
        const driveData = driveDoc.data() || {};

        return NextResponse.json({
            success: true,
            interview: {
                id,
                role: driveData.role || sessionData?.role || "Interview",
                type: sessionData?.type || "technical",
                level: sessionData?.level || "mid-level",
                techstack: sessionData?.techstack || [],
                questions: sessionData?.questions || driveData.questions || [],
                createdAt: sessionData?.createdAt || new Date(),
                status: "in-progress",
                driveId: sessionData?.driveId,
            },
        });
    } catch (error) {
        console.error("Error fetching interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch interview" },
            { status: 500 }
        );
    }
}
