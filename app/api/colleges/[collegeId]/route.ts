import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

/**
 * GET /api/colleges/[collegeId]
 * Get college details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;

    const collegeDoc = await db.collection("colleges").doc(collegeId).get();

    if (!collegeDoc.exists) {
      return NextResponse.json({ error: "College not found" }, { status: 404 });
    }

    // Calculate dynamic stats
    const studentsSnapshot = await db
      .collection("students")
      .where("collegeId", "==", collegeId)
      .get();
    
    const totalStudents = studentsSnapshot.size;

    // Get completed interviews count
    const interviewsSnapshot = await db
      .collection("interviews")
      .where("collegeId", "==", collegeId)
      .where("status", "==", "completed")
      .get();
    
    const interviewsCompleted = interviewsSnapshot.size;

    // Calculate average placement score from completed interviews
    let averagePlacementScore = 0;
    if (interviewsCompleted > 0) {
      const scores = interviewsSnapshot.docs
        .map(doc => doc.data().overallScore || 0)
        .filter(score => score > 0);
      
      if (scores.length > 0) {
        averagePlacementScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      }
    }

    const collegeData = {
      id: collegeDoc.id,
      ...collegeDoc.data(),
      stats: {
        totalStudents,
        interviewsCompleted,
        averagePlacementScore,
      },
    };

    return NextResponse.json(collegeData);
  } catch (error) {
    console.error("Error fetching college:", error);
    return NextResponse.json(
      { error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}
