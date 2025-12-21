/**
 * Real-time Confidence Tracking System
 * Tracks confidence levels dynamically throughout the interview
 */

export interface ConfidenceMetrics {
  // Core Confidence Indicators
  verbalConfidence: number;      // 0-100
  linguisticConfidence: number;  // 0-100
  responseConfidence: number;    // 0-100
  overallConfidence: number;     // 0-100
  
  // Confidence Stability
  confidenceVariability: number; // 0-100 (lower = more stable)
  confidenceTrend: 'increasing' | 'decreasing' | 'stable';
  confidenceRecovery: number;    // 0-100 (ability to recover from low points)
  
  // Temporal Analysis
  confidenceProgression: number[]; // confidence over time
  peakConfidenceMoments: number[]; // timestamps of highest confidence
  lowConfidenceMoments: number[];  // timestamps of lowest confidence
  
  // Context-specific Confidence
  technicalConfidence: number;    // 0-100
  behavioralConfidence: number;   // 0-100
  communicationConfidence: number; // 0-100
  
  // Confidence Triggers
  confidenceBoosts: string[];     // factors that increase confidence
  confidenceDrops: string[];      // factors that decrease confidence
}

export interface ConfidenceAnalysis {
  metrics: ConfidenceMetrics;
  insights: {
    dominantPattern: string;
    strengthAreas: string[];
    improvementAreas: string[];
    recommendations: string[];
  };
  predictions: {
    futurePerformance: number;     // 0-100
    stressResilience: number;      // 0-100
    adaptability: number;          // 0-100
  };
}

/**
 * Real-time Confidence Tracker
 * Analyzes confidence patterns throughout the interview
 */
export class RealTimeConfidenceTracker {
  private confidenceIndicators: Map<string, number> = new Map();
  private uncertaintyMarkers: Map<string, number> = new Map();
  private assertivenessMarkers: Map<string, number> = new Map();
  
  constructor() {
    this.initializeMarkers();
  }
  
  /**
   * Track confidence throughout the interview
   */
  public trackConfidence(
    transcript: string[],
    questions: string[]
  ): ConfidenceAnalysis {
    console.log('📊 Starting real-time confidence tracking...');
    
    // Calculate confidence metrics
    const metrics = this.calculateConfidenceMetrics(transcript, questions);
    
    // Generate insights
    const insights = this.generateConfidenceInsights(metrics, transcript);
    
    // Make predictions
    const predictions = this.generateConfidencePredictions(metrics);
    
    console.log('✅ Confidence tracking completed');
    
    return {
      metrics,
      insights,
      predictions
    };
  }
  
  private initializeMarkers(): void {
    // Confidence indicators (positive markers)
    this.confidenceIndicators = new Map([
      ['definitely', 90], ['certainly', 85], ['absolutely', 95], ['clearly', 80],
      ['obviously', 75], ['sure', 85], ['confident', 90], ['know', 70],
      ['understand', 75], ['experienced', 80], ['skilled', 85], ['expert', 90],
      ['proficient', 80], ['familiar', 70], ['comfortable', 75], ['capable', 80],
      ['strong', 85], ['excellent', 90], ['successful', 85], ['achieved', 80],
      ['accomplished', 85], ['mastered', 90], ['proven', 85], ['demonstrated', 80]
    ]);
    
    // Uncertainty markers (negative markers)
    this.uncertaintyMarkers = new Map([
      ['maybe', 60], ['perhaps', 55], ['possibly', 50], ['might', 45],
      ['could', 40], ['would', 35], ['should', 30], ['think', 40],
      ['guess', 70], ['suppose', 65], ['assume', 50], ['believe', 45],
      ['hope', 60], ['try', 50], ['attempt', 45], ['probably', 40],
      ['likely', 35], ['uncertain', 80], ['unsure', 85], ['confused', 90],
      ['unclear', 75], ['difficult', 60], ['challenging', 55], ['hard', 50]
    ]);
    
    // Assertiveness markers
    this.assertivenessMarkers = new Map([
      ['will', 80], ['must', 85], ['need', 75], ['require', 80],
      ['ensure', 85], ['guarantee', 90], ['commit', 85], ['promise', 80],
      ['deliver', 85], ['achieve', 80], ['complete', 75], ['finish', 70],
      ['implement', 80], ['execute', 85], ['perform', 75], ['handle', 70]
    ]);
  }
  
  private calculateConfidenceMetrics(transcript: string[], questions: string[]): ConfidenceMetrics {
    // Calculate confidence for each response
    const responseConfidences = transcript.map(response => 
      this.calculateResponseConfidence(response)
    );
    
    // Calculate overall metrics
    const verbalConfidence = this.calculateVerbalConfidence(transcript);
    const linguisticConfidence = this.calculateLinguisticConfidence(transcript);
    const responseConfidence = responseConfidences.reduce((a, b) => a + b, 0) / responseConfidences.length;
    const overallConfidence = Math.round((verbalConfidence + linguisticConfidence + responseConfidence) / 3);
    
    // Calculate variability
    const confidenceVariability = this.calculateConfidenceVariability(responseConfidences);
    
    // Determine trend
    const confidenceTrend = this.determineConfidenceTrend(responseConfidences);
    
    // Calculate recovery ability
    const confidenceRecovery = this.calculateConfidenceRecovery(responseConfidences);
    
    // Identify peak and low moments
    const peakConfidenceMoments = this.identifyPeakMoments(responseConfidences, 'high');
    const lowConfidenceMoments = this.identifyPeakMoments(responseConfidences, 'low');
    
    // Context-specific confidence
    const technicalConfidence = this.calculateContextSpecificConfidence(transcript, questions, 'technical');
    const behavioralConfidence = this.calculateContextSpecificConfidence(transcript, questions, 'behavioral');
    const communicationConfidence = this.calculateCommunicationConfidence(transcript);
    
    // Identify confidence triggers
    const confidenceBoosts = this.identifyConfidenceBoosts(transcript);
    const confidenceDrops = this.identifyConfidenceDrops(transcript);
    
    return {
      verbalConfidence: Math.round(verbalConfidence),
      linguisticConfidence: Math.round(linguisticConfidence),
      responseConfidence: Math.round(responseConfidence),
      overallConfidence,
      confidenceVariability: Math.round(confidenceVariability),
      confidenceTrend,
      confidenceRecovery: Math.round(confidenceRecovery),
      confidenceProgression: responseConfidences.map(c => Math.round(c)),
      peakConfidenceMoments,
      lowConfidenceMoments,
      technicalConfidence: Math.round(technicalConfidence),
      behavioralConfidence: Math.round(behavioralConfidence),
      communicationConfidence: Math.round(communicationConfidence),
      confidenceBoosts,
      confidenceDrops
    };
  }
  
  private calculateResponseConfidence(response: string): number {
    const words = response.toLowerCase().split(/\s+/);
    
    let confidenceScore = 50; // Base confidence
    let confidenceFactors = 0;
    let uncertaintyFactors = 0;
    
    // Analyze confidence indicators
    words.forEach(word => {
      if (this.confidenceIndicators.has(word)) {
        confidenceScore += this.confidenceIndicators.get(word)! * 0.1;
        confidenceFactors++;
      }
      
      if (this.uncertaintyMarkers.has(word)) {
        confidenceScore -= this.uncertaintyMarkers.get(word)! * 0.1;
        uncertaintyFactors++;
      }
      
      if (this.assertivenessMarkers.has(word)) {
        confidenceScore += this.assertivenessMarkers.get(word)! * 0.05;
      }
    });
    
    // Adjust for response length (longer responses often indicate more confidence)
    const totalWords = words.length;
    if (totalWords > 50) confidenceScore += 10;
    else if (totalWords < 20) confidenceScore -= 10;
    
    // Adjust for hesitation markers
    const hesitationMarkers = ['um', 'uh', 'well', 'so', 'like'];
    const hesitationCount = hesitationMarkers.reduce((count, marker) => {
      const matches = response.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g'));
      return count + (matches ? matches.length : 0);
    }, 0);
    
    confidenceScore -= hesitationCount * 5;
    
    // Adjust for question marks (uncertainty)
    const questionMarks = (response.match(/\?/g) || []).length;
    confidenceScore -= questionMarks * 3;
    
    // Adjust for exclamation marks (enthusiasm/confidence)
    const exclamationMarks = (response.match(/!/g) || []).length;
    confidenceScore += exclamationMarks * 2;
    
    return Math.max(0, Math.min(100, confidenceScore));
  }
  
  private calculateVerbalConfidence(transcript: string[]): number {
    const combinedText = transcript.join(' ').toLowerCase();
    
    let confidenceScore = 0;
    let confidenceCount = 0;
    
    // Count confidence indicators
    this.confidenceIndicators.forEach((score, indicator) => {
      const matches = combinedText.match(new RegExp(`\\b${indicator}\\b`, 'g'));
      if (matches) {
        confidenceScore += matches.length * score;
        confidenceCount += matches.length;
      }
    });
    
    // Count uncertainty markers
    this.uncertaintyMarkers.forEach((penalty, marker) => {
      const matches = combinedText.match(new RegExp(`\\b${marker}\\b`, 'g'));
      if (matches) {
        confidenceScore -= matches.length * penalty;
        confidenceCount += matches.length;
      }
    });
    
    // Calculate average if we have markers, otherwise use base score
    return confidenceCount > 0 ? 
      Math.max(0, Math.min(100, 50 + (confidenceScore / confidenceCount))) : 50;
  }
  
  private calculateLinguisticConfidence(transcript: string[]): number {
    let totalScore = 0;
    
    transcript.forEach(response => {
      let responseScore = 50; // Base score
      
      // Sentence structure confidence
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
      
      // Optimal sentence length indicates confidence
      if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
        responseScore += 15;
      } else if (avgSentenceLength < 5) {
        responseScore -= 10;
      }
      
      // Vocabulary sophistication
      const sophisticatedWords = ['implement', 'develop', 'analyze', 'optimize', 'enhance', 'facilitate'];
      const sophisticatedCount = sophisticatedWords.reduce((count, word) => {
        const matches = response.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      
      responseScore += sophisticatedCount * 5;
      
      // Grammar confidence (basic heuristics)
      const properCapitalization = /^[A-Z]/.test(response.trim());
      const properPunctuation = /[.!?]$/.test(response.trim());
      
      if (properCapitalization) responseScore += 5;
      if (properPunctuation) responseScore += 5;
      
      totalScore += Math.max(0, Math.min(100, responseScore));
    });
    
    return totalScore / transcript.length;
  }
  
  private calculateConfidenceVariability(confidences: number[]): number {
    if (confidences.length < 2) return 0;
    
    const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-100 scale (higher = more variable)
    return Math.min(100, (stdDev / mean) * 100);
  }
  
  private determineConfidenceTrend(confidences: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (confidences.length < 3) return 'stable';
    
    const firstHalf = confidences.slice(0, Math.floor(confidences.length / 2));
    const secondHalf = confidences.slice(Math.floor(confidences.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 5) return 'increasing';
    if (difference < -5) return 'decreasing';
    return 'stable';
  }
  
  private calculateConfidenceRecovery(confidences: number[]): number {
    if (confidences.length < 3) return 50;
    
    let recoveryInstances = 0;
    let totalRecoveryOpportunities = 0;
    
    for (let i = 1; i < confidences.length - 1; i++) {
      // If confidence dropped significantly
      if (confidences[i] < confidences[i - 1] - 10) {
        totalRecoveryOpportunities++;
        
        // Check if it recovered in the next response
        if (confidences[i + 1] > confidences[i] + 5) {
          recoveryInstances++;
        }
      }
    }
    
    return totalRecoveryOpportunities > 0 ? 
      (recoveryInstances / totalRecoveryOpportunities) * 100 : 75;
  }
  
  private identifyPeakMoments(confidences: number[], type: 'high' | 'low'): number[] {
    const threshold = type === 'high' ? 75 : 35;
    const moments: number[] = [];
    
    confidences.forEach((confidence, index) => {
      if (type === 'high' && confidence >= threshold) {
        moments.push(index);
      } else if (type === 'low' && confidence <= threshold) {
        moments.push(index);
      }
    });
    
    return moments;
  }
  
  private calculateContextSpecificConfidence(
    transcript: string[], 
    questions: string[], 
    context: 'technical' | 'behavioral'
  ): number {
    const contextResponses: number[] = [];
    
    questions.forEach((question, index) => {
      const isContextQuestion = this.isQuestionOfType(question, context);
      
      if (isContextQuestion && transcript[index]) {
        const confidence = this.calculateResponseConfidence(transcript[index]);
        contextResponses.push(confidence);
      }
    });
    
    return contextResponses.length > 0 ? 
      contextResponses.reduce((a, b) => a + b, 0) / contextResponses.length : 50;
  }
  
  private isQuestionOfType(question: string, type: 'technical' | 'behavioral'): boolean {
    const lowerQuestion = question.toLowerCase();
    
    if (type === 'technical') {
      return /technical|code|algorithm|system|architecture|programming|development/.test(lowerQuestion);
    } else {
      return /tell me about|describe a time|how do you handle|experience|situation/.test(lowerQuestion);
    }
  }
  
  private calculateCommunicationConfidence(transcript: string[]): number {
    let totalScore = 0;
    
    transcript.forEach(response => {
      let score = 50;
      
      // Clear communication indicators
      const clarityMarkers = ['clearly', 'specifically', 'exactly', 'precisely'];
      const clarityCount = clarityMarkers.reduce((count, marker) => {
        const matches = response.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      
      score += clarityCount * 8;
      
      // Engagement indicators
      const engagementMarkers = ['example', 'instance', 'specifically', 'particularly'];
      const engagementCount = engagementMarkers.reduce((count, marker) => {
        const matches = response.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      
      score += engagementCount * 6;
      
      // Professional language
      const professionalMarkers = ['implement', 'develop', 'analyze', 'optimize', 'facilitate'];
      const professionalCount = professionalMarkers.reduce((count, marker) => {
        const matches = response.toLowerCase().match(new RegExp(`\\b${marker}\\b`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      
      score += professionalCount * 5;
      
      totalScore += Math.max(0, Math.min(100, score));
    });
    
    return totalScore / transcript.length;
  }
  
  private identifyConfidenceBoosts(transcript: string[]): string[] {
    const boosts: string[] = [];
    
    transcript.forEach((response) => {
      const confidence = this.calculateResponseConfidence(response);
      
      if (confidence >= 80) {
        const lowerResponse = response.toLowerCase();
        
        if (lowerResponse.includes('experience')) {
          boosts.push('Personal experience references');
        }
        if (lowerResponse.includes('successful') || lowerResponse.includes('achieved')) {
          boosts.push('Success stories and achievements');
        }
        if (lowerResponse.includes('confident') || lowerResponse.includes('sure')) {
          boosts.push('Direct confidence statements');
        }
        if (lowerResponse.includes('expert') || lowerResponse.includes('skilled')) {
          boosts.push('Expertise and skill assertions');
        }
      }
    });
    
    return [...new Set(boosts)]; // Remove duplicates
  }
  
  private identifyConfidenceDrops(transcript: string[]): string[] {
    const drops: string[] = [];
    
    transcript.forEach((response) => {
      const confidence = this.calculateResponseConfidence(response);
      
      if (confidence <= 40) {
        const lowerResponse = response.toLowerCase();
        
        if (lowerResponse.includes('not sure') || lowerResponse.includes('uncertain')) {
          drops.push('Uncertainty expressions');
        }
        if (lowerResponse.includes('difficult') || lowerResponse.includes('challenging')) {
          drops.push('Difficulty acknowledgments');
        }
        if (lowerResponse.includes('maybe') || lowerResponse.includes('perhaps')) {
          drops.push('Tentative language');
        }
        if (lowerResponse.includes('um') || lowerResponse.includes('uh')) {
          drops.push('Hesitation markers');
        }
      }
    });
    
    return [...new Set(drops)]; // Remove duplicates
  }
  
  private generateConfidenceInsights(metrics: ConfidenceMetrics, _transcript: string[]): any {
    // Determine dominant pattern
    let dominantPattern = 'Stable confidence throughout interview';
    
    if (metrics.confidenceTrend === 'increasing') {
      dominantPattern = 'Growing confidence as interview progressed';
    } else if (metrics.confidenceTrend === 'decreasing') {
      dominantPattern = 'Declining confidence during interview';
    } else if (metrics.confidenceVariability > 30) {
      dominantPattern = 'Variable confidence with significant fluctuations';
    }
    
    // Identify strength areas
    const strengthAreas: string[] = [];
    
    if (metrics.technicalConfidence >= 70) {
      strengthAreas.push('Strong technical confidence');
    }
    if (metrics.behavioralConfidence >= 70) {
      strengthAreas.push('Confident in behavioral responses');
    }
    if (metrics.communicationConfidence >= 70) {
      strengthAreas.push('Confident communication style');
    }
    if (metrics.confidenceRecovery >= 70) {
      strengthAreas.push('Good confidence recovery ability');
    }
    
    // Identify improvement areas
    const improvementAreas: string[] = [];
    
    if (metrics.overallConfidence < 60) {
      improvementAreas.push('Overall confidence building needed');
    }
    if (metrics.confidenceVariability > 40) {
      improvementAreas.push('Confidence stability improvement');
    }
    if (metrics.technicalConfidence < 50) {
      improvementAreas.push('Technical confidence development');
    }
    if (metrics.lowConfidenceMoments.length > metrics.peakConfidenceMoments.length) {
      improvementAreas.push('Reducing low confidence episodes');
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (metrics.overallConfidence < 60) {
      recommendations.push('Practice mock interviews to build overall confidence');
    }
    if (metrics.technicalConfidence < 60) {
      recommendations.push('Strengthen technical knowledge and practice explaining concepts');
    }
    if (metrics.confidenceVariability > 30) {
      recommendations.push('Work on maintaining consistent confidence levels throughout discussions');
    }
    if (metrics.confidenceRecovery < 60) {
      recommendations.push('Develop strategies for recovering from difficult questions');
    }
    
    return {
      dominantPattern,
      strengthAreas,
      improvementAreas,
      recommendations: recommendations.length > 0 ? recommendations : ['Continue building on existing confidence strengths']
    };
  }
  
  private generateConfidencePredictions(metrics: ConfidenceMetrics): any {
    // Future performance prediction
    const futurePerformance = Math.round(
      (metrics.overallConfidence * 0.4 +
       metrics.confidenceRecovery * 0.3 +
       (100 - metrics.confidenceVariability) * 0.3) / 1
    );
    
    // Stress resilience prediction
    const stressResilience = Math.round(
      (metrics.confidenceRecovery * 0.5 +
       (100 - metrics.confidenceVariability) * 0.3 +
       metrics.overallConfidence * 0.2) / 1
    );
    
    // Adaptability prediction
    const adaptability = Math.round(
      (metrics.confidenceRecovery * 0.4 +
       metrics.communicationConfidence * 0.3 +
       (metrics.confidenceTrend === 'increasing' ? 80 : 
        metrics.confidenceTrend === 'stable' ? 60 : 40) * 0.3) / 1
    );
    
    return {
      futurePerformance,
      stressResilience,
      adaptability
    };
  }
}