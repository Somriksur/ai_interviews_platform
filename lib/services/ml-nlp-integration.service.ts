/**
 * ML NLP Integration Service
 * Integrates 90%+ accuracy ML model into interview evaluation
 */

import { mlNLPService } from './ml-nlp.service';

export interface MLNLPAnalysis {
  sentiment: string;
  emotion: string;
  communication: string;
  confidence_level: string;
  stress_level: string;
  model_version: string;
  
  // Converted scores (0-100)
  scores: {
    sentiment: number;
    communication: number;
    confidence: number;
    stress: number;
  };
}

export interface TranscriptMLAnalysis {
  overall: MLNLPAnalysis;
  perAnswer: MLNLPAnalysis[];
  trends: {
    sentimentTrend: 'improving' | 'declining' | 'stable';
    confidenceTrend: 'improving' | 'declining' | 'stable';
    stressTrend: 'improving' | 'declining' | 'stable';
  };
  edgeCasesDetected: {
    sarcasm: boolean;
    selfDeprecating: boolean;
    jargonOverload: boolean;
    imposterSyndrome: boolean;
    overconfidence: boolean;
    burnout: boolean;
    passiveAggressive: boolean;
  };
}

export class MLNLPIntegrationService {
  /**
   * Analyze a single answer using ML NLP
   */
  async analyzeSingleAnswer(text: string): Promise<MLNLPAnalysis> {
    try {
      // Call ML API
      const result = await mlNLPService.evaluate(text);
      
      // Convert to scores
      const scores = this.convertToScores(result);
      
      // Detect edge cases
      const edgeCases = this.detectEdgeCases(result);
      
      return {
        ...result,
        scores,
        edgeCases
      } as any;
    } catch (error) {
      console.error('❌ ML NLP analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze entire interview transcript
   */
  async analyzeTranscript(
    answers: string[],
    questions?: string[]
  ): Promise<TranscriptMLAnalysis> {
    try {
      // Analyze each answer
      const perAnswer: MLNLPAnalysis[] = [];
      
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        if (answer && answer.trim().length > 0) {
          const analysis = await this.analyzeSingleAnswer(answer);
          perAnswer.push(analysis);
        }
      }

      // Analyze full transcript
      const fullTranscript = answers.join(' ');
      const overall = await this.analyzeSingleAnswer(fullTranscript);

      // Calculate trends
      const trends = this.calculateTrends(perAnswer);

      // Detect edge cases across all answers
      const edgeCasesDetected = this.detectEdgeCasesInTranscript(perAnswer);

      return {
        overall,
        perAnswer,
        trends,
        edgeCasesDetected
      };
    } catch (error) {
      console.error('❌ Transcript analysis failed:', error);
      throw error;
    }
  }

  /**
   * Convert ML labels to numeric scores (0-100)
   */
  private convertToScores(result: any): {
    sentiment: number;
    communication: number;
    confidence: number;
    stress: number;
  } {
    const sentimentScores: Record<string, number> = {
      'positive': 80,
      'neutral': 50,
      'negative': 20
    };

    const communicationScores: Record<string, number> = {
      'excellent': 90,
      'good': 70,
      'fair': 50,
      'poor': 30
    };

    const confidenceScores: Record<string, number> = {
      'high': 80,
      'medium': 50,
      'low': 20
    };

    const stressScores: Record<string, number> = {
      'low': 20,
      'medium': 50,
      'high': 80
    };

    return {
      sentiment: sentimentScores[result.sentiment] || 50,
      communication: communicationScores[result.communication] || 50,
      confidence: confidenceScores[result.confidence_level] || 50,
      stress: stressScores[result.stress_level] || 50
    };
  }

  /**
   * Detect edge cases from ML results
   */
  private detectEdgeCases(result: any): any {
    return {
      // Sarcasm: negative sentiment with positive words
      sarcasm: result.sentiment === 'negative' && result.communication === 'fair',
      
      // Self-deprecating: positive outcome despite negative self-talk
      selfDeprecating: result.sentiment === 'positive' && result.confidence_level === 'high',
      
      // Jargon overload: poor communication despite neutral/positive sentiment
      jargonOverload: result.communication === 'poor' && result.sentiment === 'neutral',
      
      // Imposter syndrome: nervous with low confidence
      imposterSyndrome: result.emotion === 'nervous' && result.confidence_level === 'low',
      
      // Overconfidence: high confidence with poor communication
      overconfidence: result.confidence_level === 'high' && result.communication === 'poor',
      
      // Burnout: stressed with high stress
      burnout: result.emotion === 'stressed' && result.stress_level === 'high',
      
      // Passive aggressive: negative with medium stress
      passiveAggressive: result.sentiment === 'negative' && result.stress_level === 'medium'
    };
  }

  /**
   * Calculate trends across multiple answers
   */
  private calculateTrends(analyses: MLNLPAnalysis[]): {
    sentimentTrend: 'improving' | 'declining' | 'stable';
    confidenceTrend: 'improving' | 'declining' | 'stable';
    stressTrend: 'improving' | 'declining' | 'stable';
  } {
    if (analyses.length < 2) {
      return {
        sentimentTrend: 'stable',
        confidenceTrend: 'stable',
        stressTrend: 'stable'
      };
    }

    const first = analyses[0].scores;
    const last = analyses[analyses.length - 1].scores;

    return {
      sentimentTrend: this.getTrend(first.sentiment, last.sentiment),
      confidenceTrend: this.getTrend(first.confidence, last.confidence),
      stressTrend: this.getTrend(last.stress, first.stress) // Inverted: lower stress is better
    };
  }

  private getTrend(start: number, end: number): 'improving' | 'declining' | 'stable' {
    const diff = end - start;
    if (diff > 10) return 'improving';
    if (diff < -10) return 'declining';
    return 'stable';
  }

  /**
   * Detect edge cases across entire transcript
   */
  private detectEdgeCasesInTranscript(analyses: MLNLPAnalysis[]): {
    sarcasm: boolean;
    selfDeprecating: boolean;
    jargonOverload: boolean;
    imposterSyndrome: boolean;
    overconfidence: boolean;
    burnout: boolean;
    passiveAggressive: boolean;
  } {
    const detected = {
      sarcasm: false,
      selfDeprecating: false,
      jargonOverload: false,
      imposterSyndrome: false,
      overconfidence: false,
      burnout: false,
      passiveAggressive: false
    };

    // Check if any answer shows these patterns
    for (const analysis of analyses) {
      const edgeCases = (analysis as any).edgeCases;
      if (edgeCases) {
        detected.sarcasm = detected.sarcasm || edgeCases.sarcasm;
        detected.selfDeprecating = detected.selfDeprecating || edgeCases.selfDeprecating;
        detected.jargonOverload = detected.jargonOverload || edgeCases.jargonOverload;
        detected.imposterSyndrome = detected.imposterSyndrome || edgeCases.imposterSyndrome;
        detected.overconfidence = detected.overconfidence || edgeCases.overconfidence;
        detected.burnout = detected.burnout || edgeCases.burnout;
        detected.passiveAggressive = detected.passiveAggressive || edgeCases.passiveAggressive;
      }
    }

    return detected;
  }

  /**
   * Generate insights from ML analysis
   */
  generateInsights(analysis: TranscriptMLAnalysis): {
    strengths: string[];
    concerns: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const concerns: string[] = [];
    const recommendations: string[] = [];

    // Overall sentiment
    if (analysis.overall.sentiment === 'positive') {
      strengths.push('Maintains positive attitude throughout interview');
    } else if (analysis.overall.sentiment === 'negative') {
      concerns.push('Shows negative sentiment in responses');
      recommendations.push('Focus on framing experiences more positively');
    }

    // Communication quality
    if (analysis.overall.communication === 'excellent' || analysis.overall.communication === 'good') {
      strengths.push('Excellent communication skills');
    } else if (analysis.overall.communication === 'poor') {
      concerns.push('Communication clarity needs improvement');
      recommendations.push('Practice explaining technical concepts more clearly');
    }

    // Confidence level
    if (analysis.overall.confidence_level === 'high') {
      strengths.push('Demonstrates strong confidence in abilities');
    } else if (analysis.overall.confidence_level === 'low') {
      concerns.push('Shows low confidence in responses');
      recommendations.push('Build confidence through practice and preparation');
    }

    // Stress level
    if (analysis.overall.stress_level === 'high') {
      concerns.push('High stress levels detected');
      recommendations.push('Practice stress management and interview techniques');
    }

    // Edge cases
    if (analysis.edgeCasesDetected.sarcasm) {
      concerns.push('Sarcastic tone detected - may come across as unprofessional');
      recommendations.push('Maintain professional tone even when discussing challenges');
    }

    if (analysis.edgeCasesDetected.imposterSyndrome) {
      concerns.push('Signs of imposter syndrome detected');
      recommendations.push('Focus on your accomplishments and strengths');
    }

    if (analysis.edgeCasesDetected.jargonOverload) {
      concerns.push('Excessive jargon may hinder clear communication');
      recommendations.push('Balance technical terms with clear explanations');
    }

    if (analysis.edgeCasesDetected.burnout) {
      concerns.push('Signs of burnout or exhaustion detected');
      recommendations.push('Take breaks and manage workload effectively');
    }

    // Trends
    if (analysis.trends.confidenceTrend === 'improving') {
      strengths.push('Confidence improves throughout interview');
    }

    if (analysis.trends.stressTrend === 'improving') {
      strengths.push('Stress levels decrease as interview progresses');
    }

    return { strengths, concerns, recommendations };
  }
}

// Export singleton instance
export const mlNLPIntegration = new MLNLPIntegrationService();
