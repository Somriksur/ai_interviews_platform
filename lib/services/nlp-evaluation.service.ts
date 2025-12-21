// Enhanced NLP Evaluation Service
// Industry-level AI-powered interview evaluation with advanced emotion detection

import Groq from 'groq-sdk';
import { generateComprehensiveBehaviorReport } from '../nlp/sentiment-behavior-analysis';
import { AdvancedEmotionDetector, AdvancedEmotionReport } from '../nlp/advanced-emotion-detection';
import { RealTimeConfidenceTracker, ConfidenceAnalysis } from '../nlp/real-time-confidence-tracker';
import { IndustrySpecificEvaluator, IndustryEvaluationReport } from '../nlp/industry-specific-evaluator';
import { ReportGenerationService } from './report-generation.service';

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
  // New technical correctness scores
  technicalCorrectness: number; // 0-100 (accuracy of answers)
  conceptualUnderstanding: number; // 0-100 (depth of knowledge)
  practicalApplication: number; // 0-100 (real-world application)
}

export interface TechnicalEvaluation {
  overallTechnicalScore: number; // 0-100
  conceptualAccuracy: number; // 0-100
  practicalKnowledge: number; // 0-100
  questionAnalysis: Array<{
    question: string;
    response: string;
    correctnessScore: number; // 0-100
    conceptsIdentified: string[];
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  }>;
  technicalStrengths: string[];
  technicalWeaknesses: string[];
  knowledgeGaps: string[];
  recommendations: string[];
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
  
  // Advanced emotion and psychological analysis
  emotionAnalysis: AdvancedEmotionReport;
  
  // Real-time confidence analysis
  confidenceAnalysis: ConfidenceAnalysis;
  
  // Industry-specific evaluation
  industryEvaluation?: IndustryEvaluationReport;
  
  // Interview transcript for sharing
  transcript: {
    fullTranscript: string;
    questionResponses: Array<{
      question: string;
      response: string;
      timestamp?: Date;
      emotionalState?: string;
      stressLevel?: number;
    }>;
  };
  
  // Comprehensive insights
  insights: {
    personalityProfile: string;
    emotionalIntelligence: number;
    communicationStyle: string;
    stressResilience: number;
    culturalFit: number;
    leadershipPotential: number;
    teamworkAbility: number;
  };
  
  aiMetadata: {
    groqModel: string;
    nlpVersion: string;
    evaluatedAt: Date;
    processingTime: number;
    analysisDepth: 'basic' | 'intermediate' | 'advanced' | 'expert';
    confidenceScore: number;
  };
}

export interface EvaluationInput {
  transcript: Message[];
  questions: string[];
  jobRole: string;
  studentId: string;
  driveId: string;
  sessionId: string;
  // Optional industry-specific evaluation
  targetIndustry?: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
}

/**
 * Main evaluation function that orchestrates the entire NLP pipeline
 */
export async function evaluateInterview(input: EvaluationInput): Promise<EvaluationReport> {
  const startTime = Date.now();

  try {
    console.log('🧠 Starting comprehensive interview evaluation...');
    
    // Step 1: Extract student responses from transcript
    const studentResponses = extractStudentResponses(input.transcript);
    console.log(`📝 Extracted ${studentResponses.length} student responses`);

    // Step 2: Advanced emotion and psychological analysis
    const emotionDetector = new AdvancedEmotionDetector();
    const emotionAnalysis = emotionDetector.analyzeEmotions(
      studentResponses,
      input.transcript.map(m => m.timestamp)
    );
    console.log('🎭 Completed advanced emotion analysis');

    // Step 3: Real-time confidence tracking
    const confidenceTracker = new RealTimeConfidenceTracker();
    const confidenceAnalysis = confidenceTracker.trackConfidence(
      studentResponses,
      input.questions
    );
    console.log('📊 Completed confidence tracking analysis');

    // Step 4: Industry-specific evaluation (if requested)
    let industryEvaluation: IndustryEvaluationReport | undefined;
    if (input.targetIndustry && input.experienceLevel) {
      const industryEvaluator = new IndustrySpecificEvaluator();
      industryEvaluation = industryEvaluator.evaluateForIndustry(
        studentResponses,
        input.questions,
        input.targetIndustry,
        input.jobRole,
        input.experienceLevel
      );
      console.log('🏭 Completed industry-specific evaluation');
    }

    // Step 5: Technical Correctness Evaluation using Groq
    const technicalEvaluation = await evaluateTechnicalCorrectness(
      input.questions,
      studentResponses,
      input.jobRole
    );
    console.log('🎯 Completed technical correctness evaluation');

    // Step 6: Call Groq API for comprehensive AI-powered analysis
    const groqAnalysis = await analyzeWithGroq(
      input.transcript,
      input.questions,
      input.jobRole,
      emotionAnalysis,
      confidenceAnalysis,
      technicalEvaluation
    );
    console.log('🤖 Completed comprehensive Groq AI analysis');

    // Step 7: Apply custom NLP processing for behavioral analysis
    const behaviorReport = generateComprehensiveBehaviorReport(
      studentResponses,
      input.questions
    );
    console.log('📊 Completed behavioral analysis');

    // Step 8: Calculate comprehensive scores (including technical correctness)
    const scores = calculateScores(groqAnalysis, behaviorReport, emotionAnalysis, confidenceAnalysis, technicalEvaluation);

    // Step 9: Generate detailed feedback (including technical insights)
    const feedback = generateFeedback(groqAnalysis, behaviorReport, input.questions, studentResponses, emotionAnalysis, confidenceAnalysis, technicalEvaluation);

    // Step 10: Create interview transcript for sharing
    const transcript = createInterviewTranscript(input.transcript, input.questions, emotionAnalysis);

    // Step 11: Generate comprehensive insights
    const insights = generateComprehensiveInsights(emotionAnalysis, groqAnalysis, behaviorReport, confidenceAnalysis);

    // Step 12: Determine recommendation level (including technical competency)
    const recommendation = determineRecommendation(scores, emotionAnalysis, confidenceAnalysis, technicalEvaluation);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Evaluation completed in ${processingTime}ms`);

    return {
      studentId: input.studentId,
      driveId: input.driveId,
      sessionId: input.sessionId,
      scores,
      feedback,
      recommendation,
      emotionAnalysis,
      confidenceAnalysis,
      ...(industryEvaluation && { industryEvaluation }),
      transcript,
      insights,
      aiMetadata: {
        groqModel: 'llama-3.3-70b-versatile',
        nlpVersion: '3.0.0',
        evaluatedAt: new Date(),
        processingTime,
        analysisDepth: emotionAnalysis.analysisDepth,
        confidenceScore: emotionAnalysis.confidenceScore,
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
 * Evaluate technical correctness of answers using Groq AI
 */
async function evaluateTechnicalCorrectness(
  questions: string[],
  responses: string[],
  jobRole: string
): Promise<TechnicalEvaluation> {
  console.log('🎯 Starting technical correctness evaluation...');

  const systemPrompt = `You are an expert technical interviewer and software engineering assessor with deep knowledge across multiple programming languages, frameworks, and computer science concepts.

Your task is to evaluate the technical correctness and accuracy of interview responses. Focus on:

1. TECHNICAL ACCURACY: Are the answers factually correct?
2. CONCEPTUAL UNDERSTANDING: Does the candidate understand underlying concepts?
3. PRACTICAL APPLICATION: Can they apply knowledge to real-world scenarios?
4. COMPLETENESS: Are answers comprehensive and well-structured?
5. DEPTH OF KNOWLEDGE: Do they demonstrate deep vs surface-level understanding?

Evaluation Criteria:
- 90-100: Expert level, accurate, comprehensive, demonstrates deep understanding
- 80-89: Strong technical knowledge, mostly accurate with minor gaps
- 70-79: Good understanding, some inaccuracies or incomplete explanations
- 60-69: Basic knowledge, several technical errors or gaps
- 50-59: Limited understanding, significant inaccuracies
- Below 50: Poor technical knowledge, major errors or misconceptions

Provide your analysis in JSON format:
{
  "overallTechnicalScore": <0-100>,
  "conceptualAccuracy": <0-100>,
  "practicalKnowledge": <0-100>,
  "questionAnalysis": [
    {
      "question": "question text",
      "response": "candidate response",
      "correctnessScore": <0-100>,
      "conceptsIdentified": ["concept1", "concept2"],
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "suggestions": ["suggestion1", "suggestion2"]
    }
  ],
  "technicalStrengths": ["overall strength1", "overall strength2"],
  "technicalWeaknesses": ["overall weakness1", "overall weakness2"],
  "knowledgeGaps": ["gap1", "gap2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

  // Prepare Q&A pairs for evaluation
  const qaText = questions.map((q, i) => 
    `Question ${i + 1}: ${q}\nAnswer ${i + 1}: ${responses[i] || 'No response provided'}`
  ).join('\n\n');

  const userPrompt = `Job Role: ${jobRole}

Interview Questions and Responses:
${qaText}

Please evaluate the technical correctness and accuracy of these responses. Consider the job role context and provide detailed analysis for each question-answer pair.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // Low temperature for consistent technical evaluation
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    
    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      console.log(`✅ Technical evaluation completed with score: ${evaluation.overallTechnicalScore}/100`);
      return evaluation;
    }
    
    throw new Error('Invalid response format from Groq technical evaluation');
  } catch (error) {
    console.error('❌ Technical evaluation error:', error);
    
    // Fallback evaluation if Groq fails
    const fallbackEvaluation: TechnicalEvaluation = {
      overallTechnicalScore: 50,
      conceptualAccuracy: 50,
      practicalKnowledge: 50,
      questionAnalysis: questions.map((q, i) => ({
        question: q,
        response: responses[i] || 'No response',
        correctnessScore: 50,
        conceptsIdentified: [],
        strengths: ['Response provided'],
        weaknesses: ['Unable to evaluate technical accuracy'],
        suggestions: ['Technical evaluation temporarily unavailable']
      })),
      technicalStrengths: ['Participated in technical interview'],
      technicalWeaknesses: ['Technical evaluation temporarily unavailable'],
      knowledgeGaps: [],
      recommendations: ['Complete technical evaluation when system is available']
    };
    
    return fallbackEvaluation;
  }
}
/**
 * Call Groq API for comprehensive AI-powered interview analysis
 */
async function analyzeWithGroq(
  transcript: Message[],
  questions: string[],
  jobRole: string,
  emotionAnalysis: AdvancedEmotionReport,
  confidenceAnalysis: ConfidenceAnalysis,
  technicalEvaluation: TechnicalEvaluation
): Promise<any> {
  const transcriptText = transcript
    .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
    .join('\n\n');

  const questionsText = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');

  const technicalSummary = `
Technical Correctness Analysis:
- Overall Technical Score: ${technicalEvaluation.overallTechnicalScore}/100
- Conceptual Accuracy: ${technicalEvaluation.conceptualAccuracy}/100
- Practical Knowledge: ${technicalEvaluation.practicalKnowledge}/100
- Technical Strengths: ${technicalEvaluation.technicalStrengths.join(', ')}
- Technical Weaknesses: ${technicalEvaluation.technicalWeaknesses.join(', ')}
- Knowledge Gaps: ${technicalEvaluation.knowledgeGaps.join(', ')}
- Question-wise Correctness: ${technicalEvaluation.questionAnalysis.map(qa => `Q: "${qa.question.substring(0, 50)}..." - Score: ${qa.correctnessScore}/100`).join('; ')}
`;

  const emotionSummary = `
Emotion Analysis Summary:
- Dominant Emotions: ${emotionAnalysis.dominantEmotions.join(', ')}
- Emotional Stability: ${emotionAnalysis.emotionalStability}/100
- Communication Effectiveness: ${emotionAnalysis.communicationEffectiveness}/100
- Overall Wellbeing: ${emotionAnalysis.overallWellbeing}/100
- Stress Level: ${emotionAnalysis.stress.stressLevel} (${emotionAnalysis.stress.overallStress}/100)
- Confidence: ${emotionAnalysis.emotions.trust}/100
- Anxiety: ${emotionAnalysis.stress.anxiety}/100
- Professionalism: ${emotionAnalysis.communication.professionalism}/100
- Engagement: ${emotionAnalysis.communication.engagement}/100

Confidence Analysis Summary:
- Overall Confidence: ${confidenceAnalysis.metrics.overallConfidence}/100
- Confidence Trend: ${confidenceAnalysis.metrics.confidenceTrend}
- Confidence Stability: ${100 - confidenceAnalysis.metrics.confidenceVariability}/100
- Technical Confidence: ${confidenceAnalysis.metrics.technicalConfidence}/100
- Communication Confidence: ${confidenceAnalysis.metrics.communicationConfidence}/100
- Confidence Recovery: ${confidenceAnalysis.metrics.confidenceRecovery}/100
- Peak Moments: ${confidenceAnalysis.metrics.peakConfidenceMoments.length}
- Low Moments: ${confidenceAnalysis.metrics.lowConfidenceMoments.length}
`;

  const systemPrompt = `You are an expert technical interview evaluator with deep knowledge in software engineering, psychology, and human behavior assessment. You have access to advanced emotion analysis data AND technical correctness evaluation to provide comprehensive evaluations.

Your task is to analyze interview transcripts along with detailed emotion, psychological, and technical correctness data to provide accurate, unbiased evaluations that consider both technical competence and emotional intelligence.

Evaluation Criteria:
1. Technical Knowledge: Depth of understanding, accuracy of concepts, practical experience (USE TECHNICAL EVALUATION DATA)
2. Communication Skills: Clarity, structure, articulation, listening, emotional intelligence
3. Problem-Solving: Analytical thinking, approach to challenges, creativity, stress management
4. Cultural Fit: Professionalism, enthusiasm, teamwork indicators, emotional stability
5. Leadership Potential: Confidence, decision-making, influence, emotional regulation
6. Stress Resilience: Performance under pressure, adaptability, emotional control

IMPORTANT: Use the technical correctness evaluation data to inform your technical scores. The technical evaluation provides objective assessment of answer accuracy and conceptual understanding.

Consider the emotion analysis data when evaluating communication skills, stress management, and cultural fit.
Consider the technical evaluation data when assessing technical competency and knowledge depth.

Provide your analysis in JSON format with the following structure:
{
  "technicalScore": <0-100>, // Weight technical correctness evaluation heavily
  "communicationScore": <0-100>,
  "problemSolvingScore": <0-100>,
  "emotionalIntelligenceScore": <0-100>,
  "stressResilienceScore": <0-100>,
  "leadershipPotentialScore": <0-100>,
  "strengths": ["strength1", "strength2", ...],
  "improvements": ["area1", "area2", ...],
  "detailedAnalysis": "comprehensive analysis text incorporating both emotion and technical data",
  "emotionalInsights": "analysis of emotional patterns and their impact on performance",
  "technicalInsights": "analysis of technical competency based on correctness evaluation",
  "questionAnalysis": [
    {
      "question": "question text",
      "response": "candidate response",
      "score": <0-100>,
      "feedback": "specific feedback combining technical and soft skills",
      "emotionalState": "emotional state during this response",
      "technicalAccuracy": "assessment of technical correctness",
      "stressIndicators": "stress indicators observed"
    }
  ],
  "personalityAssessment": "assessment of personality traits and work style",
  "culturalFitAnalysis": "analysis of cultural fit based on communication style and values",
  "technicalCompetencyAnalysis": "analysis of technical skills and knowledge depth"
}`;

  const userPrompt = `Job Role: ${jobRole}

Interview Questions:
${questionsText}

Interview Transcript:
${transcriptText}

${technicalSummary}

${emotionSummary}

Please analyze this interview and provide a comprehensive evaluation that incorporates technical correctness assessment, emotional intelligence analysis, and overall suitability for the role. 

IMPORTANT: Use the technical correctness scores to heavily influence your technical assessment. The technical evaluation provides objective measurement of answer accuracy and conceptual understanding.

Consider how the candidate's emotional state, stress levels, communication patterns, AND technical accuracy impact their overall suitability for the role.`;

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
 * Calculate comprehensive scores combining Groq, custom NLP, emotion, confidence, and technical correctness
 */
function calculateScores(
  groqAnalysis: any, 
  behaviorReport: any, 
  emotionAnalysis: AdvancedEmotionReport,
  confidenceAnalysis: ConfidenceAnalysis,
  technicalEvaluation: TechnicalEvaluation
): EvaluationScores {
  // Technical score: Heavily weight technical correctness (70%) + Groq assessment (30%)
  const technical = Math.round(
    technicalEvaluation.overallTechnicalScore * 0.7 +
    (groqAnalysis.technicalScore || 0) * 0.3
  );
  
  // Enhanced communication score incorporating emotion and confidence analysis
  const communication = Math.round(
    (groqAnalysis.communicationScore || 0) * 0.3 +
    behaviorReport.behavior.communicationClarity * 0.15 +
    behaviorReport.language.fluency * 0.1 +
    emotionAnalysis.communicationEffectiveness * 0.2 +
    confidenceAnalysis.metrics.communicationConfidence * 0.25
  );
  
  // Enhanced problem solving incorporating stress resilience and confidence
  const problemSolving = Math.round(
    (groqAnalysis.problemSolvingScore || 0) * 0.5 +
    (100 - emotionAnalysis.stress.overallStress) * 0.25 +
    confidenceAnalysis.metrics.overallConfidence * 0.25
  );

  // New technical correctness metrics
  const technicalCorrectness = Math.round(technicalEvaluation.overallTechnicalScore);
  const conceptualUnderstanding = Math.round(technicalEvaluation.conceptualAccuracy);
  const practicalApplication = Math.round(technicalEvaluation.practicalKnowledge);

  // Calculate overall score with technical correctness as major factor
  const overall = Math.round(
    technical * 0.35 + // Increased weight for technical
    communication * 0.20 +
    problemSolving * 0.20 +
    emotionAnalysis.overallWellbeing * 0.10 +
    confidenceAnalysis.metrics.overallConfidence * 0.10 +
    technicalCorrectness * 0.05 // Additional technical correctness factor
  );

  return {
    technical: Math.min(100, Math.max(0, technical)),
    communication: Math.min(100, Math.max(0, communication)),
    problemSolving: Math.min(100, Math.max(0, problemSolving)),
    overall: Math.min(100, Math.max(0, overall)),
    technicalCorrectness: Math.min(100, Math.max(0, technicalCorrectness)),
    conceptualUnderstanding: Math.min(100, Math.max(0, conceptualUnderstanding)),
    practicalApplication: Math.min(100, Math.max(0, practicalApplication)),
  };
}

/**
 * Generate detailed feedback combining all analysis sources including technical correctness
 */
function generateFeedback(
  groqAnalysis: any,
  behaviorReport: any,
  questions: string[],
  responses: string[],
  emotionAnalysis: AdvancedEmotionReport,
  confidenceAnalysis: ConfidenceAnalysis,
  technicalEvaluation: TechnicalEvaluation
): EvaluationFeedback {
  // Combine strengths from all sources
  const strengths = [
    ...(groqAnalysis.strengths || []),
    ...technicalEvaluation.technicalStrengths,
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
  
  // Add emotion-based strengths
  if (emotionAnalysis.emotionalStability >= 75) {
    strengths.push('Excellent emotional stability and composure');
  }
  if (emotionAnalysis.communication.enthusiasm >= 70) {
    strengths.push('Shows genuine enthusiasm and passion');
  }
  if (emotionAnalysis.psychology.selfAwareness >= 75) {
    strengths.push('High emotional intelligence and self-awareness');
  }
  if (emotionAnalysis.stress.overallStress <= 30) {
    strengths.push('Excellent stress management and resilience');
  }

  // Add confidence-based strengths
  if (confidenceAnalysis.metrics.overallConfidence >= 75) {
    strengths.push('Demonstrates strong overall confidence throughout interview');
  }
  if (confidenceAnalysis.metrics.confidenceTrend === 'increasing') {
    strengths.push('Shows growing confidence as interview progressed');
  }
  if (confidenceAnalysis.metrics.confidenceRecovery >= 70) {
    strengths.push('Excellent ability to recover confidence after challenging questions');
  }
  if (confidenceAnalysis.metrics.technicalConfidence >= 70) {
    strengths.push('Strong confidence in technical discussions');
  }

  // Add technical correctness strengths
  if (technicalEvaluation.overallTechnicalScore >= 80) {
    strengths.push('Demonstrates strong technical knowledge and accuracy');
  }
  if (technicalEvaluation.conceptualAccuracy >= 75) {
    strengths.push('Shows solid understanding of fundamental concepts');
  }
  if (technicalEvaluation.practicalKnowledge >= 75) {
    strengths.push('Good practical application of technical knowledge');
  }

  // Combine improvement areas from all sources
  const improvements = [
    ...(groqAnalysis.improvements || []),
    ...behaviorReport.recommendedActions,
    ...emotionAnalysis.emotionalRecommendations,
    ...emotionAnalysis.communicationImprovements,
    ...emotionAnalysis.stressManagement,
    ...confidenceAnalysis.insights.recommendations,
    ...technicalEvaluation.technicalWeaknesses,
    ...technicalEvaluation.recommendations,
  ];

  // Generate comprehensive detailed analysis
  const detailedAnalysis = `
${groqAnalysis.detailedAnalysis || 'No detailed analysis available.'}

${groqAnalysis.emotionalInsights || ''}

${groqAnalysis.technicalInsights || ''}

Technical Correctness Analysis:
Overall Technical Score: ${technicalEvaluation.overallTechnicalScore}/100
Conceptual Accuracy: ${technicalEvaluation.conceptualAccuracy}/100
Practical Knowledge: ${technicalEvaluation.practicalKnowledge}/100

Technical Strengths: ${technicalEvaluation.technicalStrengths.join(', ')}
Technical Areas for Improvement: ${technicalEvaluation.technicalWeaknesses.join(', ')}
Knowledge Gaps: ${technicalEvaluation.knowledgeGaps.join(', ')}

Advanced Emotion Analysis:
${emotionAnalysis.dominantEmotions.length > 0 ? `Dominant Emotions: ${emotionAnalysis.dominantEmotions.join(', ')}` : ''}
Emotional Stability: ${emotionAnalysis.emotionalStability}/100
Communication Effectiveness: ${emotionAnalysis.communicationEffectiveness}/100
Overall Wellbeing: ${emotionAnalysis.overallWellbeing}/100

Psychological Profile:
Openness: ${emotionAnalysis.psychology.openness}/100
Conscientiousness: ${emotionAnalysis.psychology.conscientiousness}/100
Extraversion: ${emotionAnalysis.psychology.extraversion}/100
Agreeableness: ${emotionAnalysis.psychology.agreeableness}/100
Emotional Intelligence: ${emotionAnalysis.psychology.selfAwareness}/100

Stress Analysis:
Overall Stress Level: ${emotionAnalysis.stress.stressLevel} (${emotionAnalysis.stress.overallStress}/100)
Hesitation: ${emotionAnalysis.stress.hesitation}/100
Anxiety: ${emotionAnalysis.stress.anxiety}/100
Filler Words: ${emotionAnalysis.stress.fillerWords}

Behavioral Analysis:
${behaviorReport.behaviorSummary}

${behaviorReport.emotionalProfile}

Confidence Analysis:
Overall Confidence: ${confidenceAnalysis.metrics.overallConfidence}/100
Confidence Trend: ${confidenceAnalysis.metrics.confidenceTrend}
Confidence Stability: ${100 - confidenceAnalysis.metrics.confidenceVariability}/100
Technical Confidence: ${confidenceAnalysis.metrics.technicalConfidence}/100
Communication Confidence: ${confidenceAnalysis.metrics.communicationConfidence}/100
Confidence Recovery: ${confidenceAnalysis.metrics.confidenceRecovery}/100
Dominant Pattern: ${confidenceAnalysis.insights.dominantPattern}

Communication Quality: ${behaviorReport.behavior.communicationClarity}/100
Language Fluency: ${behaviorReport.language.fluency}/100
Professionalism: ${behaviorReport.behavior.professionalism}/100
  `.trim();

  // Map question responses with technical correctness data
  const questionResponses: QuestionResponse[] = questions.map((question, index) => {
    const groqQA = (groqAnalysis.questionAnalysis || [])[index];
    const techQA = technicalEvaluation.questionAnalysis[index];
    
    return {
      question,
      response: responses[index] || 'No response provided',
      score: techQA ? Math.round((techQA.correctnessScore + (groqQA?.score || 50)) / 2) : (groqQA?.score || 50),
      feedback: `${groqQA?.feedback || 'No feedback available'}\n\nTechnical Assessment: ${techQA?.strengths.join(', ') || 'N/A'}\nAreas for Improvement: ${techQA?.weaknesses.join(', ') || 'N/A'}\nSuggestions: ${techQA?.suggestions.join(', ') || 'N/A'}`,
    };
  });

  return {
    strengths: [...new Set(strengths)], // Remove duplicates
    improvements: [...new Set(improvements)],
    detailedAnalysis,
    questionResponses,
  };
}

/**
 * Determine recommendation level based on scores, emotion, confidence, and technical correctness
 */
function determineRecommendation(
  scores: EvaluationScores, 
  emotionAnalysis: AdvancedEmotionReport,
  confidenceAnalysis: ConfidenceAnalysis,
  technicalEvaluation: TechnicalEvaluation
): 'highly-recommended' | 'recommended' | 'consider' | 'not-recommended' {
  const { overall, technical, communication, problemSolving, technicalCorrectness } = scores;
  
  // Consider emotional, confidence, and technical factors
  const emotionalStability = emotionAnalysis.emotionalStability;
  const stressResilience = 100 - emotionAnalysis.stress.overallStress;
  const wellbeing = emotionAnalysis.overallWellbeing;
  const overallConfidence = confidenceAnalysis.metrics.overallConfidence;
  const technicalAccuracy = technicalEvaluation.overallTechnicalScore;
  
  // Red flags that can downgrade recommendation
  const hasRedFlags = (
    emotionAnalysis.stress.overallStress > 80 ||
    emotionAnalysis.emotionalStability < 30 ||
    emotionAnalysis.overallWellbeing < 40 ||
    confidenceAnalysis.metrics.overallConfidence < 30 ||
    confidenceAnalysis.metrics.confidenceVariability > 50 ||
    technicalAccuracy < 40 // Technical accuracy red flag
  );

  // Technical competency threshold
  const hasTechnicalCompetency = technicalAccuracy >= 60 && technicalCorrectness >= 60;

  // Highly recommended: Overall >= 80, all scores >= 70, good emotional/confidence profile, AND strong technical accuracy
  if (overall >= 80 && technical >= 70 && communication >= 70 && problemSolving >= 70 && 
      emotionalStability >= 60 && stressResilience >= 60 && overallConfidence >= 65 && 
      technicalAccuracy >= 75 && !hasRedFlags) {
    return 'highly-recommended';
  }

  // Recommended: Overall >= 65, no score below 50, acceptable emotional/confidence profile, AND decent technical accuracy
  if (overall >= 65 && technical >= 50 && communication >= 50 && problemSolving >= 50 && 
      emotionalStability >= 40 && overallConfidence >= 50 && hasTechnicalCompetency && !hasRedFlags) {
    return 'recommended';
  }

  // Consider: Overall >= 50, manageable emotional/confidence concerns, AND basic technical competency
  if (overall >= 50 && wellbeing >= 40 && overallConfidence >= 40 && technicalAccuracy >= 50) {
    return 'consider';
  }

  // Not recommended: Overall < 50, significant emotional/confidence concerns, OR poor technical accuracy
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

/**
 * Create comprehensive interview transcript for sharing across dashboards
 */
function createInterviewTranscript(
  messages: Message[],
  questions: string[],
  emotionAnalysis: AdvancedEmotionReport
): {
  fullTranscript: string;
  questionResponses: Array<{
    question: string;
    response: string;
    timestamp?: Date;
    emotionalState?: string;
    stressLevel?: number;
  }>;
} {
  // Create full transcript
  const fullTranscript = messages
    .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
    .join('\n\n');

  // Map questions to responses with emotional context
  const questionResponses = questions.map((question, index) => {
    const response = messages
      .filter(msg => msg.role === 'user')
      [index]?.content || 'No response recorded';
    
    const timestamp = messages
      .filter(msg => msg.role === 'user')
      [index]?.timestamp;

    // Get emotional state for this response segment
    const segmentIndex = Math.floor((index / questions.length) * emotionAnalysis.emotionalJourney.length);
    const emotionalSegment = emotionAnalysis.emotionalJourney[segmentIndex];
    const stressSegment = emotionAnalysis.stressProgression[segmentIndex];

    let emotionalState = 'Neutral';
    if (emotionalSegment) {
      const dominantEmotion = Object.entries(emotionalSegment)
        .filter(([key]) => ['joy', 'trust', 'fear', 'surprise', 'sadness', 'anger'].includes(key))
        .sort(([, a], [, b]) => b - a)[0];
      
      if (dominantEmotion && dominantEmotion[1] > 40) {
        emotionalState = dominantEmotion[0].charAt(0).toUpperCase() + dominantEmotion[0].slice(1);
      }
    }

    return {
      question,
      response,
      timestamp,
      emotionalState,
      stressLevel: stressSegment || emotionAnalysis.stress.overallStress
    };
  });

  return {
    fullTranscript,
    questionResponses
  };
}

/**
 * Generate comprehensive insights for dashboard display
 */
function generateComprehensiveInsights(
  emotionAnalysis: AdvancedEmotionReport,
  _groqAnalysis: any,
  _behaviorReport: any,
  confidenceAnalysis: ConfidenceAnalysis
): {
  personalityProfile: string;
  emotionalIntelligence: number;
  communicationStyle: string;
  stressResilience: number;
  culturalFit: number;
  leadershipPotential: number;
  teamworkAbility: number;
} {
  // Generate personality profile description
  const personality = emotionAnalysis.psychology;
  let personalityProfile = '';
  
  if (personality.extraversion >= 70) {
    personalityProfile += 'Highly extraverted and outgoing. ';
  } else if (personality.extraversion <= 30) {
    personalityProfile += 'Introverted and reflective. ';
  } else {
    personalityProfile += 'Balanced between introversion and extraversion. ';
  }
  
  if (personality.conscientiousness >= 70) {
    personalityProfile += 'Very organized and detail-oriented. ';
  }
  
  if (personality.openness >= 70) {
    personalityProfile += 'Highly creative and open to new experiences. ';
  }
  
  if (personality.agreeableness >= 70) {
    personalityProfile += 'Collaborative and team-oriented. ';
  }

  // Calculate emotional intelligence
  const emotionalIntelligence = Math.round(
    (personality.selfAwareness + personality.selfRegulation + 
     personality.empathy + personality.socialSkills) / 4
  );

  // Determine communication style
  let communicationStyle = '';
  const comm = emotionAnalysis.communication;
  
  if (comm.assertiveness >= 70) {
    communicationStyle = 'Direct and assertive communicator';
  } else if (comm.assertiveness <= 30) {
    communicationStyle = 'Gentle and diplomatic communicator';
  } else {
    communicationStyle = 'Balanced and adaptive communicator';
  }
  
  if (comm.enthusiasm >= 70) {
    communicationStyle += ', highly enthusiastic';
  }
  
  if (comm.professionalism >= 80) {
    communicationStyle += ', very professional';
  }

  // Calculate stress resilience
  const stressResilience = Math.round(
    (100 - emotionAnalysis.stress.overallStress + emotionAnalysis.emotionalStability) / 2
  );

  // Calculate cultural fit
  const culturalFit = Math.round(
    (comm.professionalism * 0.3 + 
     personality.agreeableness * 0.25 + 
     emotionalIntelligence * 0.25 + 
     comm.engagement * 0.2) / 1
  );

  // Calculate leadership potential with confidence factors
  const leadershipPotential = Math.round(
    (comm.confidence * 0.2 + 
     comm.assertiveness * 0.2 + 
     personality.extraversion * 0.15 + 
     emotionalIntelligence * 0.25 +
     confidenceAnalysis.metrics.overallConfidence * 0.2) / 1
  );

  // Calculate teamwork ability
  const teamworkAbility = Math.round(
    (personality.agreeableness * 0.3 + 
     comm.engagement * 0.25 + 
     emotionalIntelligence * 0.25 + 
     comm.listening * 0.2) / 1
  );

  return {
    personalityProfile: personalityProfile.trim(),
    emotionalIntelligence,
    communicationStyle,
    stressResilience,
    culturalFit,
    leadershipPotential,
    teamworkAbility
  };
}


/**
 * Generate comprehensive reports for all stakeholders using advanced NLP analysis
 */
export async function generateComprehensiveReports(
  evaluation: EvaluationReport,
  includeTranscript: boolean = true
): Promise<{
  organizationReport: any;
  collegeReport: any;
  studentReport: any;
}> {
  console.log('📊 Generating comprehensive reports with advanced NLP analysis...');
  
  const reportService = new ReportGenerationService();
  
  const reports = await reportService.generateAllReports(evaluation, includeTranscript);
  
  console.log('✅ Generated all stakeholder reports with advanced insights');
  
  return reports;
}
