import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';

// GET /api/students/[studentId]/dashboard
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    console.log('📊 Fetching dashboard data for student:', studentId);

    // Get student details
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const studentData = { id: studentDoc.id, ...studentDoc.data() } as any;
    const collegeId = studentData.collegeId;

    // Get assigned interview drives
    const drivesSnapshot = await db
      .collection('interview_drives')
      .where('colleges', 'array-contains', collegeId)
      .get();

    const assignedDrives = drivesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    // Get student's interview sessions (check both collections)
    const interviewSessionsSnapshot = await db
      .collection('interview_sessions')
      .where('studentId', '==', studentId)
      .get();

    const interviewSessions = interviewSessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Also check old interviews collection
    const interviewsSnapshot = await db
      .collection('interviews')
      .where('studentId', '==', studentId)
      .get();

    const interviews = interviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Combine both
    const allInterviews = [...interviewSessions, ...interviews];

    // Calculate statistics
    const totalInterviews = allInterviews.length;
    const completedInterviews = allInterviews.filter((i: any) => i.status === 'completed');
    const pendingInterviews = allInterviews.filter((i: any) => i.status === 'pending' || i.status === 'in_progress' || i.status === 'not_started');
    
    // Calculate average score from completed interviews
    const scoresFromCompleted = completedInterviews
      .map((i: any) => i.overallScore || i.score)
      .filter(score => typeof score === 'number' && score > 0);
    
    const averageScore = scoresFromCompleted.length > 0 
      ? scoresFromCompleted.reduce((sum, score) => sum + score, 0) / scoresFromCompleted.length
      : 0;

    const statistics = {
      totalInterviews,
      pendingInterviews: pendingInterviews.length,
      completedInterviews: completedInterviews.length,
      averageScore: Math.round(averageScore * 100) / 100,
    };

    // Get recent notifications (last 10)
    const notificationsSnapshot = await db
      .collection('student_notifications')
      .where('studentId', '==', studentId)
      .limit(10)
      .get();

    const recentNotifications = notificationsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    // Count unread notifications
    const unreadCount = recentNotifications.filter((n: any) => !n.read).length;

    // Get selection status for each drive
    // Check which drives have completed interviews
    const completedDriveIds = new Set(
      completedInterviews
        .map((i: any) => i.driveId)
        .filter(Boolean) // Remove null/undefined
    );

    console.log('Completed drive IDs:', Array.from(completedDriveIds));
    console.log('All interviews:', allInterviews.map(i => ({ id: i.id, driveId: i.driveId, status: i.status })));

    // Get selection notifications to determine status
    const selectionNotifications = recentNotifications.filter(
      (n: any) => (n.type === 'selection' || n.type === 'rejection') && n.driveId
    );

    const selectionStatus = assignedDrives.map((drive: any) => {
      const selectionNotification: any = selectionNotifications.find(
        (n: any) => n.driveId === drive.id
      );
      
      let status = 'pending';
      if (selectionNotification) {
        status = selectionNotification.type === 'selection' ? 'selected' : 'rejected';
      } else if (completedDriveIds.has(drive.id)) {
        status = 'completed';
      }

      return {
        driveId: drive.id,
        driveName: drive.name || 'Interview Drive',
        organizationName: drive.organizationName || 'Organization',
        status,
        notes: selectionNotification?.collegeNotes || null,
        date: selectionNotification?.createdAt || drive.createdAt,
      };
    });

    // Get college information
    let collegeName = 'Your College';
    if (collegeId) {
      const collegeDoc = await db.collection('colleges').doc(collegeId).get();
      if (collegeDoc.exists) {
        collegeName = collegeDoc.data()?.name || 'Your College';
      }
    }

    // Helper function to serialize Firestore timestamps
    const serializeTimestamp = (timestamp: any) => {
      if (!timestamp) return null;
      if (timestamp.toDate) {
        return timestamp.toDate().toISOString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toISOString();
      }
      return timestamp;
    };

    // Serialize all timestamps in the data
    const serializedNotifications = recentNotifications.map((n: any) => ({
      ...n,
      createdAt: serializeTimestamp(n.createdAt),
      readAt: serializeTimestamp(n.readAt),
    }));

    const serializedDrives = assignedDrives.map((d: any) => ({
      ...d,
      createdAt: serializeTimestamp(d.createdAt),
      updatedAt: serializeTimestamp(d.updatedAt),
    }));

    const serializedSelectionStatus = selectionStatus.map((s: any) => ({
      ...s,
      date: serializeTimestamp(s.date),
    }));

    const dashboardData = {
      student: {
        ...studentData,
        collegeName,
      },
      statistics,
      recentNotifications: serializedNotifications,
      unreadCount,
      assignedDrives: serializedDrives,
      selectionStatus: serializedSelectionStatus,
      summary: {
        totalDrives: assignedDrives.length,
        completedDrives: completedDriveIds.size,
        pendingDrives: assignedDrives.length - completedDriveIds.size,
        selectedCount: selectionStatus.filter(s => s.status === 'selected').length,
        rejectedCount: selectionStatus.filter(s => s.status === 'rejected').length,
      },
    };

    console.log(`✅ Dashboard data prepared for ${studentData.name}:`, {
      drives: assignedDrives.length,
      interviews: totalInterviews,
      notifications: recentNotifications.length,
      unread: unreadCount,
      completedDriveIds: Array.from(completedDriveIds),
    });

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('❌ Error fetching student dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}
