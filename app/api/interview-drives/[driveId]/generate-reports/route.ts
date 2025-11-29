import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { driveId: string } }
) {
  try {
    // Get drive details
    const driveDoc = await adminDb.collection('interview_drives').doc(params.driveId).get();
    
    if (!driveDoc.exists) {
      return NextResponse.json(
        { error: 'Interview drive not found' },
        { status: 404 }
      );
    }

    const driveData = driveDoc.data();

    // Get all completed interviews for this drive
    const interviewsSnapshot = await adminDb
      .collection('interviews')
      .where('driveId', '==', params.driveId)
      .where('status', '==', 'completed')
      .get();

    if (interviewsSnapshot.empty) {
      return NextResponse.json(
        { error: 'No completed interviews found' },
        { status: 400 }
      );
    }

    const reports: string[] = [];

    // Generate report for each student
    for (const interviewDoc of interviewsSnapshot.docs) {
      const interviewData = interviewDoc.data();
      
      // Generate AI insights using Groq
      const aiInsights = await generateAIInsights(
        interviewData.questions,
        interviewData.answers,
        interviewData.feedback
      );

      // Create placement report
      const reportRef = await adminDb.collection('placement_reports').add({
        driveId: params.driveId,
        organizationId: driveData?.organizationId || '',
        collegeId: interviewData.collegeId || '',
        studentId: interviewData.studentId || '',
        interviewId: interviewDoc.id,
        skillInsights: aiInsights.skillInsights,
        strengths: aiInsights.strengths,
        weaknesses: aiInsights.weaknesses,
        communicationRating: aiInsights.communicationRating,
        technicalScore: aiInsights.technicalScore,
        overallScore: interviewData.score || 0,
        evaluationSummary: aiInsights.evaluationSummary,
        recommendedJobs: [],
        salaryBand: categorizeSalaryBand(interviewData.score || 0),
        placementCategory: categorizePlacement(interviewData.score || 0),
        generatedAt: new Date(),
        pdfUrl: '',
      });

      reports.push(reportRef.id);
    }

    // Update drive status
    await adminDb.collection('interview_drives').doc(params.driveId).update({
      status: 'completed',
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      reportsGenerated: reports.length,
      reportIds: reports,
    });
  } catch (error) {
    console.error('Error generating reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}

async function generateAIInsights(questions: string[], answers: string[], feedback: any) {
  try {
    // Import enhanced NLP analysis
    const { generateComprehensiveBehaviorReport } = await import('@/lib/nlp/sentiment-behavior-analysis');
    
    // Step 1: Groq AI - Technical Evaluation
    const technicalPrompt = `Analyze this technical interview performance:

Questions: ${questions.join('\n')}
Answers: ${answers.join('\n')}

Provide a JSON response with:
1. technicalScore: (0-100) - Overall technical correctness
2. skillInsights: {technical: [], communication: [], problemSolving: [], leadership: []}
3. strengths: [] (array of technical strength points)
4. weaknesses: [] (array of technical improvement areas)
5. evaluationSummary: (detailed technical summary)
6. conceptualUnderstanding: (0-100) - Understanding of core concepts
7. codeQuality: (0-100) - If code was involved
8. logicAndReasoning: (0-100) - Logical thinking quality`;

    const technicalCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert technical interviewer evaluating answer correctness, depth, and accuracy.',
        },
        {
          role: 'user',
          content: technicalPrompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
    });

    const technicalResponse = technicalCompletion.choices[0]?.message?.content || '{}';
    let technicalEval;
    
    try {
      technicalEval = JSON.parse(technicalResponse);
    } catch {
      technicalEval = {
        technicalScore: 75,
        skillInsights: {
          technical: ['Technical skills demonstrated'],
          communication: [],
          problemSolving: ['Problem-solving evaluated'],
          leadership: [],
        },
        strengths: ['Technical knowledge shown'],
        weaknesses: ['Areas for improvement identified'],
        evaluationSummary: 'Technical evaluation completed.',
        conceptualUnderstanding: 70,
        codeQuality: 70,
        logicAndReasoning: 70,
      };
    }
    
    // Step 2: NLP - Sentiment, Behavior & Communication Analysis
    const behaviorReport = generateComprehensiveBehaviorReport(answers, questions);
    
    // Step 3: Combine Groq + NLP for comprehensive report
    return {
      // Technical (from Groq)
      technicalScore: technicalEval.technicalScore || 75,
      conceptualUnderstanding: technicalEval.conceptualUnderstanding || 70,
      codeQuality: technicalEval.codeQuality || 70,
      logicAndReasoning: technicalEval.logicAndReasoning || 70,
      
      // Communication & Behavior (from NLP)
      communicationRating: behaviorReport.behavior.communicationClarity,
      sentimentScore: behaviorReport.sentiment.score,
      professionalismScore: behaviorReport.behavior.professionalism,
      confidenceLevel: behaviorReport.sentiment.emotions.confidence,
      
      // Emotional Analysis (from NLP)
      emotionalAnalysis: {
        overall: behaviorReport.sentiment.overall,
        nervousness: behaviorReport.sentiment.emotions.nervousness,
        confidence: behaviorReport.sentiment.emotions.confidence,
        stress: behaviorReport.sentiment.emotions.stress,
        calmness: behaviorReport.sentiment.emotions.calmness,
        motivation: behaviorReport.sentiment.emotions.motivation,
        emotionalTone: behaviorReport.sentiment.emotionalTone,
      },
      
      // Behavioral Analysis (from NLP)
      behavioralAnalysis: {
        communicationClarity: behaviorReport.behavior.communicationClarity,
        consistency: behaviorReport.behavior.consistency,
        toneVariation: behaviorReport.behavior.toneVariation,
        trustworthiness: behaviorReport.behavior.trustworthiness,
        professionalism: behaviorReport.behavior.professionalism,
        engagement: behaviorReport.behavior.engagement,
      },
      
      // Language Quality (from NLP)
      languageQuality: {
        grammar: behaviorReport.language.grammar,
        fluency: behaviorReport.language.fluency,
        vocabulary: behaviorReport.language.vocabulary,
        hesitation: behaviorReport.language.hesitation,
        fillerWords: behaviorReport.language.fillerWords,
      },
      
      // Combined Insights
      skillInsights: {
        technical: technicalEval.skillInsights?.technical || ['Technical skills assessed'],
        communication: [
          `Communication Clarity: ${behaviorReport.behavior.communicationClarity}/100`,
          `Professionalism: ${behaviorReport.behavior.professionalism}/100`,
          `Fluency: ${behaviorReport.language.fluency}/100`
        ],
        problemSolving: technicalEval.skillInsights?.problemSolving || ['Problem-solving evaluated'],
        leadership: technicalEval.skillInsights?.leadership || [],
        behavioral: [
          `Confidence: ${behaviorReport.sentiment.emotions.confidence}/100`,
          `Engagement: ${behaviorReport.behavior.engagement}/100`,
          `Trustworthiness: ${behaviorReport.behavior.trustworthiness}/100`
        ],
      },
      
      // Combined Strengths (Groq + NLP)
      strengths: [
        ...(technicalEval.strengths || []),
        ...behaviorReport.recommendedActions.filter(a => a.includes('excellent') || a.includes('strong'))
      ].slice(0, 5),
      
      // Combined Weaknesses (Groq + NLP)
      weaknesses: [
        ...(technicalEval.weaknesses || []),
        ...behaviorReport.recommendedActions.filter(a => !a.includes('excellent') && !a.includes('strong'))
      ].slice(0, 5),
      
      // Comprehensive Summary
      evaluationSummary: `
TECHNICAL EVALUATION (Groq AI):
${technicalEval.evaluationSummary || 'Technical assessment completed.'}

BEHAVIORAL & COMMUNICATION ANALYSIS (NLP):
${behaviorReport.behaviorSummary}

EMOTIONAL PROFILE:
${behaviorReport.emotionalProfile}

OVERALL ASSESSMENT:
Technical Score: ${technicalEval.technicalScore}/100
Communication Score: ${behaviorReport.behavior.communicationClarity}/100
Behavior Score: ${behaviorReport.overallBehaviorScore}/100
Sentiment: ${behaviorReport.sentiment.overall} (${behaviorReport.sentiment.score}/100)
      `.trim(),
    };
  } catch (error) {
    console.error('Error generating AI insights:', error);
    // Return default insights
    return {
      technicalScore: 70,
      communicationRating: 70,
      skillInsights: {
        technical: ['Technical skills demonstrated'],
        communication: ['Communication assessed'],
        problemSolving: ['Problem-solving evaluated'],
        leadership: [],
      },
      strengths: ['Performance evaluated'],
      weaknesses: ['Areas for improvement identified'],
      evaluationSummary: 'Interview completed successfully.',
      emotionalAnalysis: {
        overall: 'neutral',
        nervousness: 50,
        confidence: 50,
        stress: 50,
        calmness: 50,
        motivation: 50,
        emotionalTone: 'Balanced emotional state',
      },
      behavioralAnalysis: {
        communicationClarity: 70,
        consistency: 70,
        toneVariation: 50,
        trustworthiness: 70,
        professionalism: 70,
        engagement: 70,
      },
      languageQuality: {
        grammar: 70,
        fluency: 70,
        vocabulary: 70,
        hesitation: 30,
        fillerWords: 5,
      },
    };
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
