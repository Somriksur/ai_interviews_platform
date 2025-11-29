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
    const prompt = `Analyze this interview performance and provide detailed insights:

Questions: ${questions.join('\n')}
Answers: ${answers.join('\n')}

Provide a JSON response with:
1. skillInsights: {technical: [], communication: [], problemSolving: [], leadership: []}
2. strengths: [] (array of strength points)
3. weaknesses: [] (array of improvement areas)
4. communicationRating: (0-100)
5. technicalScore: (0-100)
6. evaluationSummary: (detailed summary)`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR analyst specializing in campus placements.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(response);
    } catch {
      // Fallback if JSON parsing fails
      return {
        skillInsights: {
          technical: ['Good technical understanding'],
          communication: ['Clear communication'],
          problemSolving: ['Logical approach'],
          leadership: [],
        },
        strengths: ['Technical knowledge', 'Communication skills'],
        weaknesses: ['Time management'],
        communicationRating: 75,
        technicalScore: 80,
        evaluationSummary: 'Good overall performance with room for improvement.',
      };
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
    // Return default insights
    return {
      skillInsights: {
        technical: ['Technical skills demonstrated'],
        communication: ['Communication assessed'],
        problemSolving: ['Problem-solving evaluated'],
        leadership: [],
      },
      strengths: ['Performance evaluated'],
      weaknesses: ['Areas for improvement identified'],
      communicationRating: 70,
      technicalScore: 75,
      evaluationSummary: 'Interview completed successfully.',
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
