import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { db } from "@/firebase/admin";

export async function POST(request: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== "candidate") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { interviewId, transcript } = await request.json();

        // Check if feedback already exists
        const existingFeedback = await db
            .collection("feedbacks")
            .where("interviewId", "==", interviewId)
            .where("candidateId", "==", user.id)
            .get();

        if (!existingFeedback.empty) {
            return NextResponse.json(
                { 
                    success: true, 
                    feedbackId: existingFeedback.docs[0].id,
                    message: "Feedback already submitted"
                },
                { status: 200 }
            );
        }

        // Get interview details
        const interviewDoc = await db.collection("interviews").doc(interviewId).get();
        if (!interviewDoc.exists) {
            return NextResponse.json(
                { success: false, error: "Interview not found" },
                { status: 404 }
            );
        }

        const interview = interviewDoc.data() as Interview;

        console.log("Generating Pure NLP feedback for:", interview.role);

        // Generate feedback using Pure NLP (NO AI APIs!)
        // Import and call the NLP generation logic directly
        const { generateNLPFeedback } = await import('../../nlp/generate-feedback/route');
        
        console.log("Starting NLP feedback generation...");
        const feedback = await generateNLPFeedback(interview, transcript);
        console.log("Pure NLP feedback generated successfully");

        // Save feedback to database
        const feedbackDoc = await db.collection("feedbacks").add({
            interviewId,
            candidateId: user.id,
            recruiterId: interview.recruiterId,
            ...feedback,
            transcript,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({
            success: true,
            feedbackId: feedbackDoc.id,
        });
    } catch (error) {
        console.error("Error submitting interview:", error);
        return NextResponse.json(
            { success: false, error: "Failed to submit interview" },
            { status: 500 }
        );
    }
}
