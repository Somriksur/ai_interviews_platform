import { NextRequest, NextResponse } from 'next/server';
import { db as db } from '@/firebase/admin';
import { evaluateInterview, generateComprehensiveReports } from '@/lib/services/nlp-evaluation.service';
import { getCurrentUser } from '@/lib/actions/auth.action';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ driveId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'organization') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { driveId } = await params;
    console.log(`📊 Generating comprehensive reports for drive: ${driveId}`);
    
    // Get drive details
    const driveDoc = await db.collection('interview_drives').doc(driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    // Get all completed interview sessions for this drive
    const sessionsSnapshot = await db
      .collection('interview_sessions')
      .where('driveId', '==', driveId)
      .where('status', '==', 'completed')
      .get();

    if (sessionsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No completed interview sessions found' },
        { status: 400 }
      );
    }

    console.log(`🔍 Found ${sessionsSnapshot.size} completed sessions`);
    const reports: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Generate comprehensive reports for each student using advanced NLP
    for (const sessionDoc of sessionsSnapshot.docs) {
      try {
        const sessionData = sessionDoc.data();
        console.log(`📝 Processing session: ${sessionDoc.id} for student: ${sessionData.studentId}`);
        
        // Prepare evaluation input with comprehensive data
        const evaluationInput = {
          transcript: sessionData.transcript || [],
          questions: sessionData.questions || [],
          jobRole: driveData?.jobRole || 'Software Developer',
          studentId: sessionData.studentId,
          driveId: driveId,
          sessionId: sessionDoc.id,
          targetIndustry: driveData?.industry || 'Technology',
          experienceLevel: 'entry' as const
        };

        // Generate comprehensive NLP evaluation with all advanced features
        console.log(`🧠 Running comprehensive NLP evaluation for session: ${sessionDoc.id}`);
        const evaluation = await evaluateInterview(evaluationInput);
        
        // Generate detailed reports for all stakeholders
        console.log(`📊 Generating detailed reports for all stakeholders`);
        const comprehensiveReports = await generateComprehensiveReports(evaluation, true);

        // Store organization report (most detailed)
        const orgReportRef = await db.collection('placement_reports').add({
          driveId,
          organizationId: driveData?.organizationId || '',
          collegeId: sessionData.collegeId || '',
          studentId: sessionData.studentId || '',
          sessionId: sessionDoc.id,
          reportType: 'organization',
          
          // Comprehensive NLP Analysis Results
          scores: evaluation.scores,
          recommendation: evaluation.recommendation,
          
          // Advanced Emotion Analysis
          emotionAnalysis: {
            dominantEmotions: evaluation.emotionAnalysis.dominantEmotions,
            emotionalStability: evaluation.emotionAnalysis.emotionalStability,
            communicationEffectiveness: evaluation.emotionAnalysis.communicationEffectiveness,
            overallWellbeing: evaluation.emotionAnalysis.overallWellbeing,
            stressLevel: evaluation.emotionAnalysis.stress.overallStress,
            anxiety: evaluation.emotionAnalysis.stress.anxiety,
            confidence: evaluation.emotionAnalysis.emotions.trust,
            professionalism: evaluation.emotionAnalysis.communication.professionalism,
            engagement: evaluation.emotionAnalysis.communication.engagement
          },
          
          // Confidence Analysis
          confidenceAnalysis: {
            overallConfidence: evaluation.confidenceAnalysis.metrics.overallConfidence,
            confidenceTrend: evaluation.confidenceAnalysis.metrics.confidenceTrend,
            technicalConfidence: evaluation.confidenceAnalysis.metrics.technicalConfidence,
            communicationConfidence: evaluation.confidenceAnalysis.metrics.communicationConfidence,
            confidenceRecovery: evaluation.confidenceAnalysis.metrics.confidenceRecovery
          },
          
          // Comprehensive Insights
          insights: evaluation.insights,
          
          // Detailed Feedback
          feedback: evaluation.feedback,
          
          // Complete Transcript with Analysis
          transcript: evaluation.transcript,
          
          // Generated Reports (HTML format for display)
          organizationReport: comprehensiveReports.organizationReport.formats.html,
          collegeReport: comprehensiveReports.collegeReport.formats.html,
          studentReport: comprehensiveReports.studentReport.formats.html,
          
          // Report Metadata
          reportMetadata: {
            generatedAt: new Date(),
            reportVersion: '2.0.0',
            nlpVersion: evaluation.aiMetadata.nlpVersion,
            analysisDepth: evaluation.aiMetadata.analysisDepth,
            confidenceScore: evaluation.aiMetadata.confidenceScore,
            processingTime: evaluation.aiMetadata.processingTime
          },
          
          // Legacy fields for compatibility
          skillInsights: {
            technical: evaluation.feedback.strengths.filter(s => 
              s.toLowerCase().includes('technical') || s.toLowerCase().includes('skill')
            ),
            communication: evaluation.feedback.strengths.filter(s => 
              s.toLowerCase().includes('communication') || s.toLowerCase().includes('speaking')
            ),
            problemSolving: evaluation.feedback.strengths.filter(s => 
              s.toLowerCase().includes('problem') || s.toLowerCase().includes('solving')
            ),
            leadership: evaluation.feedback.strengths.filter(s => 
              s.toLowerCase().includes('leadership') || s.toLowerCase().includes('lead')
            )
          },
          strengths: evaluation.feedback.strengths,
          weaknesses: evaluation.feedback.improvements,
          communicationRating: evaluation.scores.communication,
          technicalScore: evaluation.scores.technical,
          overallScore: evaluation.scores.overall,
          evaluationSummary: evaluation.feedback.detailedAnalysis,
          recommendedJobs: [],
          salaryBand: categorizeSalaryBand(evaluation.scores.overall),
          placementCategory: categorizePlacement(evaluation.scores.overall),
          generatedAt: new Date(),
          pdfUrl: '',
        });

        reports.push(orgReportRef.id);
        successCount++;
        console.log(`✅ Generated comprehensive report: ${orgReportRef.id} for student: ${sessionData.studentId}`);
        
      } catch (error) {
        console.error(`❌ Error generating report for session ${sessionDoc.id}:`, error);
        errorCount++;
      }
    }

    // Update drive status
    await db.collection('interview_drives').doc(driveId).update({
      status: 'completed',
      completedAt: new Date(),
      reportsGenerated: successCount,
      reportGenerationErrors: errorCount
    });

    console.log(`🎉 Report generation completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      reportsGenerated: successCount,
      errors: errorCount,
      reportIds: reports,
      message: `Generated ${successCount} comprehensive reports with advanced NLP analysis including detailed transcripts, emotion analysis, confidence tracking, and industry-level insights.`
    });
  } catch (error) {
    console.error('❌ Error generating comprehensive reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate comprehensive reports' },
      { status: 500 }
    );
  }
}

function categorizeSalaryBand(score: number): 'high' | 'medium' | 'low' {
  if (score >= 85) return 'high';
  if (score >= 65) return 'medium';
  return 'low';
}

function categorizePlacement(score: number): string {
  if (score >= 85) return 'High-Range Package (8+ LPA)';
  if (score >= 65) return 'Mid-Range Package (4-8 LPA)';
  return 'Entry-Level Package (2-4 LPA)';
}
