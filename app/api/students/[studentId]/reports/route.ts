import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireStudentAccess } from '@/lib/security/guards';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

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
    
    console.log(`📊 Fetching reports for student: ${studentId}`);

    // Get evaluation reports (our advanced NLP reports)
    const evalSnapshot = await db
      .collection('evaluation_reports')
      .where('studentId', '==', studentId)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`📊 Found ${evalSnapshot.size} evaluation reports`);

    // Process reports and get additional data
    const reports = await Promise.all(
      evalSnapshot.docs.map(async (doc) => {
        const reportData = withCanonicalScores(doc.data());
        
        // Get interview drive details
        let driveData = null;
        let organizationData = null;
        let collegeData = null;
        
        if (reportData.driveId) {
          const driveDoc = await db
            .collection('interview_drives')
            .doc(reportData.driveId)
            .get();
          if (driveDoc.exists) {
            const drive = driveDoc.data();
            driveData = {
              id: driveDoc.id,
              name: drive?.name || 'Interview Drive',
              role: drive?.role || 'Software Engineer',
            };

            // Get organization details
            if (drive?.organizationId) {
              const orgDoc = await db
                .collection('organizations')
                .doc(drive.organizationId)
                .get();
              if (orgDoc.exists) {
                organizationData = {
                  id: orgDoc.id,
                  name: orgDoc.data()?.name || 'Unknown Organization',
                  email: orgDoc.data()?.email || '',
                };
              }
            }

            // Get college details from the first college in the drive
            if (drive?.colleges && drive.colleges.length > 0) {
              const collegeDoc = await db
                .collection('colleges')
                .doc(drive.colleges[0])
                .get();
              if (collegeDoc.exists) {
                collegeData = {
                  id: collegeDoc.id,
                  name: collegeDoc.data()?.name || 'Unknown College',
                  location: collegeDoc.data()?.location || '',
                };
              }
            }
          }
        }

        // Map advanced NLP data to student-friendly format
        const scores = reportData.scores || {};
        const feedback = reportData.feedback || {};
        const insights = reportData.insights || {};
        const emotionAnalysis = reportData.emotionAnalysis || {};
        const confidenceAnalysis = reportData.confidenceAnalysis || {};

        // Determine placement category based on overall score and recommendation
        let placementCategory = 'Not Suitable';
        let salaryBand = 'low';
        
        if (reportData.recommendation === 'highly-recommended') {
          placementCategory = 'Highly Recommended';
          salaryBand = 'high';
        } else if (reportData.recommendation === 'recommended') {
          placementCategory = 'Recommended';
          salaryBand = 'medium';
        } else if (reportData.recommendation === 'consider') {
          placementCategory = 'Consider';
          salaryBand = 'medium';
        }

        const evaluatedAt = reportData.aiMetadata?.evaluatedAt?.toDate?.() || 
                           reportData.createdAt?.toDate?.() ||
                           new Date();
        
        // Ensure evaluatedAt is a valid date
        const validEvaluatedAt = evaluatedAt instanceof Date && !isNaN(evaluatedAt.getTime()) 
          ? evaluatedAt 
          : new Date();

        return {
          id: doc.id,
          // Core scores
          technicalScore: reportData.technicalScore || scores.technical || 0,
          communicationScore: reportData.communicationScore || scores.communication || 0,
          problemSolvingScore: reportData.problemSolvingScore || scores.problemSolving || 0,
          overallScore: reportData.overallScore || scores.overall || 0,
          
          // New technical correctness scores for detailed student feedback
          technicalCorrectness: scores.technicalCorrectness || 0,
          conceptualUnderstanding: scores.conceptualUnderstanding || 0,
          practicalApplication: scores.practicalApplication || 0,
          
          // Advanced insights for student growth
          emotionalIntelligence: insights.emotionalIntelligence || 0,
          stressResilience: insights.stressResilience || 0,
          culturalFit: insights.culturalFit || 0,
          leadershipPotential: insights.leadershipPotential || 0,
          teamworkAbility: insights.teamworkAbility || 0,
          personalityProfile: insights.personalityProfile || '',
          communicationStyle: insights.communicationStyle || '',
          
          // Emotion analysis
          emotionalStability: emotionAnalysis.emotionalStability || 0,
          communicationEffectiveness: emotionAnalysis.communicationEffectiveness || 0,
          overallWellbeing: emotionAnalysis.overallWellbeing || 0,
          dominantEmotions: emotionAnalysis.dominantEmotions || [],
          
          // Confidence tracking
          overallConfidence: confidenceAnalysis.metrics?.overallConfidence || 0,
          confidenceTrend: confidenceAnalysis.metrics?.confidenceTrend || 'stable',
          technicalConfidence: confidenceAnalysis.metrics?.technicalConfidence || 0,
          communicationConfidence: confidenceAnalysis.metrics?.communicationConfidence || 0,
          
          // Placement info
          salaryBand,
          placementCategory,
          recommendation: reportData.recommendation || 'not-recommended',
          
          // Feedback for improvement
          strengths: feedback.strengths || [],
          improvements: feedback.improvements || [],
          detailedAnalysis: feedback.detailedAnalysis || '',
          
          // Interview transcript for review
          transcript: reportData.transcript || {},
          
          // Metadata
          generatedAt: validEvaluatedAt.toISOString(),
          reportType: 'advanced_nlp',
          processingTime: reportData.aiMetadata?.processingTime || 0,
          nlpVersion: reportData.aiMetadata?.nlpVersion || '3.0.0',
          confidenceScore: reportData.aiMetadata?.confidenceScore || 0,
          
          // Related data
          drive: driveData,
          organization: organizationData,
          college: collegeData,
          
          // Full report for detailed analysis
          fullReport: reportData,
        };
      })
    );

    console.log(`✅ Returning ${reports.length} processed reports`);

    return NextResponse.json({ 
      reports,
      total: reports.length,
      metadata: {
        studentId,
        generatedAt: new Date().toISOString(),
        reportType: 'advanced_nlp_evaluation',
      }
    });
  } catch (error) {
    console.error('❌ Error fetching student reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
