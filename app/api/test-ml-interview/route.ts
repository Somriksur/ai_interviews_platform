import { NextRequest, NextResponse } from 'next/server';
import { mlNLPIntegration } from '@/lib/services/ml-nlp-integration.service';

/**
 * Test ML NLP Interview Integration
 * GET /api/test-ml-interview
 * 
 * Demonstrates how ML NLP analyzes interview responses
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing ML NLP Interview Integration...');

    // Sample interview Q&A
    const questions = [
      "Tell me about your experience with React",
      "How do you handle challenging situations?",
      "Describe a project you're proud of"
    ];

    const answers = [
      "I have 5 years of experience with React and have built scalable microservices architectures. I'm confident in my ability to deliver high-quality solutions.",
      "Oh yeah, challenging situations are just AMAZING. I absolutely LOVE when everything breaks in production.",
      "I'm probably the worst developer ever, but somehow I managed to build a system that handles millions of users and improved performance by 50%."
    ];

    // Analyze the interview
    console.log('📊 Analyzing interview transcript...');
    const analysis = await mlNLPIntegration.analyzeTranscript(answers, questions);

    // Generate insights
    console.log('💡 Generating insights...');
    const insights = mlNLPIntegration.generateInsights(analysis);

    return NextResponse.json({
      success: true,
      message: 'ML NLP Interview Analysis Complete',
      interview: {
        questions,
        answers
      },
      analysis: {
        overall: {
          sentiment: analysis.overall.sentiment,
          emotion: analysis.overall.emotion,
          communication: analysis.overall.communication,
          confidence: analysis.overall.confidence_level,
          stress: analysis.overall.stress_level,
          scores: analysis.overall.scores
        },
        perAnswer: analysis.perAnswer.map((a, i) => ({
          question: questions[i],
          answer: answers[i],
          sentiment: a.sentiment,
          emotion: a.emotion,
          communication: a.communication,
          confidence: a.confidence_level,
          stress: a.stress_level,
          scores: a.scores
        })),
        trends: analysis.trends,
        edgeCasesDetected: analysis.edgeCasesDetected
      },
      insights,
      modelVersion: analysis.overall.model_version
    });

  } catch (error: any) {
    console.error('❌ ML NLP interview test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
