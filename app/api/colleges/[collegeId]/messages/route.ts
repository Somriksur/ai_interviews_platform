import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';

// POST /api/colleges/[collegeId]/messages - Create a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId } = await params;
    const body = await request.json();
    const { title, content, priority, targetType, targetStudentIds } = body;

    // Validate required fields
    if (!title || !content || !priority || !targetType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, priority, targetType' },
        { status: 400 }
      );
    }

    // Validate priority
    if (!['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Priority must be low, medium, or high' },
        { status: 400 }
      );
    }

    // Validate target type
    if (!['all', 'specific'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Target type must be all or specific' },
        { status: 400 }
      );
    }

    // If specific targeting, validate student IDs
    if (targetType === 'specific' && (!targetStudentIds || !Array.isArray(targetStudentIds) || targetStudentIds.length === 0)) {
      return NextResponse.json(
        { error: 'Target student IDs required for specific targeting' },
        { status: 400 }
      );
    }

    let finalTargetStudentIds = targetStudentIds || [];

    // If targeting all students, get all student IDs for this college
    if (targetType === 'all') {
      const studentsSnapshot = await db
        .collection('students')
        .where('collegeId', '==', collegeId)
        .get();
      
      finalTargetStudentIds = studentsSnapshot.docs.map(doc => doc.id);
      
      if (finalTargetStudentIds.length === 0) {
        return NextResponse.json(
          { error: 'No students found for this college' },
          { status: 400 }
        );
      }
    }

    // Get college name for notifications
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    const collegeName = collegeDoc.exists ? collegeDoc.data()?.name || 'Your College' : 'Your College';

    // Create the message document
    const messageData = {
      collegeId,
      title,
      content,
      priority,
      targetType,
      targetStudentIds: finalTargetStudentIds,
      createdBy: user.id,
      createdAt: new Date(),
      totalRecipients: finalTargetStudentIds.length,
      readCount: 0,
      readBy: [],
    };

    const messageRef = await db.collection('college_messages').add(messageData);
    console.log(`📨 College message created: ${messageRef.id} for ${finalTargetStudentIds.length} students`);

    // Create notifications for each targeted student
    const notifications = finalTargetStudentIds.map((studentId: string) => ({
      type: 'message',
      studentId,
      messageId: messageRef.id,
      collegeId,
      title: `New message from ${collegeName}`,
      message: title,
      priority,
      read: false,
      createdAt: new Date(),
    }));

    // Batch create notifications
    const notificationPromises = notifications.map((notification: any) => 
      db.collection('student_notifications').add(notification)
    );

    const notificationResults = await Promise.allSettled(notificationPromises);
    const successfulNotifications = notificationResults.filter(result => result.status === 'fulfilled').length;
    const failedNotifications = notificationResults.filter(result => result.status === 'rejected').length;

    if (failedNotifications > 0) {
      console.warn(`⚠️ ${failedNotifications} notifications failed to create`);
    }

    console.log(`📧 Created ${successfulNotifications} student notifications for message ${messageRef.id}`);

    return NextResponse.json({
      messageId: messageRef.id,
      notificationsSent: successfulNotifications,
      notificationsFailed: failedNotifications,
      totalRecipients: finalTargetStudentIds.length,
    });

  } catch (error: any) {
    console.error('❌ Error creating college message:', error);
    return NextResponse.json(
      { error: 'Failed to create message', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/colleges/[collegeId]/messages - Get all messages for college
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId } = await params;
    console.log('📋 Fetching messages for college:', collegeId);

    // Get all messages for this college
    const messagesSnapshot = await db
      .collection('college_messages')
      .where('collegeId', '==', collegeId)
      .get();

    // Sort by createdAt in memory (descending)
    const messages = messagesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

    // Calculate summary statistics
    const total = messages.length;
    const highPriority = messages.filter((m: any) => m.priority === 'high').length;
    const totalRecipients = messages.reduce((sum: number, m: any) => sum + (m.totalRecipients || 0), 0);
    const totalReads = messages.reduce((sum: number, m: any) => sum + (m.readCount || 0), 0);
    const averageReadRate = totalRecipients > 0 ? (totalReads / totalRecipients) * 100 : 0;

    const summary = {
      total,
      highPriority,
      averageReadRate: Math.round(averageReadRate * 100) / 100,
      totalRecipients,
      totalReads,
    };

    console.log(`✅ Returning ${messages.length} messages with summary:`, summary);

    return NextResponse.json({
      messages,
      summary,
    });

  } catch (error: any) {
    console.error('❌ Error fetching college messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}
