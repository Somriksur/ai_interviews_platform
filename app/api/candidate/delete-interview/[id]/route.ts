import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

const adminDb = db!;

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Resolve candidate's student identity
        const studentSnapshot = await adminDb
            .collection("students")
            .where("userId", "==", user.id)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? user.id : studentSnapshot.docs[0].id;

        // Get session to verify it's in-progress and belongs to this candidate
        const sessionDoc = await adminDb.collection("interview_sessions").doc(id).get();
        if (!sessionDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview session not found" },
                { status: 404 }
            );
        }

        const session = sessionDoc.data();
        
        // Only allow deletion if session is in-progress and belongs to this candidate
        if (session?.studentId !== studentId) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this interview session" },
                { status: 403 }
            );
        }

        if (session?.status !== "in-progress") {
            return NextResponse.json(
                { success: false, error: "Can only delete in-progress interviews" },
                { status: 400 }
            );
        }

        // Reset session to assigned status and clear transcript
        await adminDb.collection("interview_sessions").doc(id).update({
            status: "assigned",
            transcript: [],
            updatedAt: new Date(),
        });

        console.log("✅ In-progress interview session reset by candidate:", id);

        return NextResponse.json({
            success: true,
            message: "Interview deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete interview" },
            { status: 500 }
        );
    }
}
