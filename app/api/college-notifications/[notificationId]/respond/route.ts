import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireRole } from '@/lib/security/guards';

const respondSchema = z
  .object({
    response: z.enum(['acknowledged', 'retag_requested']),
    notes: z.string().max(1000).optional(),
  })
  .strict();

/**
 * POST /api/college-notifications/[notificationId]/respond
 * College responds to a student selection notification (acknowledge/re-tag)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ['college']);
    if (roleError) return roleError;

    const { notificationId } = await params;
    const rawBody = await request.json();
    const parseResult = respondSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { response, notes } = parseResult.data;

    const ownedCollegeSnapshot = await db
      .collection('colleges')
      .where('adminId', '==', authResult.context.user.id)
      .limit(1)
      .get();

    if (ownedCollegeSnapshot.empty) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    const collegeId = ownedCollegeSnapshot.docs[0].id;

    // Get the notification
    const notificationDoc = await db
      .collection('college_notifications')
      .doc(notificationId)
      .get();

    if (!notificationDoc.exists) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const notificationData = notificationDoc.data();

    // Verify the notification belongs to this college
    if (notificationData?.collegeId !== collegeId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the notification
    await notificationDoc.ref.update({
      status: response === 'acknowledged' ? 'acknowledged' : 'retag_requested',
      collegeResponse: response,
      collegeNotes: notes || null,
      respondedAt: new Date(),
      read: true,
    });

    // Update the selection record if it exists
    if (notificationData?.selectionId) {
      const selectionDoc = await db
        .collection('drive_student_selections')
        .doc(notificationData.selectionId)
        .get();

      if (selectionDoc.exists) {
        await selectionDoc.ref.update({
          collegeResponse: response,
          collegeNotes: notes || null,
          collegeRespondedAt: new Date(),
        });

        const selectionData = selectionDoc.data();

        // If college acknowledges, notify the student
        if (response === 'acknowledged') {
          const isSelected = notificationData.action === 'selected';
          
          const studentNotificationData = {
            type: isSelected ? 'selection' : 'rejection',
            studentId: notificationData.studentId,
            collegeId,
            organizationId: notificationData.organizationId,
            driveId: notificationData.driveId,
            selectionId: notificationData.selectionId,
            action: notificationData.action, // 'selected' or 'rejected'
            
            // Title and message
            title: isSelected 
              ? '🎉 Congratulations! You\'ve been selected'
              : '📋 Interview Drive Update',
            message: isSelected
              ? `You have been selected by ${notificationData.organizationName || 'the organization'} for "${notificationData.driveName || 'Interview Drive'}". ${notes ? `College notes: ${notes}` : ''}`
              : `Your application for "${notificationData.driveName || 'Interview Drive'}" with ${notificationData.organizationName || 'the organization'} has been reviewed. ${notes ? `College notes: ${notes}` : ''}`,
            
            // Additional context
            driveName: notificationData.driveName || 'Interview Drive',
            organizationName: notificationData.organizationName || 'Organization',
            studentName: notificationData.studentName || 'Student',
            collegeNotes: notes || null,
            
            // Status tracking
            read: false,
            createdAt: new Date(),
          };

          await db.collection('student_notifications').add(studentNotificationData);

          console.log(
            `📧 Student notification created for ${notificationData.studentId}: ${notificationData.action} (${isSelected ? 'SELECTED' : 'REJECTED'})`
          );
        }

        // If college requests re-tag, update student status
        if (response === 'retag_requested') {
          await db
            .collection('students')
            .doc(selectionData?.studentId)
            .update({
              [`driveStatus.${selectionData?.driveId}`]: 'retag_requested',
              updatedAt: new Date(),
            });

          // Create a notification back to the organization
          const orgNotificationData = {
            type: 'retag_request',
            organizationId: notificationData.organizationId,
            collegeId,
            driveId: notificationData.driveId,
            studentId: notificationData.studentId,
            selectionId: notificationData.selectionId,
            originalAction: notificationData.action,
            message: `${notificationData.studentName || 'A student'} from ${notificationData.driveName || 'interview drive'} has been requested for re-tagging by the college`,
            notes: notes || null,
            status: 'pending',
            createdAt: new Date(),
            read: false,
          };

          await db.collection('organization_notifications').add(orgNotificationData);
        }
      }
    }

    console.log(
      `✅ College ${collegeId} responded to notification ${notificationId}: ${response}`
    );

    return NextResponse.json({
      success: true,
      response,
      message:
        response === 'acknowledged'
          ? 'Selection acknowledged successfully'
          : 'Re-tag request submitted successfully. Organization has been notified.',
    });
  } catch (error) {
    console.error('Error responding to notification:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}
