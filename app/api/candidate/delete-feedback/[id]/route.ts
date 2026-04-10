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

        // Get evaluation report to verify ownership
        const reportDoc = await adminDb.collection("evaluation_reports").doc(id).get();
        if (!reportDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Evaluation report not found" },
                { status: 404 }
            );
        }

        const report = reportDoc.data();
        const studentSnapshot = await adminDb
            .collection("students")
            .where("userId", "==", user.id)
            .limit(1)
            .get();
        const studentId = studentSnapshot.empty ? user.id : studentSnapshot.docs[0].id;

        if (report?.studentId !== studentId) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this report" },
                { status: 403 }
            );
        }

        // Delete evaluation report and clear reference on session
        await adminDb.collection("evaluation_reports").doc(id).delete();
        if (report?.sessionId) {
            await adminDb.collection("interview_sessions").doc(report.sessionId).update({
                evaluationId: null,
                evaluationTriggered: false,
                updatedAt: new Date(),
            });
        }

        console.log("✅ Evaluation report deleted by candidate:", id);

        return NextResponse.json({
            success: true,
            message: "Report deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting feedback:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete feedback" },
            { status: 500 }
        );
    }
}
