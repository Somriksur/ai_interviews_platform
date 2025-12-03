import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const { name, description, role, colleges, questions, aiMetadata, interviewConfig } = await request.json();

    if (!name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate questions if provided
    if (questions && !Array.isArray(questions)) {
      return NextResponse.json(
        { error: 'Questions must be an array' },
        { status: 400 }
      );
    }

    // Validate question format
    if (questions && questions.length > 0) {
      for (const question of questions) {
        if (!question.text || typeof question.order !== 'number' || !question.generatedBy) {
          return NextResponse.json(
            { error: 'Invalid question format. Each question must have text, order, and generatedBy fields' },
            { status: 400 }
          );
        }
      }
    }

    console.log(`📝 Creating interview drive with ${questions?.length || 0} questions`);

    // Create interview drive
    const driveRef = await db.collection('interview_drives').add({
      organizationId: orgId,
      name,
      description: description || '',
      role,
      colleges: colleges || [],
      questions: questions || [],
      aiMetadata: aiMetadata || null,
      interviewConfig: interviewConfig || null,
      taggedStudents: [],
      status: 'pending',
      createdAt: new Date(),
      completedAt: null,
      stats: {
        totalStudents: 0,
        completedInterviews: 0,
        averageScore: 0,
      },
    });

    // Create notifications for each tagged college
    if (colleges && colleges.length > 0) {
      console.log(`📬 Creating notifications for ${colleges.length} colleges`);
      console.log(`📬 Drive ID: ${driveRef.id}`);
      console.log(`📬 Organization ID: ${orgId}`);
      console.log(`📬 College IDs:`, colleges);
      
      try {
        // Use batch write for atomic operation
        const batch = db.batch();
        
        for (const collegeId of colleges) {
          const notificationRef = db.collection('driveNotifications').doc();
          const notificationData = {
            driveId: driveRef.id,
            collegeId,
            organizationId: orgId,
            status: 'pending',
            type: 'interview_drive',
            createdAt: new Date(),
            respondedAt: null,
          };
          
          console.log(`📬 Creating notification for college ${collegeId}:`, notificationData);
          batch.set(notificationRef, notificationData);
        }
        
        await batch.commit();
        console.log(`✅ Successfully created ${colleges.length} notifications`);
      } catch (notificationError) {
        console.error('❌ Error creating notifications:', notificationError);
        console.error('❌ Error details:', JSON.stringify(notificationError, null, 2));
        // Log error but don't fail the drive creation
        // The drive is already created, notifications are supplementary
      }
    } else {
      console.log(`⚠️ No colleges to notify (colleges array is empty or undefined)`);
    }

    return NextResponse.json({
      success: true,
      driveId: driveRef.id,
    });
  } catch (error) {
    console.error('Error creating interview drive:', error);
    return NextResponse.json(
      { error: 'Failed to create interview drive' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const { orgId } = await params;
    const snapshot = await db
      .collection('interview_drives')
      .where('organizationId', '==', orgId)
      .orderBy('createdAt', 'desc')
      .get();

    const drives = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const driveData = doc.data();
        
        // Fetch college names if colleges array exists
        let collegeNames: string[] = [];
        if (driveData.colleges && Array.isArray(driveData.colleges) && driveData.colleges.length > 0) {
          const collegePromises = driveData.colleges.map(async (collegeId: string) => {
            try {
              const collegeDoc = await db.collection('colleges').doc(collegeId).get();
              return collegeDoc.exists ? collegeDoc.data()?.name || 'Unknown College' : 'Unknown College';
            } catch (error) {
              console.error(`Error fetching college ${collegeId}:`, error);
              return 'Unknown College';
            }
          });
          collegeNames = await Promise.all(collegePromises);
        }
        
        return {
          id: doc.id,
          ...driveData,
          collegeNames,
        };
      })
    );

    return NextResponse.json({ drives });
  } catch (error) {
    console.error('Error fetching interview drives:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interview drives' },
      { status: 500 }
    );
  }
}
