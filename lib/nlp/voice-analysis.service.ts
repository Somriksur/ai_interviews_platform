/**
 * Voice Analysis Service
 * Multi-modal intelligence: Analyzes speech behavior patterns
 * Complements text NLP with voice signal analysis
 */

export interface VoiceMetadata {
  speakingRate: number; // words per minute
  pauseFrequency: number; // pauses per minute
  averagePauseDuration: number; // seconds
  volumeVariance: number; // 0-100 (stability)
  responseDelay: number; // seconds (thinking time)
}

export interface VoiceAnalysisResult {
  speechClarity: number; // 0-100
  confidence: number; // 0-100
  hesitation: number; // 0-100 (lower is better)
  emotionalStability: number; // 0-100
  overallVoiceScore: number; // 0-100
  
  // Detailed insights
  insights: {
    speakingPattern: 'fast' | 'moderate' | 'slow';
    confidenceLevel: 'high' | 'medium' | 'low';
    stressIndicators: string[];
    strengths: string[];
    improvements: string[];
  };
  
  // Explanation
  explanation: string;
  confidence: number; // confidence in analysis
}

/**
 * Voice Analysis Service
 * Analyzes speech behavior to complement text-based NLP
 */
export class VoiceAnalysisService {
  
  // Optimal ranges for speech metrics
  private readonly OPTIMAL_SPEAKING_RATE = { min: 120, max: 160 }; // WPM
  private readonly OPTIMAL_PAUSE_FREQUENCY = { min: 8, max: 15 }; // per minute
  private readonly OPTIMAL_PAUSE_DURATION = { min: 0.5, max: 2.0 }; // seconds
  private readonly OPTIMAL_VOLUME_VARIANCE = { min: 20, max: 40 }; // variance score
  private readonly OPTIMAL_RESPONSE_DELAY = { min: 1, max: 3 }; // seconds
  
  /**
   * Analyze voice metadata to extract behavioral insights
   */
  public analyzeVoice(voiceMetadata: VoiceMetadata): VoiceAnalysisResult {
    console.log('🎤 Starting voice analysis...');
    
    // Calculate individual metrics
    const speechClarity = this.calculateSpeechClarity(voiceMetadata);
    const confidence = this.calculateConfidence(voiceMetadata);
    const hesitation = this.calculateHesitation(voiceMetadata);
    const emotionalStability = this.calculateEmotionalStability(voiceMetadata);
    
    // Calculate overall voice score
    const overallVoiceScore = Math.round(
      speechClarity * 0.30 +
      confidence * 0.35 +
      (100 - hesitation) * 0.20 +
      emotionalStability * 0.15
    );
    
    // Generate insights
    const insights = this.generateInsights(voiceMetadata, {
      speechClarity,
      confidence,
      hesitation,
      emotionalStability
    });
    
    // Generate explanation
    const explanation = this.generateExplanation(overallVoiceScore, insights);
    
    // Calculate analysis confidence
    const analysisConfidence = this.calculateAnalysisConfidence(voiceMetadata);
    
    console.log(`✅ Voice analysis completed: ${overallVoiceScore}/100`);
    
    return {
      speechClarity,
      confidence,
      hesitation,
      emotionalStability,
      overallVoiceScore,
      insights,
      explanation,
      confidence: analysisConfidence
    };
  }
  
  /**
   * Calculate speech clarity score
   * Based on speaking rate and volume stability
   */
  private calculateSpeechClarity(metadata: VoiceMetadata): number {
    let clarity = 50; // Base score
    
    // Speaking rate factor
    const { speakingRate } = metadata;
    if (speakingRate >= this.OPTIMAL_SPEAKING_RATE.min && 
        speakingRate <= this.OPTIMAL_SPEAKING_RATE.max) {
      clarity += 25; // Optimal rate
    } else if (speakingRate < this.OPTIMAL_SPEAKING_RATE.min) {
      // Too slow
      const slownessPenalty = (this.OPTIMAL_SPEAKING_RATE.min - speakingRate) / 2;
      clarity -= Math.min(slownessPenalty, 20);
    } else {
      // Too fast
      const fastnessPenalty = (speakingRate - this.OPTIMAL_SPEAKING_RATE.max) / 3;
      clarity -= Math.min(fastnessPenalty, 15);
    }
    
    // Volume variance factor (stability)
    const { volumeVariance } = metadata;
    if (volumeVariance >= this.OPTIMAL_VOLUME_VARIANCE.min && 
        volumeVariance <= this.OPTIMAL_VOLUME_VARIANCE.max) {
      clarity += 25; // Stable volume
    } else if (volumeVariance < this.OPTIMAL_VOLUME_VARIANCE.min) {
      clarity += 10; // Too monotone but acceptable
    } else {
      // Too variable
      const variancePenalty = (volumeVariance - this.OPTIMAL_VOLUME_VARIANCE.max) / 2;
      clarity -= Math.min(variancePenalty, 20);
    }
    
    return Math.round(Math.max(0, Math.min(100, clarity)));
  }
  
  /**
   * Calculate confidence score
   * Based on speaking rate, pauses, and response delay
   */
  private calculateConfidence(metadata: VoiceMetadata): number {
    let confidence = 50; // Base score
    
    // Speaking rate confidence
    const { speakingRate } = metadata;
    if (speakingRate >= 130 && speakingRate <= 170) {
      confidence += 20; // Confident pace
    } else if (speakingRate < 100) {
      confidence -= 15; // Too slow indicates uncertainty
    }
    
    // Pause frequency
    const { pauseFrequency } = metadata;
    if (pauseFrequency <= this.OPTIMAL_PAUSE_FREQUENCY.max) {
      confidence += 15; // Fewer pauses = more confident
    } else {
      const pausePenalty = (pauseFrequency - this.OPTIMAL_PAUSE_FREQUENCY.max) * 2;
      confidence -= Math.min(pausePenalty, 25);
    }
    
    // Response delay (thinking time)
    const { responseDelay } = metadata;
    if (responseDelay <= this.OPTIMAL_RESPONSE_DELAY.max) {
      confidence += 15; // Quick responses
    } else {
      const delayPenalty = (responseDelay - this.OPTIMAL_RESPONSE_DELAY.max) * 5;
      confidence -= Math.min(delayPenalty, 20);
    }
    
    return Math.round(Math.max(0, Math.min(100, confidence)));
  }
  
  /**
   * Calculate hesitation score
   * Higher score = more hesitation (worse)
   */
  private calculateHesitation(metadata: VoiceMetadata): number {
    let hesitation = 0; // Start with no hesitation
    
    // Pause frequency contribution
    const { pauseFrequency } = metadata;
    if (pauseFrequency > this.OPTIMAL_PAUSE_FREQUENCY.max) {
      hesitation += (pauseFrequency - this.OPTIMAL_PAUSE_FREQUENCY.max) * 3;
    }
    
    // Pause duration contribution
    const { averagePauseDuration } = metadata;
    if (averagePauseDuration > this.OPTIMAL_PAUSE_DURATION.max) {
      hesitation += (averagePauseDuration - this.OPTIMAL_PAUSE_DURATION.max) * 10;
    }
    
    // Response delay contribution
    const { responseDelay } = metadata;
    if (responseDelay > this.OPTIMAL_RESPONSE_DELAY.max) {
      hesitation += (responseDelay - this.OPTIMAL_RESPONSE_DELAY.max) * 8;
    }
    
    // Slow speaking rate can indicate hesitation
    const { speakingRate } = metadata;
    if (speakingRate < 100) {
      hesitation += (100 - speakingRate) / 2;
    }
    
    return Math.round(Math.max(0, Math.min(100, hesitation)));
  }
  
  /**
   * Calculate emotional stability
   * Based on volume variance and speaking consistency
   */
  private calculateEmotionalStability(metadata: VoiceMetadata): number {
    let stability = 70; // Base score
    
    // Volume variance (lower variance = more stable)
    const { volumeVariance } = metadata;
    if (volumeVariance <= this.OPTIMAL_VOLUME_VARIANCE.max) {
      stability += 20; // Stable volume
    } else {
      const variancePenalty = (volumeVariance - this.OPTIMAL_VOLUME_VARIANCE.max) / 2;
      stability -= Math.min(variancePenalty, 30);
    }
    
    // Speaking rate consistency (not too fast or slow)
    const { speakingRate } = metadata;
    if (speakingRate >= this.OPTIMAL_SPEAKING_RATE.min && 
        speakingRate <= this.OPTIMAL_SPEAKING_RATE.max) {
      stability += 10; // Consistent pace
    }
    
    return Math.round(Math.max(0, Math.min(100, stability)));
  }
  
  /**
   * Generate behavioral insights from voice analysis
   */
  private generateInsights(
    metadata: VoiceMetadata,
    scores: { speechClarity: number; confidence: number; hesitation: number; emotionalStability: number }
  ): {
    speakingPattern: 'fast' | 'moderate' | 'slow';
    confidenceLevel: 'high' | 'medium' | 'low';
    stressIndicators: string[];
    strengths: string[];
    improvements: string[];
  } {
    const { speakingRate, pauseFrequency, averagePauseDuration, volumeVariance, responseDelay } = metadata;
    const { speechClarity, confidence, hesitation, emotionalStability } = scores;
    
    // Determine speaking pattern
    let speakingPattern: 'fast' | 'moderate' | 'slow';
    if (speakingRate > 160) speakingPattern = 'fast';
    else if (speakingRate < 120) speakingPattern = 'slow';
    else speakingPattern = 'moderate';
    
    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low';
    if (confidence >= 70) confidenceLevel = 'high';
    else if (confidence >= 50) confidenceLevel = 'medium';
    else confidenceLevel = 'low';
    
    // Identify stress indicators
    const stressIndicators: string[] = [];
    if (pauseFrequency > 20) stressIndicators.push('Frequent pauses detected');
    if (averagePauseDuration > 3) stressIndicators.push('Long pauses indicating uncertainty');
    if (volumeVariance > 60) stressIndicators.push('Unstable voice volume');
    if (responseDelay > 5) stressIndicators.push('Delayed responses');
    if (speakingRate > 180) stressIndicators.push('Speaking too fast (possible nervousness)');
    
    // Identify strengths
    const strengths: string[] = [];
    if (speechClarity >= 75) strengths.push('Clear and articulate speech');
    if (confidence >= 70) strengths.push('Confident speaking style');
    if (hesitation <= 30) strengths.push('Minimal hesitation');
    if (emotionalStability >= 75) strengths.push('Emotionally stable delivery');
    if (speakingPattern === 'moderate') strengths.push('Well-paced speaking rate');
    
    // Identify improvements
    const improvements: string[] = [];
    if (speechClarity < 60) improvements.push('Work on speech clarity and articulation');
    if (confidence < 60) improvements.push('Build confidence through practice');
    if (hesitation > 50) improvements.push('Reduce pauses and hesitations');
    if (emotionalStability < 60) improvements.push('Practice stress management techniques');
    if (speakingPattern === 'fast') improvements.push('Slow down speaking pace for better clarity');
    if (speakingPattern === 'slow') improvements.push('Increase speaking pace to show confidence');
    
    return {
      speakingPattern,
      confidenceLevel,
      stressIndicators,
      strengths,
      improvements
    };
  }
  
  /**
   * Generate human-readable explanation
   */
  private generateExplanation(overallScore: number, insights: any): string {
    let explanation = `Voice Analysis Score: ${overallScore}/100. `;
    
    if (overallScore >= 80) {
      explanation += 'Excellent voice presentation with strong confidence and clarity. ';
    } else if (overallScore >= 65) {
      explanation += 'Good voice presentation with room for minor improvements. ';
    } else if (overallScore >= 50) {
      explanation += 'Acceptable voice presentation but needs improvement. ';
    } else {
      explanation += 'Voice presentation needs significant improvement. ';
    }
    
    // Add speaking pattern
    explanation += `Speaking pattern: ${insights.speakingPattern}. `;
    
    // Add confidence level
    explanation += `Confidence level: ${insights.confidenceLevel}. `;
    
    // Add stress indicators if any
    if (insights.stressIndicators.length > 0) {
      explanation += `Stress indicators: ${insights.stressIndicators.slice(0, 2).join(', ')}. `;
    }
    
    // Add top strength
    if (insights.strengths.length > 0) {
      explanation += `Strength: ${insights.strengths[0]}. `;
    }
    
    // Add top improvement
    if (insights.improvements.length > 0) {
      explanation += `Improvement area: ${insights.improvements[0]}.`;
    }
    
    return explanation.trim();
  }
  
  /**
   * Calculate confidence in the analysis
   */
  private calculateAnalysisConfidence(metadata: VoiceMetadata): number {
    let confidence = 70; // Base confidence
    
    // Higher confidence if metrics are within reasonable ranges
    const { speakingRate, pauseFrequency, volumeVariance } = metadata;
    
    if (speakingRate > 50 && speakingRate < 250) confidence += 10;
    if (pauseFrequency >= 0 && pauseFrequency < 50) confidence += 10;
    if (volumeVariance >= 0 && volumeVariance <= 100) confidence += 10;
    
    return Math.round(Math.min(100, confidence));
  }
  
  /**
   * Combine voice analysis with text NLP for multi-modal score
   */
  public combineWithTextNLP(
    voiceScore: number,
    textNLPScore: number,
    voiceWeight: number = 0.3
  ): {
    multiModalScore: number;
    explanation: string;
  } {
    const textWeight = 1 - voiceWeight;
    const multiModalScore = Math.round(
      voiceScore * voiceWeight + textNLPScore * textWeight
    );
    
    const explanation = `Multi-modal score combines voice analysis (${voiceScore}/100, weight: ${voiceWeight * 100}%) with text NLP (${textNLPScore}/100, weight: ${textWeight * 100}%) for comprehensive evaluation.`;
    
    return {
      multiModalScore,
      explanation
    };
  }
}
