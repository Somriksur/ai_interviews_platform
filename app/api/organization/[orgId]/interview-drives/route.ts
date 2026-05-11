import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { z } from "zod";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireOrganizationOwnership } from "@/lib/security/guards";

const driveQuestionSchema = z
  .object({
    text: z.string().min(1).max(2000),
    order: z.number().int().min(1).max(1000),
    generatedBy: z.string().min(1).max(64),
  })
  .strict();

const interviewDriveCreateSchema = z
  .object({
    name: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    role: z.string().min(1).max(200),
    colleges: z.array(z.string().min(1)).max(500).optional(),
    questions: z.array(driveQuestionSchema).max(500).optional(),
    aiMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
    interviewConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .strict();

export async function POST(request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    console.log('🚀 Starting interview drive creation...');
    
    const authResult = await getAuthContext(request);
    if (!authResult.ok) {
      console.log('❌ Auth failed');
      return authResult.response;
    }
    console.log('✅ Auth successful');

    const { orgId } = await params;
    console.log('📋 Organization ID:', orgId);
    
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) {
      console.log('❌ Access denied');
      return accessError;
    }
    console.log('✅ Access granted');

    const rawBody = await request.json();
    console.log('📦 Request body keys:', Object.keys(rawBody));
    console.log('📦 Questions count:', rawBody.questions?.length || 0);
    console.log('📦 Colleges count:', rawBody.colleges?.length || 0);
    
    const parseResult = interviewDriveCreateSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.error('❌ Validation failed:', parseResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    console.log('✅ Validation passed');

    const { name, description, role, colleges, questions, aiMetadata, interviewConfig } = parseResult.data;

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
    const driveData = {
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
    };
    
    console.log('📝 Drive data prepared:', {
      ...driveData,
      questions: `${driveData.questions.length} questions`,
      colleges: `${driveData.colleges.length} colleges`
    });
    
    const driveRef = await db.collection('interview_drives').add(driveData);
    console.log('✅ Drive created with ID:', driveRef.id);

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
    console.error('❌ Error creating interview drive:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: 'Failed to create interview drive',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ orgId: string }> }) {
  try {
    const authResult = await getAuthContext(_request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const accessError = await requireOrganizationOwnership(authResult.context, orgId);
    if (accessError) return accessError;

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
        
        // Calculate real-time stats from interview sessions
        const sessionsSnapshot = await db
          .collection('interview_sessions')
          .where('driveId', '==', doc.id)
          .get();
        
        const completedSessions = sessionsSnapshot.docs.filter(
          sessionDoc => sessionDoc.data().status === 'completed'
        );
        
        // Calculate average score from evaluation reports
        let totalScore = 0;
        let scoredCount = 0;
        
        for (const sessionDoc of completedSessions) {
          const sessionData = sessionDoc.data();
          if (sessionData.evaluationId) {
            try {
              const evalDoc = await db
                .collection('evaluation_reports')
                .doc(sessionData.evaluationId)
                .get();
              
              if (evalDoc.exists) {
                const evalData = evalDoc.data();
                const overallScore = evalData?.overallScore || evalData?.scores?.overall || 0;
                if (overallScore > 0) {
                  totalScore += overallScore;
                  scoredCount++;
                }
              }
            } catch (error) {
              console.error(`Error fetching evaluation for session ${sessionDoc.id}:`, error);
            }
          }
        }
        
        const averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
        
        // Count tagged students
        const taggedStudents = driveData.taggedStudents?.length || 0;
        
        return {
          id: doc.id,
          ...driveData,
          collegeNames,
          // Override stats with real-time calculated values
          stats: {
            totalStudents: taggedStudents,
            completedInterviews: completedSessions.length,
            averageScore: averageScore,
          },
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
