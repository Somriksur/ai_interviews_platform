import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { getAuthContext } from '@/lib/security/auth-context';
import { requireOrganizationOwnership } from '@/lib/security/guards';
import { withCanonicalScores } from '@/lib/utils/evaluation-report';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const { orgId } = await params;
    const ownershipError = await requireOrganizationOwnership(authResult.context, orgId);
    if (ownershipError) return ownershipError;

    const searchParams = request.nextUrl.searchParams;
    
    // Get filter parameters
    const studentId = searchParams.get('studentId');
    const driveId = searchParams.get('driveId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log(`📊 Fetching reports for organization: ${orgId}`);

    // Get evaluation reports (our advanced NLP reports)
    let evalQuery: FirebaseFirestore.Query = db.collection('evaluation_reports');
    
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
        const reportData = withCanonicalScores(doc.data());
        
        // Get student details
        let studentData = null;
        if (reportData.studentId) {
          const studentDoc = await db
            .collection('students')
            .doc(reportData.studentId)
            .get();
          if (studentDoc.exists) {
            studentData = {
              id: studentDoc.id,
              name: studentDoc.data()?.name || 'Unknown Student',
              email: studentDoc.data()?.email || '',
              rollNumber: studentDoc.data()?.rollNumber || '',
              branch: studentDoc.data()?.branch || '',
              cgpa: studentDoc.data()?.cgpa || 0,
            };
          }
        }

        // Get college details from the drive
        let collegeData = null;
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

            // Check if this drive belongs to our organization
            if (drive?.organizationId !== orgId) {
              return null; // Skip reports not belonging to this organization
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

        // Filter by date if provided - with proper date validation
        let evaluatedAt;
        try {
          // Try Firebase Timestamp first
          if (reportData.aiMetadata?.evaluatedAt?.toDate) {
            evaluatedAt = reportData.aiMetadata.evaluatedAt.toDate();
          }
          // Try parsing as date string
          else if (reportData.aiMetadata?.evaluatedAt) {
            const parsedDate = new Date(reportData.aiMetadata.evaluatedAt);
            evaluatedAt = isNaN(parsedDate.getTime()) ? null : parsedDate;
          }
          // Try createdAt as fallback
          else if (reportData.createdAt?.toDate) {
            evaluatedAt = reportData.createdAt.toDate();
          }
          // Default to current date
          else {
            evaluatedAt = new Date();
          }
          
          // Validate the final date
          if (!evaluatedAt || isNaN(evaluatedAt.getTime())) {
            evaluatedAt = new Date();
          }
        } catch (error) {
          evaluatedAt = new Date();
        }
        
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
          technicalScore: reportData.technicalScore || scores.technical || 0,
          communicationScore: reportData.communicationScore || scores.communication || 0,
          problemSolvingScore: reportData.problemSolvingScore || scores.problemSolving || 0,
          overallScore: reportData.overallScore || scores.overall || 0,
          
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
          college: collegeData,
          drive: driveData,
          
          // Full report data for detailed view
          fullReport: reportData,
        };
      })
    );

    // Filter out null values (from organization filtering and date filtering)
    const filteredReports = reports.filter(report => report !== null);

    console.log(`✅ Returning ${filteredReports.length} processed reports`);

    return NextResponse.json({ 
      reports: filteredReports,
      total: filteredReports.length,
      metadata: {
        organizationId: orgId,
        generatedAt: new Date().toISOString(),
        reportType: 'advanced_nlp_evaluation',
      }
    });
  } catch (error) {
    console.error('❌ Error fetching organization reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
