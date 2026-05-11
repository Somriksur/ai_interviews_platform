/**
 * ML NLP Service with Rule-Based Fallback
 * Ensures 100% uptime by falling back to rule-based system if ML fails
 */

import { mlNLPService } from './ml-nlp.service';
import { analyzeSentimentAndEmotions, analyzeBehavior, analyzeLanguageQuality } from '../nlp/sentiment-behavior-analysis';

export interface NLPAnalysisResult {
  source: 'ml' | 'rule-based';
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
  emotion: string;
  communication: number;
  confidence: number;
  stress: number;
  mlConfidence?: number; // Only present if ML was used
}

export class MLNLPWithFallbackService {
  private useML: boolean = true;
  private mlHealthy: boolean = true;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 60000; // Check every 60 seconds

  constructor() {
    // Check ML health on initialization
    this.checkMLHealth();
  }

  /**
   * Check if ML model is healthy
   */
  private async checkMLHealth(): Promise<void> {
    const now = Date.now();
    
    // Only check if enough time has passed
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return;
    }

    this.lastHealthCheck = now;

    try {
      this.mlHealthy = await mlNLPService.healthCheck();
    } catch (error) {
      this.mlHealthy = false;
    }
  }

  /**
   * Analyze text with ML model, fallback to rule-based if needed
   */
  async analyze(text: string, questions?: string[]): Promise<NLPAnalysisResult> {
    // Check ML health periodically
    await this.checkMLHealth();

    // Try ML first if enabled and healthy
    if (this.useML && this.mlHealthy) {
      try {
        console.log('🤖 Using ML-based NLP...');
        const mlResult = await mlNLPService.evaluate(text, 'all');
        
        const converted = mlNLPService.convertToLegacyFormat(mlResult);
        
        return {
          source: 'ml',
          sentiment: converted.sentiment,
          emotion: converted.emotion,
          communication: converted.communication,
          confidence: converted.confidence,
          stress: converted.stress,
          mlConfidence: mlResult.overall_score,
        };
      } catch (error) {
        console.error('❌ ML NLP failed, falling back to rule-based:', error);
        this.mlHealthy = false; // Mark as unhealthy
        // Fall through to rule-based
      }
    }

    // Use rule-based system
    return this.analyzeWithRuleBased([text], questions || []);
  }

  /**
   * Analyze multiple texts with ML model, fallback to rule-based if needed
   */
  async analyzeBatch(texts: string[], questions?: string[]): Promise<NLPAnalysisResult[]> {
    // Check ML health periodically
    await this.checkMLHealth();

    // Try ML first if enabled and healthy
    if (this.useML && this.mlHealthy) {
      try {
        console.log('🤖 Using ML-based NLP (batch)...');
        const mlResult = await mlNLPService.evaluateBatch(texts, 'all');
        
        return mlResult.results.map(result => {
          const converted = mlNLPService.convertToLegacyFormat(result);
          return {
            source: 'ml' as const,
            sentiment: converted.sentiment,
            emotion: converted.emotion,
            communication: converted.communication,
            confidence: converted.confidence,
            stress: converted.stress,
            mlConfidence: result.overall_score,
          };
        });
      } catch (error) {
        console.error('❌ ML NLP batch failed, falling back to rule-based:', error);
        this.mlHealthy = false; // Mark as unhealthy
        // Fall through to rule-based
      }
    }

    // Use rule-based system
    return texts.map(text => this.analyzeWithRuleBased([text], questions || []));
  }

  /**
   * Rule-based analysis (fallback)
   */
  private analyzeWithRuleBased(answers: string[], questions: string[]): NLPAnalysisResult {
    const sentiment = analyzeSentimentAndEmotions(answers);
    const behavior = analyzeBehavior(answers, questions);
    const language = analyzeLanguageQuality(answers);

    // Determine dominant emotion
    const emotions = sentiment.emotions;
    const dominantEmotion = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      source: 'rule-based',
      sentiment: {
        overall: sentiment.overall,
        score: sentiment.score,
      },
      emotion: dominantEmotion,
      communication: behavior.communicationClarity,
      confidence: emotions.confidence,
      stress: emotions.stress,
    };
  }

  /**
   * Enable or disable ML model
   */
  setMLEnabled(enabled: boolean): void {
    this.useML = enabled;
  }

  /**
   * Get current status
   */
  getStatus(): {
    mlEnabled: boolean;
    mlHealthy: boolean;
    currentSource: 'ml' | 'rule-based';
  } {
    return {
      mlEnabled: this.useML,
      mlHealthy: this.mlHealthy,
      currentSource: this.useML && this.mlHealthy ? 'ml' : 'rule-based',
    };
  }
}

// Export singleton instance
export const mlNLPWithFallback = new MLNLPWithFallbackService();
