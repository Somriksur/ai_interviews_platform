import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Get interview to verify ownership
        const interviewDoc = await db.collection("interviews").doc(id).get();
        if (!interviewDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        const interview = interviewDoc.data();
        if (interview?.recruiterId !== user.id) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this interview" },
                { status: 403 }
            );
        }

        // Delete the interview
        await db.collection("interviews").doc(id).delete();

        // Also delete any associated feedbacks
        const feedbacksSnapshot = await db
            .collection("feedbacks")
            .where("interviewId", "==", id)
            .get();

        const deletePromises = feedbacksSnapshot.docs.map((doc) =>
            db.collection("feedbacks").doc(doc.id).delete()
        );
        await Promise.all(deletePromises);

        console.log("✅ Interview deleted:", id);

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
