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

        // Get interview to verify it's in-progress and belongs to this candidate
        const interviewDoc = await db.collection("interviews").doc(id).get();
        if (!interviewDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        const interview = interviewDoc.data();
        
        // Only allow deletion if interview is in-progress and assigned to this candidate
        if (interview?.candidateId !== user.id) {
            return NextResponse.json(
                { success: false, error: "Not authorized to delete this interview" },
                { status: 403 }
            );
        }

        if (interview?.status !== "in-progress") {
            return NextResponse.json(
                { success: false, error: "Can only delete in-progress interviews" },
                { status: 400 }
            );
        }

        // Reset interview to assigned status (remove candidateId)
        await db.collection("interviews").doc(id).update({
            status: "assigned",
            candidateId: null,
        });

        console.log("✅ In-progress interview reset by candidate:", id);

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
