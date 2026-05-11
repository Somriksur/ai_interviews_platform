/**
 * Semantic Evaluation Engine
 * Deep NLP analysis with multi-layer scoring
 */

import { SemanticEmbeddingsService } from './semantic-embeddings.service';

export interface SemanticEvaluationResult {
  semanticScore: number; // 0-100
  conceptCoverage: number; // 0-100
  reasoningScore: number; // 0-100
  explanationQuality: number; // 0-100
  
  // Multi-layer analysis
  surfaceAnalysis: {
    keywordMatch: number;
    termFrequency: number;
    vocabularyRichness: number;
  };
  
  semanticAnalysis: {
    meaningAlignment: number;
    contextualRelevance: number;
    conceptualDepth: number;
  };
  
  structuralAnalysis: {
    clarity: number;
    coherence: number;
    completeness: number;
  };
  
  // Detailed insights
  coveredConcepts: string[];
  missingConcepts: string[];
  strengths: string[];
  weaknesses: string[];
  
  // Explainability
  explanation: string;
  confidence: number;
}

export interface QuestionAnswerPair {
  question: string;
  answer: string;
  expectedConcepts?: string[];
  idealAnswer?: string;
}

/**
 * Semantic Evaluation Service
 * Provides deep semantic analysis of interview answers
 */
export class SemanticEvaluationService {
  private semanticService: SemanticEmbeddingsService;
  
  // Reasoning indicators
  private reasoningPatterns = {
    causal: ['because', 'therefore', 'thus', 'hence', 'consequently', 'as a result'],
    comparative: ['compared to', 'versus', 'while', 'whereas', 'on the other hand', 'however'],
    sequential: ['first', 'then', 'next', 'finally', 'after', 'before', 'subsequently'],
    conditional: ['if', 'when', 'unless', 'provided that', 'in case', 'assuming'],
    exemplification: ['for example', 'for instance', 'such as', 'like', 'including']
  };
  
  // Clarity indicators
  private clarityMarkers = {
    positive: ['clearly', 'specifically', 'precisely', 'exactly', 'in other words', 'to clarify'],
    negative: ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'maybe', 'i think']
  };
  
  constructor() {
    this.semanticService = new SemanticEmbeddingsService();
  }
  
  /**
   * Evaluate answer semantically with multi-layer analysis
   */
  public evaluateAnswer(qa: QuestionAnswerPair): SemanticEvaluationResult {
    const { question, answer, expectedConcepts = [], idealAnswer } = qa;
    
    // Layer 1: Surface analysis (keywords, terms)
    const surfaceAnalysis = this.analyzeSurface(answer, question);
    
    // Layer 2: Semantic analysis (meaning, context)
    const semanticAnalysis = this.analyzeSemantics(answer, question, idealAnswer);
    
    // Layer 3: Structural analysis (clarity, coherence)
    const structuralAnalysis = this.analyzeStructure(answer);
    
    // Concept coverage
    const conceptAnalysis = this.analyzeConcepts(answer, expectedConcepts);
    
    // Reasoning analysis
    const reasoningScore = this.analyzeReasoning(answer);
    
    // Explanation quality
    const explanationQuality = this.analyzeExplanationQuality(answer);
    
    // Calculate overall semantic score
    const semanticScore = Math.round(
      surfaceAnalysis.keywordMatch * 0.15 +
      semanticAnalysis.meaningAlignment * 0.30 +
      structuralAnalysis.clarity * 0.20 +
      conceptAnalysis.coverage * 0.20 +
      reasoningScore * 0.15
    );
    
    // Generate insights
    const { strengths, weaknesses } = this.generateInsights(
      surfaceAnalysis,
      semanticAnalysis,
      structuralAnalysis,
      conceptAnalysis.coverage,
      reasoningScore
    );
    
    // Generate explanation
    const explanation = this.generateExplanation(
      semanticScore,
      conceptAnalysis,
      reasoningScore,
      structuralAnalysis
    );
    
    // Calculate confidence
    const confidence = this.calculateConfidence(answer.length, conceptAnalysis.coverage);
    
    return {
      semanticScore,
      conceptCoverage: conceptAnalysis.coverage,
      reasoningScore,
      explanationQuality,
      surfaceAnalysis,
      semanticAnalysis,
      structuralAnalysis,
      coveredConcepts: conceptAnalysis.coveredConcepts,
      missingConcepts: conceptAnalysis.missingConcepts,
      strengths,
      weaknesses,
      explanation,
      confidence
    };
  }
  
  /**
   * Surface-level analysis: keywords and terms
   */
  private analyzeSurface(answer: string, question: string): {
    keywordMatch: number;
    termFrequency: number;
    vocabularyRichness: number;
  } {
    const answerTokens = answer.toLowerCase().split(/\s+/);
    const questionTokens = question.toLowerCase().split(/\s+/);
    
    // Keyword match
    const questionKeywords = questionTokens.filter(t => t.length > 4);
    const matchedKeywords = questionKeywords.filter(kw => 
      answerTokens.some(at => at.includes(kw) || kw.includes(at))
    );
    const keywordMatch = questionKeywords.length > 0
      ? (matchedKeywords.length / questionKeywords.length) * 100
      : 50;
    
    // Term frequency (technical terms)
    const technicalTerms = ['algorithm', 'data', 'structure', 'system', 'design', 'implement', 
                           'optimize', 'performance', 'scalable', 'architecture'];
    const termCount = technicalTerms.filter(term => 
      answer.toLowerCase().includes(term)
    ).length;
    const termFrequency = Math.min(100, (termCount / 5) * 100);
    
    // Vocabulary richness
    const uniqueWords = new Set(answerTokens.filter(t => t.length > 3));
    const vocabularyRichness = Math.min(100, (uniqueWords.size / Math.max(answerTokens.length, 1)) * 150);
    
    return {
      keywordMatch: Math.round(keywordMatch),
      termFrequency: Math.round(termFrequency),
      vocabularyRichness: Math.round(vocabularyRichness)
    };
  }
  
  /**
   * Semantic-level analysis: meaning and context
   */
  private analyzeSemantics(answer: string, question: string, idealAnswer?: string): {
    meaningAlignment: number;
    contextualRelevance: number;
    conceptualDepth: number;
  } {
    // Meaning alignment with question
    const questionSimilarity = this.semanticService.calculateSimilarity(answer, question);
    const meaningAlignment = Math.min(100, questionSimilarity.score * 1.2);
    
    // Contextual relevance (if ideal answer provided)
    let contextualRelevance = 70; // Default
    if (idealAnswer) {
      const idealSimilarity = this.semanticService.calculateSimilarity(answer, idealAnswer);
      contextualRelevance = idealSimilarity.score;
    }
    
    // Conceptual depth (based on technical terms and explanation length)
    const hasExamples = /for example|for instance|such as|like/.test(answer.toLowerCase());
    const hasComparison = /compared to|versus|while|whereas/.test(answer.toLowerCase());
    const hasReasoning = /because|therefore|thus|hence/.test(answer.toLowerCase());
    
    let conceptualDepth = 50;
    if (hasExamples) conceptualDepth += 15;
    if (hasComparison) conceptualDepth += 15;
    if (hasReasoning) conceptualDepth += 20;
    
    const wordCount = answer.split(/\s+/).length;
    if (wordCount > 100) conceptualDepth += 10;
    else if (wordCount < 30) conceptualDepth -= 20;
    
    return {
      meaningAlignment: Math.round(meaningAlignment),
      contextualRelevance: Math.round(contextualRelevance),
      conceptualDepth: Math.min(100, Math.max(0, conceptualDepth))
    };
  }
  
  /**
   * Structural analysis: clarity and coherence
   */
  private analyzeStructure(answer: string): {
    clarity: number;
    coherence: number;
    completeness: number;
  } {
    const lowerAnswer = answer.toLowerCase();
    
    // Clarity score
    let clarity = 70;
    
    // Positive clarity markers
    this.clarityMarkers.positive.forEach(marker => {
      if (lowerAnswer.includes(marker)) clarity += 5;
    });
    
    // Negative clarity markers
    this.clarityMarkers.negative.forEach(marker => {
      if (lowerAnswer.includes(marker)) clarity -= 3;
    });
    
    // Coherence score (logical connectors)
    let coherence = 60;
    let connectorCount = 0;
    
    Object.values(this.reasoningPatterns).flat().forEach(pattern => {
      if (lowerAnswer.includes(pattern)) {
        coherence += 4;
        connectorCount++;
      }
    });
    
    // Completeness score
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / Math.max(sentences.length, 1);
    
    let completeness = 50;
    if (sentences.length >= 3) completeness += 20;
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) completeness += 20;
    if (answer.length > 200) completeness += 10;
    
    return {
      clarity: Math.min(100, Math.max(0, Math.round(clarity))),
      coherence: Math.min(100, Math.round(coherence)),
      completeness: Math.min(100, completeness)
    };
  }
  
  /**
   * Analyze concept coverage
   */
  private analyzeConcepts(answer: string, expectedConcepts: string[]): {
    coverage: number;
    coveredConcepts: string[];
    missingConcepts: string[];
  } {
    if (expectedConcepts.length === 0) {
      return {
        coverage: 70, // Default when no expected concepts
        coveredConcepts: [],
        missingConcepts: []
      };
    }
    
    return this.semanticService.calculateConceptCoverage(answer, expectedConcepts);
  }
  
  /**
   * Analyze reasoning quality
   */
  private analyzeReasoning(answer: string): number {
    const lowerAnswer = answer.toLowerCase();
    let reasoningScore = 40; // Base score
    
    // Check for different reasoning patterns
    Object.entries(this.reasoningPatterns).forEach(([type, patterns]) => {
      const hasPattern = patterns.some(pattern => lowerAnswer.includes(pattern));
      if (hasPattern) {
        reasoningScore += 12;
      }
    });
    
    // Bonus for multiple reasoning types
    const reasoningTypes = Object.values(this.reasoningPatterns).filter(patterns =>
      patterns.some(pattern => lowerAnswer.includes(pattern))
    ).length;
    
    if (reasoningTypes >= 3) reasoningScore += 15;
    else if (reasoningTypes >= 2) reasoningScore += 10;
    
    return Math.min(100, reasoningScore);
  }
  
  /**
   * Analyze explanation quality
   */
  private analyzeExplanationQuality(answer: string): number {
    let quality = 50;
    
    const wordCount = answer.split(/\s+/).length;
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Length appropriateness
    if (wordCount >= 50 && wordCount <= 300) quality += 20;
    else if (wordCount < 30) quality -= 20;
    else if (wordCount > 400) quality -= 10;
    
    // Structure
    if (sentences.length >= 3) quality += 15;
    
    // Examples
    if (/for example|for instance|such as/.test(answer.toLowerCase())) quality += 15;
    
    return Math.min(100, Math.max(0, quality));
  }
  
  /**
   * Generate insights from analysis
   */
  private generateInsights(
    surface: any,
    semantic: any,
    structural: any,
    conceptCoverage: number,
    reasoningScore: number
  ): { strengths: string[]; weaknesses: string[] } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    // Analyze strengths
    if (semantic.meaningAlignment >= 75) {
      strengths.push('Strong alignment with question context');
    }
    if (structural.clarity >= 75) {
      strengths.push('Clear and well-articulated response');
    }
    if (conceptCoverage >= 80) {
      strengths.push('Comprehensive concept coverage');
    }
    if (reasoningScore >= 70) {
      strengths.push('Good logical reasoning demonstrated');
    }
    if (surface.vocabularyRichness >= 70) {
      strengths.push('Rich technical vocabulary');
    }
    
    // Analyze weaknesses
    if (semantic.meaningAlignment < 50) {
      weaknesses.push('Answer lacks relevance to question');
    }
    if (structural.clarity < 50) {
      weaknesses.push('Response clarity needs improvement');
    }
    if (conceptCoverage < 50) {
      weaknesses.push('Missing key concepts in answer');
    }
    if (reasoningScore < 50) {
      weaknesses.push('Limited logical reasoning shown');
    }
    if (structural.completeness < 50) {
      weaknesses.push('Answer appears incomplete');
    }
    
    return { strengths, weaknesses };
  }
  
  /**
   * Generate human-readable explanation
   */
  private generateExplanation(
    score: number,
    conceptAnalysis: any,
    reasoningScore: number,
    structural: any
  ): string {
    let explanation = `Overall semantic score: ${score}/100. `;
    
    if (score >= 80) {
      explanation += 'Excellent answer with strong semantic understanding. ';
    } else if (score >= 65) {
      explanation += 'Good answer with adequate semantic coverage. ';
    } else if (score >= 50) {
      explanation += 'Acceptable answer but room for improvement. ';
    } else {
      explanation += 'Answer needs significant improvement. ';
    }
    
    // Concept coverage
    if (conceptAnalysis.coverage >= 80) {
      explanation += 'Covers all key concepts well. ';
    } else if (conceptAnalysis.coverage < 50 && conceptAnalysis.missingConcepts.length > 0) {
      explanation += `Missing concepts: ${conceptAnalysis.missingConcepts.slice(0, 3).join(', ')}. `;
    }
    
    // Reasoning
    if (reasoningScore >= 70) {
      explanation += 'Demonstrates strong logical reasoning. ';
    } else if (reasoningScore < 50) {
      explanation += 'Could benefit from more structured reasoning. ';
    }
    
    // Clarity
    if (structural.clarity < 60) {
      explanation += 'Consider improving clarity and reducing filler words.';
    }
    
    return explanation.trim();
  }
  
  /**
   * Calculate confidence in evaluation
   */
  private calculateConfidence(answerLength: number, conceptCoverage: number): number {
    let confidence = 50;
    
    // Length factor
    if (answerLength > 100) confidence += 20;
    else if (answerLength > 50) confidence += 10;
    else if (answerLength < 20) confidence -= 20;
    
    // Concept coverage factor
    confidence += (conceptCoverage / 100) * 30;
    
    return Math.round(Math.min(100, Math.max(30, confidence)));
  }
}
