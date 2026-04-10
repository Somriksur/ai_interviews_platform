import { NextRequest, NextResponse } from 'next/server';
import { z } from "zod";
import { db } from '@/firebase/admin';
import { getCurrentUser } from '@/lib/actions/auth.action';
import { normalizeCollegeName } from '@/lib/services/college-name.service';

const tagStudentsSchema = z
  .object({
    studentIds: z.array(z.string().min(1)).min(1),
    sendNotification: z.boolean().optional(),
  })
  .strict();

const removeTaggedStudentsSchema = z
  .object({
    studentIds: z.array(z.string().min(1)).min(1),
  })
  .strict();

// POST /api/colleges/[collegeId]/interview-drives/[driveId]/tag-students
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, driveId } = await params;
    const rawBody = await request.json();
    const parseResult = tagStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { studentIds, sendNotification = true } = parseResult.data;

    console.log(`🏷️ Tagging ${studentIds.length} students for drive ${driveId}`);

    // Get college and normalize name
    const collegeDoc = await db.collection('colleges').doc(collegeId).get();
    if (!collegeDoc.exists) {
      return NextResponse.json(
        { error: 'College not found' },
        { status: 404 }
      );
    }

    const collegeData = collegeDoc.data();
    const normalizedCollegeName = collegeData?.normalizedName || normalizeCollegeName(collegeData?.name || '');

    if (!normalizedCollegeName) {
      return NextResponse.json(
        { error: 'Invalid college name' },
        { status: 400 }
      );
    }

    // Verify the drive exists
    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();
    if (!driveData) {
      return NextResponse.json(
        { error: 'Interview drive data not found' },
        { status: 404 }
      );
    }

    // Check if college is tagged for this drive
    const taggedColleges = driveData?.taggedColleges || [];
    if (!taggedColleges.includes(normalizedCollegeName)) {
      return NextResponse.json(
        { error: 'College is not tagged for this interview drive' },
        { status: 403 }
      );
    }

    // Verify college has approved the associated job posting
    if (driveData?.jobPostingId) {
      const jobDoc = await db.collection('jobPostings').doc(driveData.jobPostingId).get();
      if (jobDoc.exists) {
        const jobData = jobDoc.data();
        const collegeApprovals = jobData?.collegeApprovals || {};
        const approvalStatus = collegeApprovals[normalizedCollegeName]?.status;

        if (approvalStatus !== 'approved') {
          return NextResponse.json(
            { error: 'College has not approved the associated job posting' },
            { status: 403 }
          );
        }
      }
    }

    // Verify all students belong to this college using normalized name
    const studentsSnapshot = await db
      .collection('students')
      .where('normalizedCollegeName', '==', normalizedCollegeName)
      .get();
    
    const collegeStudentIds = new Set(studentsSnapshot.docs.map(doc => doc.id));
    const invalidStudentIds = studentIds.filter((id: string) => !collegeStudentIds.has(id));
    
    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        { error: `Students not found in college: ${invalidStudentIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Get existing tagged students from drive document
    const existingTaggedStudents = driveData?.taggedStudents || [];
    const existingStudentIds = new Set(
      existingTaggedStudents.map((ts: any) => ts.studentId)
    );

    // Filter out already tagged students
    const newStudentIds = studentIds.filter((id: string) => !existingStudentIds.has(id));
    
    if (newStudentIds.length === 0) {
      return NextResponse.json(
        { error: 'All selected students are already tagged for this drive' },
        { status: 400 }
      );
    }

    // Create new tagged student entries
    const newTaggedStudents = newStudentIds.map((studentId: string) => ({
      studentId,
      normalizedCollegeName,
      taggedAt: new Date(),
    }));

    // Update drive document with new tagged students
    const updatedTaggedStudents = [...existingTaggedStudents, ...newTaggedStudents];

    // Update college stats
    const byCollege = driveData?.stats?.byCollege || {};
    const collegeStats = byCollege[normalizedCollegeName] || {
      totalStudents: 0,
      completedInterviews: 0,
      averageScore: 0,
    };

    byCollege[normalizedCollegeName] = {
      ...collegeStats,
      totalStudents: collegeStats.totalStudents + newStudentIds.length,
    };

    await db.collection('interview_drives').doc(driveId).update({
      taggedStudents: updatedTaggedStudents,
      'stats.totalStudents': (driveData?.stats?.totalStudents || 0) + newStudentIds.length,
      'stats.byCollege': byCollege,
    });

    console.log(`✅ Tagged ${newStudentIds.length} students`);

    // Send notifications if requested
    let notificationsSent = 0;
    let notificationsFailed = 0;

    if (sendNotification && newStudentIds.length > 0) {
      const notifications = newStudentIds.map((studentId: string) => ({
        type: 'drive_assignment',
        studentId,
        driveId,
        collegeId,
        normalizedCollegeName,
        title: 'New Interview Drive Assigned',
        message: `You have been assigned to "${driveData.name || 'Interview Drive'}" by your college`,
        driveName: driveData.name || 'Interview Drive',
        organizationName: driveData.organizationName || 'Organization',
        read: false,
        createdAt: new Date(),
      }));

      const notificationPromises = notifications.map((notification: any) => 
        db.collection('student_notifications').add(notification)
      );

      const notificationResults = await Promise.allSettled(notificationPromises);
      notificationsSent = notificationResults.filter(result => result.status === 'fulfilled').length;
      notificationsFailed = notificationResults.filter(result => result.status === 'rejected').length;

      console.log(`📧 Sent ${notificationsSent} notifications, ${notificationsFailed} failed`);
    }

    return NextResponse.json({
      tagged: newStudentIds.length,
      notificationsSent,
      notificationsFailed,
      alreadyTagged: studentIds.length - newStudentIds.length,
      totalRequested: studentIds.length,
    });

  } catch (error: any) {
    console.error('❌ Error tagging students:', error);
    return NextResponse.json(
      { error: 'Failed to tag students', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/colleges/[collegeId]/interview-drives/[driveId]/tag-students
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, driveId } = await params;
    console.log(`📋 Fetching tagged students for drive ${driveId}`);

    // Get tagged students for this drive
    const taggedSnapshot = await db
      .collection('drive_student_tags')
      .where('driveId', '==', driveId)
      .where('collegeId', '==', collegeId)
      .where('status', '==', 'active')
      .get();

    // Get student details for tagged students
    const taggedStudentIds = taggedSnapshot.docs.map(doc => doc.data().studentId);
    const taggedStudentsData: any[] = [];

    if (taggedStudentIds.length > 0) {
      const studentsSnapshot = await db
        .collection('students')
        .where('__name__', 'in', taggedStudentIds)
        .get();

      const studentMap = new Map();
      studentsSnapshot.docs.forEach(doc => {
        studentMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // Combine tag data with student data
      taggedSnapshot.docs.forEach(doc => {
        const tagData = doc.data();
        const studentData = studentMap.get(tagData.studentId);
        if (studentData) {
          taggedStudentsData.push({
            tagId: doc.id,
            studentId: tagData.studentId,
            studentName: studentData.name,
            rollNumber: studentData.rollNumber,
            branch: studentData.branch,
            year: studentData.year,
            cgpa: studentData.cgpa,
            taggedAt: tagData.taggedAt,
            taggedBy: tagData.taggedBy,
            notificationSent: tagData.notificationSent,
          });
        }
      });
    }

    // Get all available students for this college (not yet tagged)
    const allStudentsSnapshot = await db
      .collection('students')
      .where('collegeId', '==', collegeId)
      .get();

    const availableStudents = allStudentsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(student => !taggedStudentIds.includes(student.id))
      .sort((a: any, b: any) => {
        return (a.name || '').localeCompare(b.name || '');
      });

    // Sort tagged students by name
    taggedStudentsData.sort((a, b) => a.studentName.localeCompare(b.studentName));

    console.log(`✅ Found ${taggedStudentsData.length} tagged students, ${availableStudents.length} available`);

    return NextResponse.json({
      taggedStudents: taggedStudentsData,
      availableStudents,
      summary: {
        totalTagged: taggedStudentsData.length,
        totalAvailable: availableStudents.length,
        totalStudents: allStudentsSnapshot.size,
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching tagged students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tagged students', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/colleges/[collegeId]/interview-drives/[driveId]/tag-students
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string; driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'college') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { collegeId, driveId } = await params;
    const rawBody = await request.json();
    const parseResult = removeTaggedStudentsSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const { studentIds } = parseResult.data;

    console.log(`🗑️ Removing tags for ${studentIds.length} students from drive ${driveId}`);

    // Find existing tags
    const tagsSnapshot = await db
      .collection('drive_student_tags')
      .where('driveId', '==', driveId)
      .where('collegeId', '==', collegeId)
      .where('status', '==', 'active')
      .get();

    const tagsToRemove = tagsSnapshot.docs.filter(doc => 
      studentIds.includes(doc.data().studentId)
    );

    if (tagsToRemove.length === 0) {
      return NextResponse.json(
        { error: 'No active tags found for specified students' },
        { status: 404 }
      );
    }

    // Update tags to 'removed' status instead of deleting
    const updatePromises = tagsToRemove.map(doc => 
      doc.ref.update({
        status: 'removed',
        removedAt: new Date(),
        removedBy: user.id,
      })
    );

    const updateResults = await Promise.allSettled(updatePromises);
    const successfulRemovals = updateResults.filter(result => result.status === 'fulfilled').length;
    const failedRemovals = updateResults.filter(result => result.status === 'rejected').length;

    console.log(`✅ Removed ${successfulRemovals} tags, ${failedRemovals} failed`);

    return NextResponse.json({
      removed: successfulRemovals,
      failed: failedRemovals,
      totalRequested: studentIds.length,
    });

  } catch (error: any) {
    console.error('❌ Error removing student tags:', error);
    return NextResponse.json(
      { error: 'Failed to remove tags', details: error.message },
      { status: 500 }
    );
  }
}
