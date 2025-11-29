// Enhanced Sentiment & Behavior Analysis Module
// Provides comprehensive emotional, behavioral, and personality analysis

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // 0-100
  emotions: {
    nervousness: number; // 0-100
    confidence: number; // 0-100
    stress: number; // 0-100
    calmness: number; // 0-100
    motivation: number; // 0-100
  };
  emotionalTone: string;
}

export interface BehaviorAnalysis {
  communicationClarity: number; // 0-100
  consistency: number; // 0-100
  toneVariation: number; // 0-100
  trustworthiness: number; // 0-100
  professionalism: number; // 0-100
  engagement: number; // 0-100
}

export interface LanguageQuality {
  grammar: number; // 0-100
  fluency: number; // 0-100
  vocabulary: number; // 0-100
  relevance: number; // 0-100
  hesitation: number; // 0-100 (lower is better)
  fillerWords: number; // count
}

export interface ComprehensiveBehaviorReport {
  sentiment: SentimentAnalysis;
  behavior: BehaviorAnalysis;
  language: LanguageQuality;
  overallBehaviorScore: number;
  behaviorSummary: string;
  emotionalProfile: string;
  recommendedActions: string[];
}

/**
 * Analyze sentiment and emotions from interview answers
 */
export function analyzeSentimentAndEmotions(answers: string[]): SentimentAnalysis {
  const combinedText = answers.join(' ').toLowerCase();
  
  // Emotion indicators
  const nervousIndicators = [
    'um', 'uh', 'i think', 'maybe', 'not sure', 'i guess', 'kind of',
    'sort of', 'i mean', 'you know', 'like', 'probably', 'possibly'
  ];
  
  const confidentIndicators = [
    'definitely', 'certainly', 'clearly', 'obviously', 'always', 'ensure',
    'confident', 'sure', 'know', 'understand', 'experience', 'familiar',
    'expert', 'proficient', 'skilled', 'mastered', 'accomplished'
  ];
  
  const stressIndicators = [
    'difficult', 'hard', 'struggle', 'challenge', 'problem', 'issue',
    'confused', 'unclear', 'complicated', 'overwhelming', 'pressure'
  ];
  
  const calmIndicators = [
    'simple', 'straightforward', 'easy', 'clear', 'understand', 'comfortable',
    'familiar', 'natural', 'smooth', 'efficient', 'organized'
  ];
  
  const motivationIndicators = [
    'excited', 'passionate', 'interested', 'eager', 'enthusiastic', 'love',
    'enjoy', 'like', 'want', 'goal', 'achieve', 'improve', 'learn', 'grow'
  ];
  
  const positiveWords = [
    'good', 'great', 'excellent', 'effective', 'efficient', 'optimal', 'best',
    'improve', 'enhance', 'benefit', 'advantage', 'success', 'achieve', 'solve',
    'perfect', 'amazing', 'wonderful', 'fantastic', 'outstanding'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'difficult', 'problem', 'issue', 'fail', 'error', 'wrong',
    'hard', 'challenge', 'struggle', 'confuse', 'unclear', 'uncertain',
    'terrible', 'awful', 'horrible', 'worst', 'disappointing'
  ];
  
  // Count indicators
  const nervousCount = countIndicators(combinedText, nervousIndicators);
  const confidentCount = countIndicators(combinedText, confidentIndicators);
  const stressCount = countIndicators(combinedText, stressIndicators);
  const calmCount = countIndicators(combinedText, calmIndicators);
  const motivationCount = countIndicators(combinedText, motivationIndicators);
  const positiveCount = countIndicators(combinedText, positiveWords);
  const negativeCount = countIndicators(combinedText, negativeWords);
  
  // Calculate emotion scores
  const totalWords = combinedText.split(/\s+/).length;
  const nervousness = Math.min(100, (nervousCount / Math.max(totalWords / 50, 1)) * 100);
  const confidence = Math.min(100, 50 + (confidentCount / Math.max(totalWords / 50, 1)) * 50);
  const stress = Math.min(100, (stressCount / Math.max(totalWords / 50, 1)) * 100);
  const calmness = Math.min(100, 50 + (calmCount / Math.max(totalWords / 50, 1)) * 50);
  const motivation = Math.min(100, 50 + (motivationCount / Math.max(totalWords / 50, 1)) * 50);
  
  // Calculate overall sentiment
  const sentimentScore = Math.max(0, Math.min(100, 50 + (positiveCount - negativeCount) * 5));
  
  let overall: 'positive' | 'neutral' | 'negative';
  if (sentimentScore >= 60) overall = 'positive';
  else if (sentimentScore >= 40) overall = 'neutral';
  else overall = 'negative';
  
  // Generate emotional tone description
  const emotionalTone = generateEmotionalTone({
    nervousness,
    confidence,
    stress,
    calmness,
    motivation
  });
  
  return {
    overall,
    score: Math.round(sentimentScore),
    emotions: {
      nervousness: Math.round(nervousness),
      confidence: Math.round(confidence),
      stress: Math.round(stress),
      calmness: Math.round(calmness),
      motivation: Math.round(motivation)
    },
    emotionalTone
  };
}

/**
 * Analyze behavioral indicators from interview responses
 */
export function analyzeBehavior(answers: string[], questions: string[]): BehaviorAnalysis {
  // Communication Clarity
  const avgWordCount = answers.reduce((sum, a) => sum + a.split(/\s+/).length, 0) / answers.length;
  const avgSentenceLength = calculateAvgSentenceLength(answers);
  const fillerCount = countTotalFillers(answers);
  
  let communicationClarity = 50;
  if (avgSentenceLength >= 15 && avgSentenceLength <= 25) communicationClarity += 20;
  if (fillerCount < answers.length * 2) communicationClarity += 15;
  if (avgWordCount >= 40) communicationClarity += 15;
  
  // Consistency
  const consistency = analyzeConsistency(answers);
  
  // Tone Variation
  const toneVariation = analyzeToneVariation(answers);
  
  // Trustworthiness (linguistic cues)
  const trustworthiness = analyzeTrustworthiness(answers);
  
  // Professionalism
  const professionalism = analyzeProfessionalism(answers);
  
  // Engagement
  const engagement = analyzeEngagement(answers, questions);
  
  return {
    communicationClarity: Math.min(100, Math.round(communicationClarity)),
    consistency: Math.round(consistency),
    toneVariation: Math.round(toneVariation),
    trustworthiness: Math.round(trustworthiness),
    professionalism: Math.round(professionalism),
    engagement: Math.round(engagement)
  };
}

/**
 * Analyze language quality
 */
export function analyzeLanguageQuality(answers: string[]): LanguageQuality {
  const combinedText = answers.join(' ');
  const words = combinedText.split(/\s+/);
  const totalWords = words.length;
  
  // Grammar (basic heuristics)
  const grammar = analyzeGrammar(combinedText);
  
  // Fluency
  const fluency = analyzeFluency(answers);
  
  // Vocabulary
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const lexicalDiversity = uniqueWords.size / Math.max(totalWords, 1);
  const vocabulary = Math.min(100, lexicalDiversity * 150);
  
  // Relevance (based on technical terms and question keywords)
  const relevance = 70; // Base score, enhanced by context
  
  // Hesitation
  const fillerWords = countTotalFillers(answers);
  const hesitation = Math.min(100, (fillerWords / Math.max(answers.length, 1)) * 20);
  
  return {
    grammar: Math.round(grammar),
    fluency: Math.round(fluency),
    vocabulary: Math.round(vocabulary),
    relevance: Math.round(relevance),
    hesitation: Math.round(hesitation),
    fillerWords
  };
}

/**
 * Generate comprehensive behavior report
 */
export function generateComprehensiveBehaviorReport(
  answers: string[],
  questions: string[]
): ComprehensiveBehaviorReport {
  const sentiment = analyzeSentimentAndEmotions(answers);
  const behavior = analyzeBehavior(answers, questions);
  const language = analyzeLanguageQuality(answers);
  
  // Calculate overall behavior score
  const overallBehaviorScore = Math.round(
    (sentiment.score * 0.2 +
      behavior.communicationClarity * 0.15 +
      behavior.consistency * 0.1 +
      behavior.trustworthiness * 0.15 +
      behavior.professionalism * 0.15 +
      behavior.engagement * 0.1 +
      language.grammar * 0.05 +
      language.fluency * 0.05 +
      language.vocabulary * 0.05)
  );
  
  // Generate behavior summary
  const behaviorSummary = generateBehaviorSummary(sentiment, behavior, language);
  
  // Generate emotional profile
  const emotionalProfile = generateEmotionalProfile(sentiment);
  
  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(sentiment, behavior, language);
  
  return {
    sentiment,
    behavior,
    language,
    overallBehaviorScore,
    behaviorSummary,
    emotionalProfile,
    recommendedActions
  };
}

// Helper Functions

function countIndicators(text: string, indicators: string[]): number {
  let count = 0;
  indicators.forEach(indicator => {
    const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) count += matches.length;
  });
  return count;
}

function calculateAvgSentenceLength(answers: string[]): number {
  const sentences = answers.join(' ').split(/[.!?]+/).filter(s => s.trim().length > 0);
  const totalWords = answers.join(' ').split(/\s+/).length;
  return totalWords / Math.max(sentences.length, 1);
}

function countTotalFillers(answers: string[]): number {
  const fillers = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'sort of', 'kind of'];
  const combinedText = answers.join(' ').toLowerCase();
  return countIndicators(combinedText, fillers);
}

function analyzeConsistency(answers: string[]): number {
  // Check for consistent terminology and style
  let score = 70; // Base score
  
  // Check if answers maintain similar depth
  const wordCounts = answers.map(a => a.split(/\s+/).length);
  const avgWordCount = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const variance = wordCounts.reduce((sum, count) => sum + Math.pow(count - avgWordCount, 2), 0) / wordCounts.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = more consistent
  if (stdDev < avgWordCount * 0.3) score += 20;
  else if (stdDev < avgWordCount * 0.5) score += 10;
  else score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeToneVariation(answers: string[]): number {
  // Analyze variation in tone across answers
  let score = 50;
  
  // Check for varied sentence structures
  const hasQuestions = answers.some(a => a.includes('?'));
  const hasExclamations = answers.some(a => a.includes('!'));
  const hasLongSentences = answers.some(a => a.split(/\s+/).length > 50);
  const hasShortSentences = answers.some(a => a.split(/\s+/).length < 20);
  
  if (hasQuestions || hasExclamations) score += 10;
  if (hasLongSentences && hasShortSentences) score += 20;
  
  return Math.min(100, score);
}

function analyzeTrustworthiness(answers: string[]): number {
  const combinedText = answers.join(' ').toLowerCase();
  
  // Trust indicators
  const trustIndicators = [
    'experience', 'worked', 'implemented', 'developed', 'created', 'built',
    'achieved', 'completed', 'delivered', 'managed', 'led', 'designed'
  ];
  
  // Distrust indicators
  const distrustIndicators = [
    'i think', 'maybe', 'probably', 'i guess', 'not sure', 'uncertain',
    'confused', 'don\'t know', 'can\'t remember'
  ];
  
  const trustCount = countIndicators(combinedText, trustIndicators);
  const distrustCount = countIndicators(combinedText, distrustIndicators);
  
  let score = 60;
  score += trustCount * 5;
  score -= distrustCount * 3;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeProfessionalism(answers: string[]): number {
  const combinedText = answers.join(' ').toLowerCase();
  
  // Professional indicators
  const professionalTerms = [
    'implement', 'develop', 'design', 'architecture', 'solution', 'approach',
    'methodology', 'framework', 'best practice', 'optimize', 'efficient',
    'scalable', 'maintainable', 'robust', 'reliable'
  ];
  
  // Unprofessional indicators
  const unprofessionalTerms = [
    'stuff', 'things', 'whatever', 'dunno', 'gonna', 'wanna', 'yeah', 'nah'
  ];
  
  const professionalCount = countIndicators(combinedText, professionalTerms);
  const unprofessionalCount = countIndicators(combinedText, unprofessionalTerms);
  
  let score = 60;
  score += professionalCount * 4;
  score -= unprofessionalCount * 10;
  
  // Check for proper capitalization and punctuation
  const properSentences = answers.filter(a => /^[A-Z]/.test(a.trim()) && /[.!?]$/.test(a.trim())).length;
  score += (properSentences / answers.length) * 20;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeEngagement(answers: string[], questions: string[]): number {
  let score = 50;
  
  // Check answer completeness
  const answeredAll = answers.length === questions.length;
  if (answeredAll) score += 20;
  
  // Check answer length (engaged candidates provide detailed answers)
  const avgWordCount = answers.reduce((sum, a) => sum + a.split(/\s+/).length, 0) / answers.length;
  if (avgWordCount >= 60) score += 20;
  else if (avgWordCount >= 40) score += 10;
  else if (avgWordCount < 20) score -= 20;
  
  // Check for examples (engaged candidates provide examples)
  const hasExamples = answers.some(a => /for example|for instance|such as|like|e\.g\./i.test(a));
  if (hasExamples) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

function analyzeGrammar(text: string): number {
  let score = 70; // Base score
  
  // Check for basic grammar patterns
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Check capitalization
  const properlyCapitalized = sentences.filter(s => /^[A-Z]/.test(s.trim())).length;
  score += (properlyCapitalized / sentences.length) * 15;
  
  // Check for complete sentences
  const completeSentences = sentences.filter(s => s.trim().split(/\s+/).length >= 3).length;
  score += (completeSentences / sentences.length) * 15;
  
  return Math.min(100, score);
}

function analyzeFluency(answers: string[]): number {
  let score = 60;
  
  // Check for smooth flow
  const fillerCount = countTotalFillers(answers);
  const totalWords = answers.join(' ').split(/\s+/).length;
  const fillerRatio = fillerCount / Math.max(totalWords, 1);
  
  if (fillerRatio < 0.02) score += 30;
  else if (fillerRatio < 0.05) score += 20;
  else if (fillerRatio < 0.10) score += 10;
  else score -= 20;
  
  // Check for varied vocabulary
  const words = answers.join(' ').toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const diversity = uniqueWords.size / Math.max(words.length, 1);
  
  if (diversity > 0.7) score += 10;
  else if (diversity > 0.5) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function generateEmotionalTone(emotions: any): string {
  const { nervousness, confidence, stress, calmness, motivation } = emotions;
  
  if (confidence >= 70 && calmness >= 60 && motivation >= 60) {
    return 'Confident, calm, and motivated - ideal interview demeanor';
  } else if (nervousness >= 60 || stress >= 60) {
    return 'Nervous and stressed - may benefit from relaxation techniques';
  } else if (confidence < 40 && motivation < 40) {
    return 'Low confidence and motivation - needs encouragement';
  } else if (confidence >= 60 && nervousness < 40) {
    return 'Confident and composed - good professional presence';
  } else {
    return 'Balanced emotional state with room for improvement';
  }
}

function generateBehaviorSummary(sentiment: SentimentAnalysis, behavior: BehaviorAnalysis, language: LanguageQuality): string {
  let summary = '';
  
  // Sentiment summary
  summary += `Overall sentiment is ${sentiment.overall} (${sentiment.score}/100). `;
  summary += `${sentiment.emotionalTone}. `;
  
  // Behavior summary
  if (behavior.professionalism >= 75) {
    summary += `Demonstrates high professionalism (${behavior.professionalism}/100). `;
  } else if (behavior.professionalism < 50) {
    summary += `Professionalism needs improvement (${behavior.professionalism}/100). `;
  }
  
  if (behavior.communicationClarity >= 70) {
    summary += `Communication is clear and effective. `;
  } else {
    summary += `Communication clarity could be enhanced. `;
  }
  
  // Language summary
  if (language.hesitation > 50) {
    summary += `High hesitation detected (${language.fillerWords} filler words). `;
  } else if (language.hesitation < 20) {
    summary += `Speaks fluently with minimal hesitation. `;
  }
  
  return summary.trim();
}

function generateEmotionalProfile(sentiment: SentimentAnalysis): string {
  const { emotions } = sentiment;
  let profile = 'Emotional Profile: ';
  
  const traits: string[] = [];
  
  if (emotions.confidence >= 70) traits.push('Highly Confident');
  else if (emotions.confidence >= 50) traits.push('Moderately Confident');
  else traits.push('Low Confidence');
  
  if (emotions.nervousness >= 60) traits.push('Nervous');
  else if (emotions.nervousness < 30) traits.push('Calm');
  
  if (emotions.stress >= 60) traits.push('Stressed');
  else if (emotions.stress < 30) traits.push('Relaxed');
  
  if (emotions.motivation >= 70) traits.push('Highly Motivated');
  else if (emotions.motivation < 40) traits.push('Low Motivation');
  
  profile += traits.join(', ');
  
  return profile;
}

function generateRecommendedActions(sentiment: SentimentAnalysis, behavior: BehaviorAnalysis, language: LanguageQuality): string[] {
  const actions: string[] = [];
  
  if (sentiment.emotions.nervousness >= 60) {
    actions.push('Practice relaxation techniques before interviews to reduce nervousness');
  }
  
  if (sentiment.emotions.confidence < 50) {
    actions.push('Build confidence through mock interviews and technical practice');
  }
  
  if (behavior.communicationClarity < 60) {
    actions.push('Work on structuring answers clearly with introduction, body, and conclusion');
  }
  
  if (language.hesitation > 50) {
    actions.push('Reduce filler words by pausing to think before speaking');
  }
  
  if (behavior.professionalism < 60) {
    actions.push('Use more professional terminology and maintain formal tone');
  }
  
  if (behavior.engagement < 60) {
    actions.push('Provide more detailed answers with practical examples');
  }
  
  if (language.vocabulary < 60) {
    actions.push('Expand technical vocabulary through reading and practice');
  }
  
  if (actions.length === 0) {
    actions.push('Continue maintaining excellent interview performance');
  }
  
  return actions;
}
