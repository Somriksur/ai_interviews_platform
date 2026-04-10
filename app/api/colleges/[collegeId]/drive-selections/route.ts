import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireCollegeOwnership } from '@/lib/security/guards';

/**
 * GET /api/colleges/[collegeId]/drive-selections
 * Get all interview drive student selections for a college
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { collegeId } = await params;
    const ownershipError = await requireCollegeOwnership(authResult.context, collegeId);
    if (ownershipError) return ownershipError;

    console.log('🔍 Fetching drive selections for college:', collegeId);

    // Get all notifications for this college related to drive selections
    const notificationsSnapshot = await db
      .collection('college_notifications')
      .where('collegeId', '==', collegeId)
      .where('type', '==', 'drive_student_selection')
      .orderBy('createdAt', 'desc')
      .get();

    console.log('📊 Found notifications:', notificationsSnapshot.size);

    const notifications: Array<{
      id: string;
      action?: string;
      status?: string;
      createdAt?: Date | string;
      respondedAt?: Date | string;
      [key: string]: any;
    }> = [];
    const studentIds = new Set<string>();
    const driveIds = new Set<string>();
    const orgIds = new Set<string>();

    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        respondedAt: data.respondedAt?.toDate?.() || data.respondedAt,
      });

      if (data.studentId) studentIds.add(data.studentId);
      if (data.driveId) driveIds.add(data.driveId);
      if (data.organizationId) orgIds.add(data.organizationId);
    }

    // Fetch student details
    const students: any[] = [];
    if (studentIds.size > 0) {
      const studentPromises = Array.from(studentIds).map((id) =>
        db.collection('students').doc(id).get()
      );
      const studentDocs = await Promise.all(studentPromises);
      studentDocs.forEach((doc) => {
        if (doc.exists) {
          students.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Fetch drive details
    const drives: any[] = [];
    if (driveIds.size > 0) {
      const drivePromises = Array.from(driveIds).map((id) =>
        db.collection('interview_drives').doc(id).get()
      );
      const driveDocs = await Promise.all(drivePromises);
      driveDocs.forEach((doc) => {
        if (doc.exists) {
          drives.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Fetch organization details
    const organizations: any[] = [];
    if (orgIds.size > 0) {
      const orgPromises = Array.from(orgIds).map((id) =>
        db.collection('organizations').doc(id).get()
      );
      const orgDocs = await Promise.all(orgPromises);
      orgDocs.forEach((doc) => {
        if (doc.exists) {
          organizations.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // Calculate summary
    const summary = {
      total: notifications.length,
      selected: notifications.filter((n) => n.action === 'selected').length,
      rejected: notifications.filter((n) => n.action === 'rejected').length,
      pending: notifications.filter((n) => n.status === 'pending').length,
      acknowledged: notifications.filter((n) => n.status === 'acknowledged').length,
      retagRequested: notifications.filter((n) => n.status === 'retag_requested').length,
    };

    console.log('✅ Returning data:', {
      notificationsCount: notifications.length,
      studentsCount: students.length,
      drivesCount: drives.length,
      summary,
    });

    return NextResponse.json({
      notifications,
      students,
      drives,
      organizations,
      summary,
    });
  } catch (error) {
    console.error('❌ Error fetching drive selections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drive selections' },
      { status: 500 }
    );
  }
}
