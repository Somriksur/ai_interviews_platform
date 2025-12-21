import { NextRequest, NextResponse } from "next/server";
import { db as db } from "@/firebase/admin";
import { getCurrentUser } from "@/lib/actions/auth.action";

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
      return NextResponse.json(
        { error: "College not found" },
        { status: 404 }
      );
    }

    const collegeData = collegeDoc.data();

    // Get stats
    const studentsSnapshot = await db
      .collection("students")
      .where("collegeId", "==", collegeId)
      .get();

    const interviewsSnapshot = await db
      .collection("interview_sessions")
      .where("studentId", "in", studentsSnapshot.docs.map(doc => doc.id))
      .where("status", "==", "completed")
      .get();

    let totalScore = 0;
    let scoredInterviews = 0;

    interviewsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.score && data.score > 0) {
        totalScore += data.score;
        scoredInterviews++;
      }
    });

    const averagePlacementScore = scoredInterviews > 0 ? totalScore / scoredInterviews : 0;

    return NextResponse.json({
      id: collegeDoc.id,
      ...collegeData,
      stats: {
        totalStudents: studentsSnapshot.size,
        interviewsCompleted: interviewsSnapshot.size,
        averagePlacementScore,
      },
    });
  } catch (error) {
    console.error("Error fetching college:", error);
    return NextResponse.json(
      { error: "Failed to fetch college" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/colleges/[collegeId]
 * Delete a college and all related data
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized - must be organization user' }, { status: 401 });
    }

    const { collegeId } = await params;

    // Get the college
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    
    if (!collegeDoc.exists) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    const collegeData = collegeDoc.data();

    // Verify ownership
    const orgSnapshot = await db
      .collection('organizations')
      .where('adminId', '==', user.id)
      .get();

    if (orgSnapshot.empty) {
      return NextResponse.json({ error: 'Organization not found for this user' }, { status: 404 });
    }

    const userOrgId = orgSnapshot.docs[0].id;

    if (collegeData?.organizationId !== userOrgId) {
      return NextResponse.json({ error: 'Unauthorized - college belongs to different organization' }, { status: 403 });
    }

    // Delete related data
    const batch = db.batch();

    // Delete students
    const studentsSnapshot = await db
      .collection('students')
      .where('collegeId', '==', collegeId)
      .get();

    const studentIds = studentsSnapshot.docs.map(doc => doc.id);

    studentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete student notifications
    if (studentIds.length > 0) {
      const notificationsSnapshot = await db
        .collection('student_notifications')
        .where('studentId', 'in', studentIds)
        .get();

      notificationsSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Delete interview sessions for students
    if (studentIds.length > 0) {
      const sessionsSnapshot = await db
        .collection('interview_sessions')
        .where('studentId', 'in', studentIds)
        .get();

      const evaluationIds: string[] = [];
      sessionsSnapshot.docs.forEach((doc) => {
        const sessionData = doc.data();
        if (sessionData.evaluationId) {
          evaluationIds.push(sessionData.evaluationId);
        }
        batch.delete(doc.ref);
      });

      // Delete evaluation reports
      for (const evaluationId of evaluationIds) {
        const reportRef = db.collection('evaluation_reports').doc(evaluationId);
        batch.delete(reportRef);
      }
    }

    // Delete job notifications
    const jobNotificationsSnapshot = await db
      .collection('jobNotifications')
      .where('collegeId', '==', collegeId)
      .get();

    jobNotificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete drive notifications
    const driveNotificationsSnapshot = await db
      .collection('driveNotifications')
      .where('collegeId', '==', collegeId)
      .get();

    driveNotificationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete college messages
    const messagesSnapshot = await db
      .collection('college_messages')
      .where('collegeId', '==', collegeId)
      .get();

    messagesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete registration requests
    const requestsSnapshot = await db
      .collection('registration_requests')
      .where('normalizedCollegeName', '==', collegeData?.normalizedName || '')
      .get();

    requestsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the college itself
    batch.delete(collegeDoc.ref);

    // Execute all deletes
    await batch.commit();

    console.log(`✅ Deleted college ${collegeId} and all related data`, {
      collegeId,
      studentsDeleted: studentsSnapshot.size,
      jobNotificationsDeleted: jobNotificationsSnapshot.size,
      driveNotificationsDeleted: driveNotificationsSnapshot.size,
      messagesDeleted: messagesSnapshot.size,
      requestsDeleted: requestsSnapshot.size,
    });

    return NextResponse.json({
      success: true,
      message: 'College deleted successfully',
      deleted: {
        students: studentsSnapshot.size,
        jobNotifications: jobNotificationsSnapshot.size,
        driveNotifications: driveNotificationsSnapshot.size,
        messages: messagesSnapshot.size,
        registrationRequests: requestsSnapshot.size,
      }
    });
  } catch (error) {
    console.error('❌ Error deleting college:', error);
    return NextResponse.json(
      { error: 'Failed to delete college' },
      { status: 500 }
    );
  }
}