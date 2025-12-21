import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collegeId: string }> }
) {
  try {
    const { collegeId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log(`📊 Fetching reports for college: ${collegeId}`);

    // Get evaluation reports (our advanced NLP reports)
    let evalQuery = db.collection('evaluation_reports');
    
    // Apply filters
    if (studentId) {
      evalQuery = evalQuery.where('studentId', '==', studentId);
    }
    if (driveId) {
      evalQuery = evalQuery.where('driveId', '==', driveId);
    }

    const evalSnapshot = await evalQuery.orderBy('aiMetadata.evaluatedAt', 'desc').get();
    console.log(`📊 Found ${evalSnapshot.size} evaluation reports`);

    // Process reports and get additional data
    const reports = await Promise.all(
      evalSnapshot.docs.map(async (doc) => {
        const reportData = doc.data();
        
        // Get student details
        let studentData = null;
        if (reportData.studentId) {
          const studentDoc = await db
            .collection('students')
            .doc(reportData.studentId)
            .get();
          if (studentDoc.exists) {
            const student = studentDoc.data();
            studentData = {
              id: studentDoc.id,
              name: student?.name || 'Unknown Student',
              email: student?.email || '',
              rollNumber: student?.rollNumber || '',
              branch: student?.branch || '',
              cgpa: student?.cgpa || 0,
            };

            // Check if this student belongs to our college
            if (student?.collegeId !== collegeId) {
              return null; // Skip reports not belonging to this college
            }
          }
        }

        // Get organization and drive details
        let organizationData = null;
        let driveData = null;
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
          }
        }

        // Filter by date if provided
        const evaluatedAt = reportData.aiMetadata?.evaluatedAt?.toDate?.() || 
                           new Date(reportData.aiMetadata?.evaluatedAt) ||
                           reportData.createdAt?.toDate?.() ||
                           new Date();
        
        if (startDate && evaluatedAt < new Date(startDate)) {
          return null;
        }
        if (endDate && evaluatedAt > new Date(endDate)) {
          return null;
        }

        // Map advanced NLP data to display format
        const scores = reportData.scores || {};
        const feedback = reportData.feedback || {};
        const insights = reportData.insights || {};
        const emotionAnalysis = reportData.emotionAnalysis || {};

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

        return {
          id: doc.id,
          // Map to expected format for UI compatibility
          technicalScore: scores.technical || 0,
          communicationScore: scores.communication || 0,
          problemSolvingScore: scores.problemSolving || 0,
          overallScore: scores.overall || 0,
          
          // New technical correctness scores
          technicalCorrectness: scores.technicalCorrectness || 0,
          conceptualUnderstanding: scores.conceptualUnderstanding || 0,
          practicalApplication: scores.practicalApplication || 0,
          
          // Advanced NLP insights
          emotionalIntelligence: insights.emotionalIntelligence || 0,
          stressResilience: insights.stressResilience || 0,
          culturalFit: insights.culturalFit || 0,
          leadershipPotential: insights.leadershipPotential || 0,
          teamworkAbility: insights.teamworkAbility || 0,
          
          // Emotion analysis
          emotionalStability: emotionAnalysis.emotionalStability || 0,
          communicationEffectiveness: emotionAnalysis.communicationEffectiveness || 0,
          overallWellbeing: emotionAnalysis.overallWellbeing || 0,
          dominantEmotions: emotionAnalysis.dominantEmotions || [],
          
          // Confidence analysis
          overallConfidence: reportData.confidenceAnalysis?.metrics?.overallConfidence || 0,
          confidenceTrend: reportData.confidenceAnalysis?.metrics?.confidenceTrend || 'stable',
          
          // Placement info
          salaryBand,
          placementCategory,
          recommendation: reportData.recommendation || 'not-recommended',
          
          // Feedback
          strengths: feedback.strengths || [],
          improvements: feedback.improvements || [],
          detailedAnalysis: feedback.detailedAnalysis || '',
          
          // Metadata
          generatedAt: evaluatedAt.toISOString(),
          reportType: 'advanced_nlp',
          processingTime: reportData.aiMetadata?.processingTime || 0,
          nlpVersion: reportData.aiMetadata?.nlpVersion || '3.0.0',
          confidenceScore: reportData.aiMetadata?.confidenceScore || 0,
          
          // Related data
          student: studentData,
          organization: organizationData,
          drive: driveData,
          
          // Full report data for detailed view
          fullReport: reportData,
        };
      })
    );

    // Filter out null values (from college filtering and date filtering)
    const filteredReports = reports.filter(report => report !== null);

    console.log(`✅ Returning ${filteredReports.length} processed reports`);

    return NextResponse.json({ 
      reports: filteredReports,
      total: filteredReports.length,
      metadata: {
        collegeId: collegeId,
        generatedAt: new Date().toISOString(),
        reportType: 'advanced_nlp_evaluation',
      }
    });
  } catch (error) {
    console.error('❌ Error fetching college reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
