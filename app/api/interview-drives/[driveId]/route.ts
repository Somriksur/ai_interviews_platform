import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";

/**
 * GET /api/interview-drives/[driveId]
 * Get interview drive details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const { driveId } = await params;

    const driveDoc = await db.collection("interview_drives").doc(driveId).get();

    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    const driveData = {
      id: driveDoc.id,
      ...driveDoc.data(),
    };

    return NextResponse.json(driveData);
  } catch (error) {
    console.error("Error fetching drive:", error);
    return NextResponse.json(
      { error: "Failed to fetch drive" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/interview-drives/[driveId]
 * Delete an interview drive
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const { driveId } = await params;

    // Check if drive exists
    const driveDoc = await db.collection("interview_drives").doc(driveId).get();

    if (!driveDoc.exists) {
      return NextResponse.json({ error: "Drive not found" }, { status: 404 });
    }

    // Delete the drive
    await db.collection("interview_drives").doc(driveId).delete();

    return NextResponse.json({ 
      success: true, 
      message: "Interview drive deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting drive:", error);
    return NextResponse.json(
      { error: "Failed to delete drive" },
      { status: 500 }
    );
  }
}
