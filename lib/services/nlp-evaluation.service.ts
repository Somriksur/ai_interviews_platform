// NLP Evaluation Service
// Integrates Groq API for AI-powered interview evaluation

import Groq from 'groq-sdk';
import { generateComprehensiveBehaviorReport } from '../nlp/sentiment-behavior-analysis';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EvaluationScores {
  technical: number; // 0-100
  communication: number; // 0-100
  problemSolving: number; // 0-100
  overall: number; // 0-100
}

export interface QuestionResponse {
  question: string;
  response: string;
  score: number;
  feedback: string;
}

export interface EvaluationFeedback {
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string;
  questionResponses: QuestionResponse[];
}

export interface EvaluationReport {
  studentId: string;
  driveId: string;
  sessionId: string;
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  recommendation: 'highly-recommended' | 'recommended' | 'consider' | 'not-recommended';
  aiMetadata: {
    groqModel: string;
    nlpVersion: string;
    evaluatedAt: Date;
    processingTime: number;
  };
}

export interface EvaluationInput {
  transcript: Message[];
  questions: string[];
  jobRole: string;
  studentId: string;
  driveId: string;
  sessionId: string;
}

/**
 * Main evaluation function that orchestrates the entire NLP pipeline
 */
export async function evaluateInterview(input: EvaluationInput): Promise<EvaluationReport> {
  const startTime = Date.now();

  try {
    // Step 1: Extract student responses from transcript
    const studentResponses = extractStudentResponses(input.transcript);

    // Step 2: Call Groq API for AI-powered analysis
    const groqAnalysis = await analyzeWithGroq(
      input.transcript,
      input.questions,
      input.jobRole
    );

    // Step 3: Apply custom NLP processing for behavioral analysis
    const behaviorReport = generateComprehensiveBehaviorReport(
      studentResponses,
      input.questions
    );

    // Step 4: Calculate comprehensive scores
    const scores = calculateScores(groqAnalysis, behaviorReport);

    // Step 5: Generate detailed feedback
    const feedback = generateFeedback(groqAnalysis, behaviorReport, input.questions, studentResponses);

    // Step 6: Determine recommendation level
    const recommendation = determineRecommendation(scores);

    const processingTime = Date.now() - startTime;

    return {
      studentId: input.studentId,
      driveId: input.driveId,
      sessionId: input.sessionId,
      scores,
      feedback,
      recommendation,
      aiMetadata: {
        groqModel: 'llama-3.3-70b-versatile',
        nlpVersion: '1.0.0',
        evaluatedAt: new Date(),
        processingTime,
      },
    };
  } catch (error) {
    console.error('Error in evaluateInterview:', error);
    throw new Error(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract only student responses from the full transcript
 */
function extractStudentResponses(transcript: Message[]): string[] {
  return transcript
    .filter(msg => msg.role === 'user')
    .map(msg => msg.content);
}

/**
 * Call Groq API for AI-powered interview analysis
 */
async function analyzeWithGroq(
  transcript: Message[],
  questions: string[],
  jobRole: string
): Promise<any> {
  const transcriptText = transcript
    .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
    .join('\n\n');

  const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const systemPrompt = `You are an expert technical interview evaluator with deep knowledge in software engineering, problem-solving, and communication assessment. Your task is to analyze interview transcripts and provide accurate, unbiased evaluations.

Evaluation Criteria:
1. Technical Knowledge: Depth of understanding, accuracy of concepts, practical experience
2. Communication Skills: Clarity, structure, articulation, listening
3. Problem-Solving: Analytical thinking, approach to challenges, creativity
4. Cultural Fit: Professionalism, enthusiasm, teamwork indicators

Provide your analysis in JSON format with the following structure:
{
  "technicalScore": <0-100>,
  "communicationScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area1", "area2", ...],
  "detailedAnalysis": "comprehensive analysis text",
  "questionAnalysis": [
    {
      "question": "question text",
      "response": "candidate response",
      "score": <0-100>,
      "feedback": "specific feedback"
    }
  ]
}`;

  const userPrompt = `Job Role: ${jobRole}

Interview Questions:
${questionsText}

Interview Transcript:
${transcriptText}

Please analyze this interview and provide a comprehensive evaluation.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Updated from deprecated mixtral-8x7b-32768
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Low temperature for consistency
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid response format from Groq');
  } catch (error) {
    console.error('Groq API error:', error);
    throw new Error(`Groq analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate comprehensive scores combining Groq and custom NLP analysis
 */
function calculateScores(groqAnalysis: any, behaviorReport: any): EvaluationScores {
  // Combine Groq scores with behavior analysis
  const technical = groqAnalysis.technicalScore || 0;
  const communication = Math.round(
    (groqAnalysis.communicationScore || 0) * 0.6 +
    behaviorReport.behavior.communicationClarity * 0.2 +
    behaviorReport.language.fluency * 0.2
  );
  const problemSolving = groqAnalysis.problemSolvingScore || 0;

  // Calculate overall score
  const overall = Math.round(
    technical * 0.4 +
    communication * 0.3 +
    problemSolving * 0.3
  );

  return {
    technical: Math.min(100, Math.max(0, technical)),
    communication: Math.min(100, Math.max(0, communication)),
    problemSolving: Math.min(100, Math.max(0, problemSolving)),
    overall: Math.min(100, Math.max(0, overall)),
  };
}

/**
 * Generate detailed feedback combining all analysis sources
 */
function generateFeedback(
  groqAnalysis: any,
  behaviorReport: any,
  questions: string[],
  responses: string[]
): EvaluationFeedback {
  // Combine strengths from Groq and behavior analysis
  const strengths = [
    ...(groqAnalysis.strengths || []),
  ];

  // Add behavioral strengths
  if (behaviorReport.behavior.professionalism >= 75) {
    strengths.push('Demonstrates high professionalism and work ethic');
  }
  if (behaviorReport.sentiment.emotions.confidence >= 70) {
    strengths.push('Shows strong confidence and self-assurance');
  }
  if (behaviorReport.behavior.engagement >= 75) {
    strengths.push('Highly engaged with detailed, thoughtful responses');
  }

  // Combine improvement areas
  const improvements = [
    ...(groqAnalysis.improvements || []),
    ...behaviorReport.recommendedActions,
  ];

  // Generate detailed analysis
  const detailedAnalysis = `
${groqAnalysis.detailedAnalysis || 'No detailed analysis available.'}

Behavioral Analysis:
${behaviorReport.behaviorSummary}

${behaviorReport.emotionalProfile}

Communication Quality: ${behaviorReport.behavior.communicationClarity}/100
Language Fluency: ${behaviorReport.language.fluency}/100
Professionalism: ${behaviorReport.behavior.professionalism}/100
  `.trim();

  // Map question responses
  const questionResponses: QuestionResponse[] = (groqAnalysis.questionAnalysis || []).map((qa: any, index: number) => ({
    question: questions[index] || qa.question,
    response: responses[index] || qa.response,
    score: qa.score || 0,
    feedback: qa.feedback || 'No specific feedback available',
  }));

  return {
    strengths: [...new Set(strengths)], // Remove duplicates
    improvements: [...new Set(improvements)],
    detailedAnalysis,
    questionResponses,
  };
}

/**
 * Determine recommendation level based on scores
 */
function determineRecommendation(scores: EvaluationScores): 'highly-recommended' | 'recommended' | 'consider' | 'not-recommended' {
  const { overall, technical, communication, problemSolving } = scores;

  // Highly recommended: Overall >= 80 and all individual scores >= 70
  if (overall >= 80 && technical >= 70 && communication >= 70 && problemSolving >= 70) {
    return 'highly-recommended';
  }

  // Recommended: Overall >= 65 and no score below 50
  if (overall >= 65 && technical >= 50 && communication >= 50 && problemSolving >= 50) {
    return 'recommended';
  }

  // Consider: Overall >= 50
  if (overall >= 50) {
    return 'consider';
  }

  // Not recommended: Overall < 50
  return 'not-recommended';
}

/**
 * Retry logic for API calls with exponential backoff
 */
export async function evaluateWithRetry(
  input: EvaluationInput,
  maxRetries: number = 3
): Promise<EvaluationReport> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await evaluateInterview(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Evaluation attempt ${attempt} failed:`, lastError.message);

      if (attempt < maxRetries) {
        // Exponential backoff: 2^attempt seconds
        const delayMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`Evaluation failed after ${maxRetries} attempts: ${lastError?.message}`);
}
