import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

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

        // Get feedback to verify ownership
        const feedbackDoc = await db.collection("feedbacks").doc(id).get();
        if (!feedbackDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Feedback not found" },
                { status: 404 }
            );
        }

        const feedback = feedbackDoc.data();
        if (feedback?.candidateId !== user.id) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this feedback" },
                { status: 403 }
            );
        }

        // Delete the feedback
        await db.collection("feedbacks").doc(id).delete();

        console.log("✅ Feedback deleted by candidate:", id);

        return NextResponse.json({
            success: true,
            message: "Feedback deleted successfully",
        });
    } catch (error) {
        console.error("❌ Error deleting feedback:", error);
        return NextResponse.json(
            { success: false, error: "Failed to delete feedback" },
            { status: 500 }
        );
    }
}
