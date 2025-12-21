import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

/**
 * GET /api/students/[studentId]/notifications
 * Get all notifications for a student
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const read = searchParams.get('read'); // 'true', 'false', or null for all
    
    // Verify user can access this student's notifications
    if (user.role === 'student') {
      // For students, verify they own this student record
      const studentDoc = await db.collection('students').doc(studentId).get();
      
      console.log(`🔍 DEBUG: Checking student ${studentId} for user ${user.id}`);
      console.log(`📋 DEBUG: Student doc exists: ${studentDoc.exists}`);
      
      if (!studentDoc.exists) {
        console.log(`❌ DEBUG: Student document ${studentId} not found`);
        
        // Try to find the correct student ID for this user
        const userStudentQuery = await db
          .collection('students')
          .where('userId', '==', user.id)
          .get();
        
        console.log(`🔍 DEBUG: Found ${userStudentQuery.size} student records for user ${user.id}`);
        
        if (!userStudentQuery.empty) {
          const correctStudentId = userStudentQuery.docs[0].id;
          console.log(`💡 DEBUG: Correct student ID for user ${user.id} is ${correctStudentId}`);
          
          return NextResponse.json({ 
            error: 'Student ID mismatch', 
            correctStudentId: correctStudentId,
            message: `Use student ID ${correctStudentId} instead of ${studentId}`
          }, { status: 400 });
        }
        
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }
      
      const studentData = studentDoc.data();
      console.log(`👤 DEBUG: Student userId: ${studentData?.userId}, Current user: ${user.id}`);
      
      if (studentData?.userId !== user.id) {
        console.log(`❌ DEBUG: Access denied - Student userId (${studentData?.userId}) doesn't match current user (${user.id})`);
        
        // Special case: If userId is undefined but email matches, try to fix the link
        if (!studentData?.userId && studentData?.email === user.email) {
          console.log(`🔧 DEBUG: Attempting to auto-fix missing userId for student ${studentId}`);
          
          try {
            await studentDoc.ref.update({
              userId: user.id,
              updatedAt: new Date(),
              userLinkAutoFixed: true,
              userLinkAutoFixedAt: new Date()
            });
            
            console.log(`✅ DEBUG: Auto-fixed user link for student ${studentId}`);
            // Continue with the request now that the link is fixed
          } catch (fixError) {
            console.error(`❌ DEBUG: Failed to auto-fix user link:`, fixError);
            
            return NextResponse.json({ 
              error: 'Missing user link - auto-fix failed', 
              message: `Student record exists but is not linked to your account. Please contact support.`,
              fixEndpoint: `/api/students/${studentId}/fix-user-link`
            }, { status: 403 });
          }
        } else {
          // Try to find the correct student ID for this user
          const userStudentQuery = await db
            .collection('students')
            .where('userId', '==', user.id)
            .get();
          
          if (!userStudentQuery.empty) {
            const correctStudentId = userStudentQuery.docs[0].id;
            console.log(`💡 DEBUG: Correct student ID for user ${user.id} is ${correctStudentId}`);
            
            return NextResponse.json({ 
              error: 'Access denied - wrong student ID', 
              correctStudentId: correctStudentId,
              message: `Use student ID ${correctStudentId} instead of ${studentId}`
            }, { status: 403 });
          }
          
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
    }

    console.log('🔍 Fetching notifications for student:', studentId, { page, limit, read });

    // Build query
    let query = db
      .collection('student_notifications')
      .where('studentId', '==', studentId);
    
    // Filter by read status if specified
    if (read === 'true') {
      query = query.where('read', '==', true);
    } else if (read === 'false') {
      query = query.where('read', '==', false);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc');
    
    // Apply pagination
    const offset = (page - 1) * limit;
    if (offset > 0) {
      query = query.offset(offset);
    }
    query = query.limit(limit);

    // Get notifications
    const notificationsSnapshot = await query.get();

    console.log('📊 Found notifications:', notificationsSnapshot.size);

    const notifications = [];
    const driveIds = new Set<string>();
    const orgIds = new Set<string>();

    for (const doc of notificationsSnapshot.docs) {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });

      if (data.driveId) driveIds.add(data.driveId);
      if (data.organizationId) orgIds.add(data.organizationId);
    }

    // Get total count for pagination
    const totalQuery = db
      .collection('student_notifications')
      .where('studentId', '==', studentId);
    
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;

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

    // Calculate summary from all notifications (not just current page)
    const allNotifications = totalSnapshot.docs.map(doc => doc.data());
    const summary = {
      total: allNotifications.length,
      unread: allNotifications.filter((n: any) => !n.read).length,
      selected: allNotifications.filter((n: any) => n.action === 'selected').length,
      rejected: allNotifications.filter((n: any) => n.action === 'rejected').length,
    };

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    console.log('✅ Returning data:', {
      notificationsCount: notifications.length,
      drivesCount: drives.length,
      summary,
      pagination: { page, limit, total, totalPages, hasMore }
    });

    return NextResponse.json({
      notifications,
      drives,
      organizations,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore
      }
    });
  } catch (error) {
    console.error('❌ Error fetching student notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/students/[studentId]/notifications
 * Mark notification(s) as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    // Verify user can access this student's notifications
    if (user.role === 'student') {
      // For students, verify they own this student record
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists || studentDoc.data()?.userId !== user.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (markAllRead) {
      // Mark all notifications as read
      const notificationsSnapshot = await db
        .collection('student_notifications')
        .where('studentId', '==', studentId)
        .where('read', '==', false)
        .get();

      const batch = db.batch();
      notificationsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true, status: 'read' });
      });

      await batch.commit();

      console.log(`✅ Marked ${notificationsSnapshot.size} notifications as read for student ${studentId}`);

      return NextResponse.json({
        success: true,
        count: notificationsSnapshot.size,
        message: 'All notifications marked as read',
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const notificationDoc = await db
        .collection('student_notifications')
        .doc(notificationId)
        .get();

      if (!notificationDoc.exists) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      const notificationData = notificationDoc.data();
      if (notificationData?.studentId !== studentId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }

      await notificationDoc.ref.update({
        read: true,
        status: 'read',
      });

      console.log(`✅ Marked notification ${notificationId} as read`);

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      return NextResponse.json(
        { error: 'Either notificationId or markAllRead must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
