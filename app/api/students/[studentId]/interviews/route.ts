import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireStudentAccess } from '@/lib/security/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;
    
    // Fetch interview sessions for this student
    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    const interviews = await Promise.all(
      sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();
        
        // Fetch the interview drive to get role information
        let role = 'Unknown Role';
        if (sessionData.driveId) {
          const driveDoc = await db
            .collection('interview_drives')
            .doc(sessionData.driveId)
            .get();
          
          if (driveDoc.exists) {
            role = driveDoc.data()?.role || 'Unknown Role';
          }
        }

        // Fetch evaluation report if exists
        let score = null;
        if (sessionData.evaluationId) {
          const reportDoc = await db
            .collection('evaluation_reports')
            .doc(sessionData.evaluationId)
            .get();
          
          if (reportDoc.exists) {
            const reportData = reportDoc.data();
            score = reportData?.scores?.overall || null;
          }
        }

        return {
          id: doc.id,
          role,
          status: sessionData.status || 'assigned',
          score,
          completedAt: sessionData.completedAt || null,
          createdAt: sessionData.createdAt || null,
          driveId: sessionData.driveId,
        };
      })
    );

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error('Error fetching student interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students/[studentId]/interviews
 * Clear all interview history for a student
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { studentId } = await params;
    const accessError = await requireStudentAccess(authResult.context, studentId);
    if (accessError) return accessError;
    
    console.log(`🗑️ Clearing interview history for student: ${studentId}`);
    
    // Fetch all interview sessions for this student
    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('studentId', '==', studentId)
      .get();

    if (sessionsSnapshot.empty) {
      return NextResponse.json({ 
        success: true, 
        message: 'No interviews to delete',
        deleted: 0 
      });
    }

    // Delete all sessions and their associated evaluation reports
    const batch = db.batch();
    const evaluationIds: string[] = [];

    sessionsSnapshot.docs.forEach((doc) => {
      const sessionData = doc.data();
      if (sessionData.evaluationId) {
        evaluationIds.push(sessionData.evaluationId);
      }
      batch.delete(doc.ref);
    });

    // Delete associated evaluation reports
    for (const evaluationId of evaluationIds) {
      const reportRef = db.collection('evaluation_reports').doc(evaluationId);
      batch.delete(reportRef);
    }

    await batch.commit();

    console.log(`✅ Deleted ${sessionsSnapshot.size} interview sessions and ${evaluationIds.length} evaluation reports`);

    return NextResponse.json({ 
      success: true,
      deleted: sessionsSnapshot.size,
      evaluationsDeleted: evaluationIds.length,
    });
  } catch (error) {
    console.error('Error deleting student interviews:', error);
    return NextResponse.json(
      { error: 'Failed to delete interviews' },
      { status: 500 }
    );
  }
}
