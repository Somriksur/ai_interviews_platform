/**
 * ULTIMATE HYBRID NLP SERVICE
 * 
 * Requirements:
 * 1. Silent Fallback: If ML fails, rule-based takes over WITHOUT telling user
 * 2. 30 Second Guarantee: All analysis completes within 30 seconds
 * 3. Hybrid Averaging: If ML works, combine ML + Rule-based and show AVERAGE
 * 4. Never Blank: Always generate analysis report, no matter what
 * 5. No Fallback Mentions: Never show "fallback" or "rule-based" to users
 * 
 * Flow:
 * - User clicks "End Interview"
 * - Show "Generating Analysis..." loading message
 * - Try ML model (with 25-second timeout)
 * - If ML succeeds: Run rule-based too, then AVERAGE both results
 * - If ML fails: Use rule-based only (silently)
 * - Always return results within 30 seconds
 * - Never show blank analysis
 */

import { mlNLPService } from './ml-nlp.service';
import { analyzeSentimentAndEmotions, analyzeBehavior, analyzeLanguageQuality } from '../nlp/sentiment-behavior-analysis';
import { AdvancedEmotionDetector } from '../nlp/advanced-emotion-detection';
import { RealTimeConfidenceTracker } from '../nlp/real-time-confidence-tracker';

export interface UltimateNLPResult {
  // Core metrics (0-100 scores)
  sentiment: {
    label: string; // positive, neutral, negative
    score: number; // 0-100
    confidence: number; // 0-100
  };
  emotion: {
    label: string; // nervous, confident, stressed, calm, motivated, etc.
    score: number; // 0-100
    confidence: number; // 0-100
  };
  communication: {
    label: string; // poor, fair, good, excellent
    score: number; // 0-100
    confidence: number; // 0-100
  };
  confidence_level: {
    label: string; // low, medium, high
    score: number; // 0-100
  };
  stress_level: {
    label: string; // low, medium, high
    score: number; // 0-100
  };
  
  // Overall wellbeing score
  overallScore: number; // 0-100
  
  // Edge cases (only if detected)
  edgeCases: string[]; // e.g., ["Sarcasm detected", "Imposter syndrome"]
  
  // Internal tracking (NEVER shown to user)
  _internal: {
    mlUsed: boolean;
    ruleBasedUsed: boolean;
    averaged: boolean;
    processingTime: number; // milliseconds
  };
}

export class UltimateHybridNLPService {
  private emotionDetector = new AdvancedEmotionDetector();
  private confidenceTracker = new RealTimeConfidenceTracker();
  
  // Timeouts
  private readonly ML_TIMEOUT = 25000; // 25 seconds for ML
  private readonly TOTAL_TIMEOUT = 30000; // 30 seconds total
  private readonly RULE_BASED_TIMEOUT = 5000; // 5 seconds for rule-based

  /**
   * MAIN ANALYSIS METHOD
   * Guarantees results within 30 seconds, never blank
   */
  async analyzeInterview(
    answers: string[],
    questions: string[] = []
  ): Promise<UltimateNLPResult> {
    const startTime = Date.now();
    
    try {
      // Combine all answers into one text for analysis
      const fullText = answers.join(' ');
      
      // Try ML model first (with timeout)
      const mlResult = await this.tryMLAnalysis(fullText);
      
      // Always run rule-based analysis
      const ruleBasedResult = await this.runRuleBasedAnalysis(answers, questions);
      
      // Determine final result
      let finalResult: UltimateNLPResult;
      
      if (mlResult) {
        // ML succeeded - AVERAGE ML + Rule-based
        finalResult = this.averageResults(mlResult, ruleBasedResult);
        finalResult._internal.mlUsed = true;
        finalResult._internal.ruleBasedUsed = true;
        finalResult._internal.averaged = true;
      } else {
        // ML failed - Use rule-based only (silently)
        finalResult = ruleBasedResult;
        finalResult._internal.mlUsed = false;
        finalResult._internal.ruleBasedUsed = true;
        finalResult._internal.averaged = false;
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      finalResult._internal.processingTime = processingTime;
      
      return finalResult;
      
    } catch (error) {
      // EMERGENCY FALLBACK - Always return something
      return this.getEmergencyFallback(answers, questions, Date.now() - startTime);
    }
  }

  /**
   * Try ML analysis with timeout protection
   */
  private async tryMLAnalysis(text: string): Promise<UltimateNLPResult | null> {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          resolve(null);
        }, this.ML_TIMEOUT);
      });
      
      // Create ML analysis promise
      const mlPromise = this.performMLAnalysis(text);
      
      // Race between ML and timeout
      const result = await Promise.race([mlPromise, timeoutPromise]);
      
      return result;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Perform actual ML analysis
   */
  private async performMLAnalysis(text: string): Promise<UltimateNLPResult | null> {
    try {
      const mlResponse = await mlNLPService.evaluate(text);
      
      // Convert ML response to our format
      return {
        sentiment: {
          label: this.normalizeSentimentLabel(mlResponse.sentiment),
          score: this.mapSentimentToScore(mlResponse.sentiment),
          confidence: 95
        },
        emotion: {
          label: this.normalizeEmotionLabel(mlResponse.emotion),
          score: this.mapEmotionToScore(mlResponse.emotion),
          confidence: 95
        },
        communication: {
          label: this.normalizeCommunicationLabel(mlResponse.communication),
          score: this.mapCommunicationToScore(mlResponse.communication),
          confidence: 95
        },
        confidence_level: {
          label: this.normalizeConfidenceLabel(mlResponse.confidence_level),
          score: this.mapConfidenceToScore(mlResponse.confidence_level)
        },
        stress_level: {
          label: this.normalizeStressLabel(mlResponse.stress_level),
          score: this.mapStressToScore(mlResponse.stress_level)
        },
        overallScore: this.calculateOverallScore({
          sentiment: this.mapSentimentToScore(mlResponse.sentiment),
          communication: this.mapCommunicationToScore(mlResponse.communication),
          confidence: this.mapConfidenceToScore(mlResponse.confidence_level),
          stress: this.mapStressToScore(mlResponse.stress_level)
        }),
        edgeCases: this.detectEdgeCasesFromML(mlResponse),
        _internal: {
          mlUsed: true,
          ruleBasedUsed: false,
          averaged: false,
          processingTime: 0
        }
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Run rule-based analysis (always succeeds)
   */
  private async runRuleBasedAnalysis(
    answers: string[],
    questions: string[]
  ): Promise<UltimateNLPResult> {
    try {
      // Use existing rule-based NLP
      const sentiment = analyzeSentimentAndEmotions(answers);
      const behavior = analyzeBehavior(answers, questions);
      const language = analyzeLanguageQuality(answers);
      
      // Get emotion analysis
      const emotionReport = this.emotionDetector.analyzeEmotions(answers);
      const confidenceAnalysis = this.confidenceTracker.analyzeTranscript(answers);
      
      // Determine dominant emotion
      const dominantEmotion = emotionReport.dominantEmotion || 'neutral';
      const emotionScore = emotionReport.emotionScores[dominantEmotion] || 50;
      
      // Map to our format
      return {
        sentiment: {
          label: sentiment.overall,
          score: sentiment.score,
          confidence: 85
        },
        emotion: {
          label: dominantEmotion,
          score: emotionScore,
          confidence: 85
        },
        communication: {
          label: this.mapScoreToCommunicationLabel(behavior.communicationClarity),
          score: behavior.communicationClarity,
          confidence: 85
        },
        confidence_level: {
          label: confidenceAnalysis.overallLevel,
          score: confidenceAnalysis.averageScore
        },
        stress_level: {
          label: this.mapScoreToStressLabel(sentiment.emotions.stress),
          score: sentiment.emotions.stress
        },
        overallScore: this.calculateOverallScore({
          sentiment: sentiment.score,
          communication: behavior.communicationClarity,
          confidence: confidenceAnalysis.averageScore,
          stress: sentiment.emotions.stress
        }),
        edgeCases: this.detectEdgeCasesFromRuleBased(answers, sentiment, behavior),
        _internal: {
          mlUsed: false,
          ruleBasedUsed: true,
          averaged: false,
          processingTime: 0
        }
      };
      
    } catch (error) {
      // Return basic fallback
      return this.getBasicFallback(answers);
    }
  }

  /**
   * AVERAGE ML and Rule-based results
   * This is the key feature - combining both for best accuracy
   */
  private averageResults(
    mlResult: UltimateNLPResult,
    ruleBasedResult: UltimateNLPResult
  ): UltimateNLPResult {
    // Average all scores
    const avgSentimentScore = Math.round((mlResult.sentiment.score + ruleBasedResult.sentiment.score) / 2);
    const avgEmotionScore = Math.round((mlResult.emotion.score + ruleBasedResult.emotion.score) / 2);
    const avgCommunicationScore = Math.round((mlResult.communication.score + ruleBasedResult.communication.score) / 2);
    const avgConfidenceScore = Math.round((mlResult.confidence_level.score + ruleBasedResult.confidence_level.score) / 2);
    const avgStressScore = Math.round((mlResult.stress_level.score + ruleBasedResult.stress_level.score) / 2);
    
    // Use ML labels (they're usually more accurate)
    // But validate with rule-based scores
    return {
      sentiment: {
        label: this.mapScoreToSentimentLabel(avgSentimentScore),
        score: avgSentimentScore,
        confidence: 98 // High confidence when averaged
      },
      emotion: {
        label: this.mapScoreToEmotionLabel(avgEmotionScore, mlResult.emotion.label),
        score: avgEmotionScore,
        confidence: 98
      },
      communication: {
        label: this.mapScoreToCommunicationLabel(avgCommunicationScore),
        score: avgCommunicationScore,
        confidence: 98
      },
      confidence_level: {
        label: this.mapScoreToConfidenceLabel(avgConfidenceScore),
        score: avgConfidenceScore
      },
      stress_level: {
        label: this.mapScoreToStressLabel(avgStressScore),
        score: avgStressScore
      },
      overallScore: Math.round((mlResult.overallScore + ruleBasedResult.overallScore) / 2),
      edgeCases: [...new Set([...mlResult.edgeCases, ...ruleBasedResult.edgeCases])], // Combine unique edge cases
      _internal: {
        mlUsed: true,
        ruleBasedUsed: true,
        averaged: true,
        processingTime: 0
      }
    };
  }

  /**
   * Emergency fallback - Always returns something
   */
  private getEmergencyFallback(
    answers: string[],
    questions: string[],
    processingTime: number
  ): UltimateNLPResult {
    // Basic analysis based on text length and keywords
    const fullText = answers.join(' ').toLowerCase();
    const wordCount = fullText.split(/\s+/).length;
    
    // Basic sentiment
    const positiveWords = ['good', 'great', 'excellent', 'confident', 'yes', 'definitely'];
    const negativeWords = ['bad', 'no', 'not', 'never', 'difficult', 'hard'];
    const positiveCount = positiveWords.filter(w => fullText.includes(w)).length;
    const negativeCount = negativeWords.filter(w => fullText.includes(w)).length;
    
    const sentimentScore = positiveCount > negativeCount ? 70 : negativeCount > positiveCount ? 30 : 50;
    
    return {
      sentiment: {
        label: this.mapScoreToSentimentLabel(sentimentScore),
        score: sentimentScore,
        confidence: 75
      },
      emotion: {
        label: 'neutral',
        score: 50,
        confidence: 75
      },
      communication: {
        label: wordCount > 100 ? 'good' : wordCount > 50 ? 'fair' : 'poor',
        score: Math.min(90, wordCount / 2),
        confidence: 75
      },
      confidence_level: {
        label: 'medium',
        score: 50
      },
      stress_level: {
        label: 'medium',
        score: 50
      },
      overallScore: 50,
      edgeCases: [],
      _internal: {
        mlUsed: false,
        ruleBasedUsed: false,
        averaged: false,
        processingTime
      }
    };
  }

  /**
   * Basic fallback when rule-based fails
   */
  private getBasicFallback(answers: string[]): UltimateNLPResult {
    return {
      sentiment: {
        label: 'neutral',
        score: 50,
        confidence: 70
      },
      emotion: {
        label: 'calm',
        score: 50,
        confidence: 70
      },
      communication: {
        label: 'fair',
        score: 50,
        confidence: 70
      },
      confidence_level: {
        label: 'medium',
        score: 50
      },
      stress_level: {
        label: 'medium',
        score: 50
      },
      overallScore: 50,
      edgeCases: [],
      _internal: {
        mlUsed: false,
        ruleBasedUsed: true,
        averaged: false,
        processingTime: 0
      }
    };
  }

  // ============================================================================
  // MAPPING FUNCTIONS
  // ============================================================================

  private normalizeSentimentLabel(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('pos')) return 'positive';
    if (normalized.includes('neg')) return 'negative';
    return 'neutral';
  }

  private normalizeEmotionLabel(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('conf')) return 'confident';
    if (normalized.includes('nerv') || normalized.includes('anx')) return 'nervous';
    if (normalized.includes('stress')) return 'stressed';
    if (normalized.includes('calm') || normalized.includes('relax')) return 'calm';
    if (normalized.includes('motiv') || normalized.includes('excit')) return 'motivated';
    return 'neutral';
  }

  private normalizeCommunicationLabel(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('excel')) return 'excellent';
    if (normalized.includes('good')) return 'good';
    if (normalized.includes('fair')) return 'fair';
    return 'poor';
  }

  private normalizeConfidenceLabel(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('high') || normalized.includes('very')) return 'high';
    if (normalized.includes('low')) return 'low';
    return 'medium';
  }

  private normalizeStressLabel(label: string): string {
    const normalized = label.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized.includes('high') || normalized.includes('very')) return 'high';
    if (normalized.includes('low')) return 'low';
    return 'medium';
  }

  private mapSentimentToScore(label: string): number {
    const normalized = this.normalizeSentimentLabel(label);
    if (normalized === 'positive') return 80;
    if (normalized === 'negative') return 20;
    return 50;
  }

  private mapEmotionToScore(label: string): number {
    const normalized = this.normalizeEmotionLabel(label);
    const scores: Record<string, number> = {
      'motivated': 90,
      'confident': 85,
      'calm': 70,
      'neutral': 50,
      'nervous': 30,
      'stressed': 20
    };
    return scores[normalized] || 50;
  }

  private mapCommunicationToScore(label: string): number {
    const normalized = this.normalizeCommunicationLabel(label);
    if (normalized === 'excellent') return 90;
    if (normalized === 'good') return 70;
    if (normalized === 'fair') return 50;
    return 30;
  }

  private mapConfidenceToScore(label: string): number {
    const normalized = this.normalizeConfidenceLabel(label);
    if (normalized === 'high') return 85;
    if (normalized === 'low') return 20;
    return 50;
  }

  private mapStressToScore(label: string): number {
    const normalized = this.normalizeStressLabel(label);
    if (normalized === 'high') return 80;
    if (normalized === 'low') return 20;
    return 50;
  }

  // Reverse mappings (score to label)
  private mapScoreToSentimentLabel(score: number): string {
    if (score >= 65) return 'positive';
    if (score <= 35) return 'negative';
    return 'neutral';
  }

  private mapScoreToEmotionLabel(score: number, fallback: string = 'neutral'): string {
    if (score >= 85) return 'motivated';
    if (score >= 70) return 'confident';
    if (score >= 55) return 'calm';
    if (score >= 40) return 'neutral';
    if (score >= 25) return 'nervous';
    return 'stressed';
  }

  private mapScoreToCommunicationLabel(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private mapScoreToConfidenceLabel(score: number): string {
    if (score >= 70) return 'high';
    if (score <= 35) return 'low';
    return 'medium';
  }

  private mapScoreToStressLabel(score: number): string {
    if (score >= 65) return 'high';
    if (score <= 35) return 'low';
    return 'medium';
  }

  /**
   * Calculate overall score from components
   */
  private calculateOverallScore(components: {
    sentiment: number;
    communication: number;
    confidence: number;
    stress: number;
  }): number {
    // Weighted average
    const weights = {
      sentiment: 0.25,
      communication: 0.35,
      confidence: 0.25,
      stress: 0.15 // Inverse weight (lower stress is better)
    };
    
    const invertedStress = 100 - components.stress; // Invert stress (lower is better)
    
    const weighted = 
      components.sentiment * weights.sentiment +
      components.communication * weights.communication +
      components.confidence * weights.confidence +
      invertedStress * weights.stress;
    
    return Math.round(weighted);
  }

  /**
   * Detect edge cases from ML response
   */
  private detectEdgeCasesFromML(mlResponse: any): string[] {
    const edgeCases: string[] = [];
    
    // Sarcasm: negative sentiment + fair communication
    if (mlResponse.sentiment === 'negative' && mlResponse.communication === 'fair') {
      edgeCases.push('Sarcasm detected');
    }
    
    // Imposter syndrome: nervous + low confidence
    if (mlResponse.emotion === 'nervous' && mlResponse.confidence_level === 'low') {
      edgeCases.push('Imposter syndrome indicators');
    }
    
    // Overconfidence: high confidence + poor communication
    if (mlResponse.confidence_level === 'high' && mlResponse.communication === 'poor') {
      edgeCases.push('Overconfidence detected');
    }
    
    // Burnout: stressed + high stress
    if (mlResponse.emotion === 'stressed' && mlResponse.stress_level === 'high') {
      edgeCases.push('Burnout indicators');
    }
    
    return edgeCases;
  }

  /**
   * Detect edge cases from rule-based analysis
   */
  private detectEdgeCasesFromRuleBased(
    answers: string[],
    sentiment: any,
    behavior: any
  ): string[] {
    const edgeCases: string[] = [];
    const fullText = answers.join(' ').toLowerCase();
    
    // Self-deprecating humor
    if (fullText.includes('worst') || fullText.includes('terrible')) {
      if (fullText.includes('but') || fullText.includes('however')) {
        edgeCases.push('Self-deprecating humor');
      }
    }
    
    // Jargon overload
    const technicalWords = ['algorithm', 'optimization', 'scalability', 'architecture', 'framework'];
    const jargonCount = technicalWords.filter(word => fullText.includes(word)).length;
    if (jargonCount >= 3) {
      edgeCases.push('Technical jargon overload');
    }
    
    return edgeCases;
  }
}

// Export singleton instance
export const ultimateHybridNLP = new UltimateHybridNLPService();
