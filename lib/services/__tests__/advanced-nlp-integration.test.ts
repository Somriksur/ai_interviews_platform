/**
 * Advanced NLP Integration Tests
 * Tests the complete integration of all advanced NLP components
 */

import { evaluateInterview, generateComprehensiveReports } from '../nlp-evaluation.service';
import { AdvancedEmotionDetector } from '../../nlp/advanced-emotion-detection';
import { RealTimeConfidenceTracker } from '../../nlp/real-time-confidence-tracker';
import { IndustrySpecificEvaluator } from '../../nlp/industry-specific-evaluator';
import { ReportGenerationService } from '../report-generation.service';

// Mock Groq API
jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                technicalScore: 75,
                communicationScore: 80,
                problemSolvingScore: 70,
                emotionalIntelligenceScore: 85,
                stressResilienceScore: 75,
                leadershipPotentialScore: 70,
                strengths: ['Strong technical knowledge', 'Excellent communication'],
                improvements: ['Practice under pressure', 'Expand domain knowledge'],
                detailedAnalysis: 'Comprehensive analysis of candidate performance',
                emotionalInsights: 'Shows good emotional control and awareness',
                questionAnalysis: [
                  {
                    question: 'Tell me about yourself',
                    response: 'I am a software engineer with 3 years of experience',
                    score: 80,
                    feedback: 'Good introduction with relevant experience',
                    emotionalState: 'Confident',
                    stressIndicators: 'Low stress levels'
                  }
                ],
                personalityAssessment: 'Balanced personality with strong technical focus',
                culturalFitAnalysis: 'Good alignment with team-oriented culture'
              })
            }
          }]
        })
      }
    }
  }));
});

// Mock behavior analysis
jest.mock('../../nlp/sentiment-behavior-analysis', () => ({
  generateComprehensiveBehaviorReport: jest.fn().mockReturnValue({
    behavior: {
      communicationClarity: 75,
      professionalism: 80,
      engagement: 70
    },
    language: {
      fluency: 85
    },
    sentiment: {
      emotions: {
        confidence: 75
      }
    },
    recommendedActions: ['Practice technical presentations'],
    behaviorSummary: 'Professional and engaged candidate',
    emotionalProfile: 'Stable emotional responses throughout interview'
  })
}));

describe('Advanced NLP Integration', () => {
  const mockInput = {
    transcript: [
      { role: 'assistant' as const, content: 'Tell me about yourself', timestamp: new Date() },
      { role: 'user' as const, content: 'I am a software engineer with 3 years of experience in full-stack development. I have worked with React, Node.js, and Python. I am passionate about creating efficient and scalable solutions.', timestamp: new Date() },
      { role: 'assistant' as const, content: 'What is your experience with algorithms?', timestamp: new Date() },
      { role: 'user' as const, content: 'I have solid experience with data structures and algorithms. I regularly practice on LeetCode and have implemented various sorting and searching algorithms in my projects.', timestamp: new Date() }
    ],
    questions: [
      'Tell me about yourself',
      'What is your experience with algorithms?'
    ],
    jobRole: 'Software Engineer',
    studentId: 'test-student-123',
    driveId: 'test-drive-456',
    sessionId: 'test-session-789',
    targetIndustry: 'technology',
    experienceLevel: 'mid' as const
  };

  beforeEach(() => {
    // Set up environment variable for Groq API
    process.env.GROQ_API_KEY = 'test-api-key';
  });

  describe('Core NLP Components', () => {
    test('AdvancedEmotionDetector analyzes emotions correctly', () => {
      const detector = new AdvancedEmotionDetector();
      const responses = ['I am confident in my abilities', 'I feel excited about this opportunity'];
      
      const analysis = detector.analyzeEmotions(responses);
      
      expect(analysis).toBeDefined();
      expect(analysis.emotions).toBeDefined();
      expect(analysis.psychology).toBeDefined();
      expect(analysis.communication).toBeDefined();
      expect(analysis.stress).toBeDefined();
      expect(analysis.dominantEmotions).toBeInstanceOf(Array);
      expect(analysis.emotionalStability).toBeGreaterThanOrEqual(0);
      expect(analysis.emotionalStability).toBeLessThanOrEqual(100);
    });

    test('RealTimeConfidenceTracker tracks confidence correctly', () => {
      const tracker = new RealTimeConfidenceTracker();
      const responses = ['I am confident in my technical skills', 'I have experience with these technologies'];
      const questions = ['Tell me about your skills', 'What technologies do you know?'];
      
      const analysis = tracker.trackConfidence(responses, questions);
      
      expect(analysis).toBeDefined();
      expect(analysis.metrics).toBeDefined();
      expect(analysis.insights).toBeDefined();
      expect(analysis.predictions).toBeDefined();
      expect(analysis.metrics.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(analysis.metrics.overallConfidence).toBeLessThanOrEqual(100);
    });

    test('IndustrySpecificEvaluator evaluates for technology industry', () => {
      const evaluator = new IndustrySpecificEvaluator();
      const responses = ['I have experience with React and Node.js', 'I enjoy solving complex algorithms'];
      const questions = ['What technologies do you know?', 'How do you approach problem solving?'];
      
      const evaluation = evaluator.evaluateForIndustry(
        responses, 
        questions, 
        'technology', 
        'Software Engineer', 
        'mid'
      );
      
      expect(evaluation).toBeDefined();
      expect(evaluation.primaryIndustry).toBe('technology');
      expect(evaluation.roleSpecificAnalysis).toBeDefined();
      expect(evaluation.crossIndustryComparison).toBeDefined();
      expect(evaluation.marketDemandAnalysis).toBeDefined();
      expect(evaluation.recommendations).toBeDefined();
    });

    test('ReportGenerationService generates comprehensive reports', async () => {
      const service = new ReportGenerationService();
      
      // Mock evaluation report
      const mockEvaluation = {
        studentId: 'test-student',
        driveId: 'test-drive',
        sessionId: 'test-session',
        scores: { technical: 75, communication: 80, problemSolving: 70, overall: 75 },
        feedback: {
          strengths: ['Strong technical skills'],
          improvements: ['Practice presentations'],
          detailedAnalysis: 'Good overall performance',
          questionResponses: []
        },
        recommendation: 'recommended' as const,
        emotionAnalysis: {
          emotions: { joy: 60, trust: 70, fear: 20, surprise: 30, sadness: 10, disgust: 5, anger: 5, anticipation: 50, optimism: 55, love: 65, submission: 35, awe: 25, disappointment: 15, remorse: 7, contempt: 3, aggressiveness: 15 },
          psychology: { openness: 70, conscientiousness: 75, extraversion: 60, agreeableness: 80, neuroticism: 30, selfAwareness: 75, selfRegulation: 70, motivation: 80, empathy: 75, socialSkills: 70, analyticalThinking: 80, creativity: 70, problemSolving: 75, decisionMaking: 70, adaptability: 75 },
          communication: { articulation: 75, vocabulary: 80, grammar: 85, fluency: 80, coherence: 75, confidence: 70, assertiveness: 65, enthusiasm: 75, professionalism: 80, authenticity: 75, responsiveness: 80, engagement: 75, listening: 70, clarification: 65, storytelling: 60 },
          stress: { hesitation: 25, repetition: 20, fillerWords: 3, incompleteThoughts: 1, complexityReduction: 30, responseTime: 5, errorRate: 10, anxiety: 25, frustration: 15, overwhelm: 20, overallStress: 25, stressLevel: 'low' as const },
          emotionalJourney: [],
          stressProgression: [],
          dominantEmotions: ['trust', 'joy'],
          emotionalStability: 75,
          communicationEffectiveness: 80,
          overallWellbeing: 75,
          emotionalRecommendations: [],
          communicationImprovements: [],
          stressManagement: [],
          analysisDepth: 'expert' as const,
          confidenceScore: 85,
          processingTime: 1500
        },
        confidenceAnalysis: {
          metrics: {
            verbalConfidence: 75,
            linguisticConfidence: 80,
            responseConfidence: 75,
            overallConfidence: 77,
            confidenceVariability: 15,
            confidenceTrend: 'stable' as const,
            confidenceRecovery: 80,
            confidenceProgression: [75, 80, 75],
            peakConfidenceMoments: [1],
            lowConfidenceMoments: [],
            technicalConfidence: 80,
            behavioralConfidence: 75,
            communicationConfidence: 78,
            confidenceBoosts: ['Technical expertise'],
            confidenceDrops: []
          },
          insights: {
            dominantPattern: 'Stable confidence throughout',
            strengthAreas: ['Technical confidence'],
            improvementAreas: [],
            recommendations: ['Continue building on strengths']
          },
          predictions: {
            futurePerformance: 80,
            stressResilience: 75,
            adaptability: 78
          }
        },
        transcript: {
          fullTranscript: 'Mock transcript',
          questionResponses: []
        },
        insights: {
          personalityProfile: 'Balanced professional',
          emotionalIntelligence: 75,
          communicationStyle: 'Professional and clear',
          stressResilience: 75,
          culturalFit: 80,
          leadershipPotential: 70,
          teamworkAbility: 80
        },
        aiMetadata: {
          groqModel: 'test-model',
          nlpVersion: '3.0.0',
          evaluatedAt: new Date(),
          processingTime: 1500,
          analysisDepth: 'expert' as const,
          confidenceScore: 85
        }
      };
      
      const report = await service.generateReport(mockEvaluation, 'organization', true);
      
      expect(report).toBeDefined();
      expect(report.targetAudience).toBe('organization');
      expect(report.sections).toBeInstanceOf(Array);
      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.formats.html).toBeDefined();
      expect(report.formats.json).toBeDefined();
    });
  });

  describe('Complete Integration', () => {
    test('evaluateInterview integrates all components successfully', async () => {
      const result = await evaluateInterview(mockInput);
      
      expect(result).toBeDefined();
      expect(result.studentId).toBe(mockInput.studentId);
      expect(result.driveId).toBe(mockInput.driveId);
      expect(result.sessionId).toBe(mockInput.sessionId);
      
      // Check core evaluation components
      expect(result.scores).toBeDefined();
      expect(result.scores.technical).toBeGreaterThanOrEqual(0);
      expect(result.scores.communication).toBeGreaterThanOrEqual(0);
      expect(result.scores.problemSolving).toBeGreaterThanOrEqual(0);
      expect(result.scores.overall).toBeGreaterThanOrEqual(0);
      
      expect(result.feedback).toBeDefined();
      expect(result.feedback.strengths).toBeInstanceOf(Array);
      expect(result.feedback.improvements).toBeInstanceOf(Array);
      
      expect(result.recommendation).toMatch(/highly-recommended|recommended|consider|not-recommended/);
      
      // Check advanced NLP components
      expect(result.emotionAnalysis).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
      expect(result.industryEvaluation).toBeDefined();
      
      expect(result.transcript).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.aiMetadata).toBeDefined();
      expect(result.aiMetadata.nlpVersion).toBe('3.0.0');
    });

    test('generateComprehensiveReports creates all stakeholder reports', async () => {
      const mockEvaluation = await evaluateInterview(mockInput);
      const reports = await generateComprehensiveReports(mockEvaluation, true);
      
      expect(reports).toBeDefined();
      expect(reports.organizationReport).toBeDefined();
      expect(reports.collegeReport).toBeDefined();
      expect(reports.studentReport).toBeDefined();
      
      expect(reports.organizationReport.targetAudience).toBe('organization');
      expect(reports.collegeReport.targetAudience).toBe('college');
      expect(reports.studentReport.targetAudience).toBe('student');
    });
  });

  describe('Error Handling', () => {
    test('handles missing optional parameters gracefully', async () => {
      const inputWithoutIndustry = {
        ...mockInput,
        targetIndustry: undefined,
        experienceLevel: undefined
      };
      
      const result = await evaluateInterview(inputWithoutIndustry);
      
      expect(result).toBeDefined();
      expect(result.industryEvaluation).toBeUndefined();
      expect(result.emotionAnalysis).toBeDefined();
      expect(result.confidenceAnalysis).toBeDefined();
    });

    test('handles empty transcript gracefully', async () => {
      const inputWithEmptyTranscript = {
        ...mockInput,
        transcript: []
      };
      
      await expect(evaluateInterview(inputWithEmptyTranscript)).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    test('completes evaluation within reasonable time', async () => {
      const startTime = Date.now();
      const result = await evaluateInterview(mockInput);
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.aiMetadata.processingTime).toBeGreaterThan(0);
    });
  });
});