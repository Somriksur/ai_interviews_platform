/**
 * ML-Based NLP Service - 90%+ Accuracy with Edge Cases
 * Integrates with HuggingFace deployed RoBERTa model (v2.0)
 * 
 * Features:
 * - Sarcasm/Irony Detection
 * - Self-Deprecating Humor
 * - Micromanager Anxiety
 * - Jargon Overload
 * - Imposter Syndrome
 * - Overconfidence Detection
 * - Burnout Recognition
 * - Humble Expert Detection
 * - Passive Aggressive Detection
 * - Balanced Realistic Assessment
 */

interface MLNLPResponse {
  sentiment: string;
  emotion: string;
  communication: string;
  confidence_level: string;
  stress_level: string;
  model_version: string;
}

interface MLNLPBatchResponse {
  success: boolean;
  results: MLNLPResponse[];
}

export class MLNLPService {
  private apiUrl: string;
  private timeout: number = 30000; // 30 seconds

  constructor() {
    // Get HuggingFace Space URL from environment
    this.apiUrl = process.env.HUGGINGFACE_NLP_SPACE_URL || '';
    
    if (!this.apiUrl) {
      console.warn('⚠️  HUGGINGFACE_NLP_SPACE_URL not set in environment variables');
    }
  }

  /**
   * Evaluate a single text using ML model (v2.0 API)
   */
  async evaluate(text: string): Promise<MLNLPResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MLNLPResponse = await response.json();
      return result;
    } catch (error) {
      console.error('❌ ML NLP evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Evaluate multiple texts in batch
   */
  async evaluateBatch(texts: string[]): Promise<MLNLPResponse[]> {
    try {
      // Process texts sequentially (API doesn't have batch endpoint yet)
      const results: MLNLPResponse[] = [];
      
      for (const text of texts) {
        const result = await this.evaluate(text);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('❌ ML NLP batch evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Check if ML model is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.status === 'healthy';
    } catch (error) {
      console.error('❌ ML NLP health check failed:', error);
      return false;
    }
  }

  /**
   * Convert ML results to legacy format for compatibility
   */
  convertToLegacyFormat(mlResult: MLNLPResponse): {
    sentiment: { overall: string; score: number };
    emotion: string;
    communication: number;
    confidence: number;
    stress: number;
  } {
    // Map string labels to scores
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
      sentiment: {
        overall: mlResult.sentiment,
        score: sentimentScores[mlResult.sentiment] || 50,
      },
      emotion: mlResult.emotion,
      communication: communicationScores[mlResult.communication] || 50,
      confidence: confidenceScores[mlResult.confidence_level] || 50,
      stress: stressScores[mlResult.stress_level] || 50,
    };
  }
}

// Export singleton instance
export const mlNLPService = new MLNLPService();
