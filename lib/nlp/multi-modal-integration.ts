/**
 * Multi-Modal Integration
 * Combines text NLP with voice analysis for comprehensive evaluation
 */

import { VoiceAnalysisService, VoiceMetadata } from './voice-analysis.service';

export interface MultiModalEvaluationInput {
  // Text NLP data
  transcript: string[];
  textNLPScores: {
    technical: number;
    communication: number;
    problemSolving: number;
    overall: number;
  };
  
  // Voice metadata (from interview session)
  voiceMetadata?: VoiceMetadata;
}

export interface MultiModalEvaluationResult {
  // Enhanced scores combining text + voice
  enhancedScores: {
    technical: number;
    communication: number; // Enhanced with voice confidence
    problemSolving: number;
    overall: number;
    multiModalScore: number;
  };
  
  // Voice analysis results
  voiceAnalysis?: {
    speechClarity: number;
    confidence: number;
    hesitation: number;
    emotionalStability: number;
    overallVoiceScore: number;
    insights: any;
    explanation: string;
  };
  
  // Integration insights
  integrationInsights: {
    voiceTextAlignment: number; // 0-100 (how well voice matches text)
    confidenceConsistency: number; // 0-100
    overallPresentation: number; // 0-100
    recommendations: string[];
  };
}

/**
 * Integrate voice analysis with text NLP for multi-modal evaluation
 */
export async function integrateMultiModalEvaluation(
  input: MultiModalEvaluationInput
): Promise<MultiModalEvaluationResult> {
  console.log('🎯 Starting multi-modal integration...');
  
  const { textNLPScores, voiceMetadata } = input;
  
  // If no voice metadata, return text-only scores
  if (!voiceMetadata) {
    return {
      enhancedScores: {
        ...textNLPScores,
        multiModalScore: textNLPScores.overall
      },
      integrationInsights: {
        voiceTextAlignment: 0,
        confidenceConsistency: 0,
        overallPresentation: textNLPScores.overall,
        recommendations: ['Voice analysis not available for this interview']
      }
    };
  }
  
  // Perform voice analysis
  const voiceService = new VoiceAnalysisService();
  const voiceAnalysis = voiceService.analyzeVoice(voiceMetadata);
  
  // Enhance communication score with voice confidence
  const enhancedCommunication = Math.round(
    textNLPScores.communication * 0.6 + // Text NLP weight
    voiceAnalysis.confidence * 0.2 +     // Voice confidence
    voiceAnalysis.speechClarity * 0.2    // Speech clarity
  );
  
  // Calculate multi-modal score
  const multiModalScore = Math.round(
    textNLPScores.technical * 0.35 +
    enhancedCommunication * 0.25 +
    textNLPScores.problemSolving * 0.20 +
    voiceAnalysis.overallVoiceScore * 0.20
  );
  
  // Calculate voice-text alignment
  const voiceTextAlignment = calculateVoiceTextAlignment(
    textNLPScores.communication,
    voiceAnalysis.confidence
  );
  
  // Calculate confidence consistency
  const confidenceConsistency = calculateConfidenceConsistency(
    textNLPScores,
    voiceAnalysis
  );
  
  // Calculate overall presentation
  const overallPresentation = Math.round(
    (enhancedCommunication + voiceAnalysis.overallVoiceScore) / 2
  );
  
  // Generate integration recommendations
  const recommendations = generateIntegrationRecommendations(
    textNLPScores,
    voiceAnalysis,
    voiceTextAlignment,
    confidenceConsistency
  );
  
  console.log('✅ Multi-modal integration completed');
  
  return {
    enhancedScores: {
      technical: textNLPScores.technical,
      communication: enhancedCommunication,
      problemSolving: textNLPScores.problemSolving,
      overall: Math.round((textNLPScores.overall + multiModalScore) / 2),
      multiModalScore
    },
    voiceAnalysis: {
      speechClarity: voiceAnalysis.speechClarity,
      confidence: voiceAnalysis.confidence,
      hesitation: voiceAnalysis.hesitation,
      emotionalStability: voiceAnalysis.emotionalStability,
      overallVoiceScore: voiceAnalysis.overallVoiceScore,
      insights: voiceAnalysis.insights,
      explanation: voiceAnalysis.explanation
    },
    integrationInsights: {
      voiceTextAlignment,
      confidenceConsistency,
      overallPresentation,
      recommendations
    }
  };
}

/**
 * Calculate how well voice signals align with text content
 */
function calculateVoiceTextAlignment(
  textCommunicationScore: number,
  voiceConfidence: number
): number {
  // High alignment when both are similar
  const difference = Math.abs(textCommunicationScore - voiceConfidence);
  const alignment = Math.max(0, 100 - difference);
  
  return Math.round(alignment);
}

/**
 * Calculate consistency between text and voice confidence indicators
 */
function calculateConfidenceConsistency(
  textScores: any,
  voiceAnalysis: any
): number {
  // Compare text-based confidence with voice-based confidence
  const textConfidence = (textScores.communication + textScores.overall) / 2;
  const voiceConfidence = voiceAnalysis.confidence;
  
  const difference = Math.abs(textConfidence - voiceConfidence);
  const consistency = Math.max(0, 100 - difference);
  
  return Math.round(consistency);
}

/**
 * Generate recommendations based on multi-modal analysis
 */
function generateIntegrationRecommendations(
  textScores: any,
  voiceAnalysis: any,
  alignment: number,
  consistency: number
): string[] {
  const recommendations: string[] = [];
  
  // Alignment recommendations
  if (alignment < 60) {
    if (textScores.communication > voiceAnalysis.confidence + 20) {
      recommendations.push('Your written responses are strong, but work on vocal confidence to match');
    } else if (voiceAnalysis.confidence > textScores.communication + 20) {
      recommendations.push('Your vocal delivery is confident, focus on improving content quality');
    }
  }
  
  // Voice-specific recommendations
  if (voiceAnalysis.hesitation > 50) {
    recommendations.push('Reduce pauses and hesitations through practice and preparation');
  }
  
  if (voiceAnalysis.speechClarity < 60) {
    recommendations.push('Work on speech clarity and articulation');
  }
  
  if (voiceAnalysis.emotionalStability < 60) {
    recommendations.push('Practice stress management techniques before interviews');
  }
  
  // Consistency recommendations
  if (consistency < 60) {
    recommendations.push('Work on maintaining consistent confidence throughout the interview');
  }
  
  // Positive reinforcement
  if (voiceAnalysis.overallVoiceScore >= 75 && textScores.overall >= 75) {
    recommendations.push('Excellent multi-modal performance! Continue this strong presentation style');
  }
  
  return recommendations.length > 0 
    ? recommendations 
    : ['Continue developing both content quality and presentation skills'];
}

/**
 * Extract voice metadata from interview session
 * This would typically be collected during the interview
 */
export function extractVoiceMetadataFromSession(sessionData: any): VoiceMetadata | undefined {
  // Check if voice metadata exists in session
  if (!sessionData.voiceMetrics) {
    return undefined;
  }
  
  return {
    speakingRate: sessionData.voiceMetrics.speakingRate || 140,
    pauseFrequency: sessionData.voiceMetrics.pauseFrequency || 10,
    averagePauseDuration: sessionData.voiceMetrics.averagePauseDuration || 1.5,
    volumeVariance: sessionData.voiceMetrics.volumeVariance || 30,
    responseDelay: sessionData.voiceMetrics.responseDelay || 2
  };
}
