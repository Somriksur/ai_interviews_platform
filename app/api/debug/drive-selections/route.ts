import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireRole } from '@/lib/security/guards';

/**
 * GET /api/debug/drive-selections
 * Debug endpoint to check drive selections data
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;
    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;

    const searchParams = request.nextUrl.searchParams;
    const studentEmail = searchParams.get('studentEmail');

    const result: any = {
      timestamp: new Date().toISOString(),
    };

    // Check drive_student_selections
    const selectionsSnapshot = await db
      .collection('drive_student_selections')
      .get();
    
    result.totalSelections = selectionsSnapshot.size;
    result.selections = selectionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    // Check college_notifications
    const notificationsSnapshot = await db
      .collection('college_notifications')
      .where('type', '==', 'drive_student_selection')
      .get();
    
    result.totalNotifications = notificationsSnapshot.size;
    result.notifications = notificationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    // If studentEmail provided, find that student
    if (studentEmail) {
      const studentsSnapshot = await db
        .collection('students')
        .where('email', '==', studentEmail)
        .get();
      
      if (!studentsSnapshot.empty) {
        const studentDoc = studentsSnapshot.docs[0];
        result.student = {
          id: studentDoc.id,
          ...studentDoc.data(),
        };
      } else {
        result.student = null;
        result.studentError = `No student found with email: ${studentEmail}`;
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: String(error) },
      { status: 500 }
    );
  }
}
