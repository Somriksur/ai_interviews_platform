/**
 * Advanced Emotion Detection System
 * Industry-level emotion analysis with deep psychological profiling
 */

export interface EmotionVector {
  // Primary Emotions (Plutchik's Wheel)
  joy: number;           // 0-100
  trust: number;         // 0-100
  fear: number;          // 0-100
  surprise: number;      // 0-100
  sadness: number;       // 0-100
  disgust: number;       // 0-100
  anger: number;         // 0-100
  anticipation: number;  // 0-100
  
  // Secondary Emotions
  optimism: number;      // joy + anticipation
  love: number;          // joy + trust
  submission: number;    // trust + fear
  awe: number;           // fear + surprise
  disappointment: number; // surprise + sadness
  remorse: number;       // sadness + disgust
  contempt: number;      // disgust + anger
  aggressiveness: number; // anger + anticipation
}

export interface PsychologicalProfile {
  // Big Five Personality Traits
  openness: number;           // 0-100
  conscientiousness: number;  // 0-100
  extraversion: number;       // 0-100
  agreeableness: number;      // 0-100
  neuroticism: number;        // 0-100
  
  // Emotional Intelligence
  selfAwareness: number;      // 0-100
  selfRegulation: number;     // 0-100
  motivation: number;         // 0-100
  empathy: number;           // 0-100
  socialSkills: number;      // 0-100
  
  // Cognitive Abilities
  analyticalThinking: number; // 0-100
  creativity: number;         // 0-100
  problemSolving: number;     // 0-100
  decisionMaking: number;     // 0-100
  adaptability: number;       // 0-100
}

export interface CommunicationAnalysis {
  // Verbal Communication
  articulation: number;       // 0-100
  vocabulary: number;         // 0-100
  grammar: number;           // 0-100
  fluency: number;           // 0-100
  coherence: number;         // 0-100
  
  // Non-verbal Indicators (from text analysis)
  confidence: number;        // 0-100
  assertiveness: number;     // 0-100
  enthusiasm: number;        // 0-100
  professionalism: number;   // 0-100
  authenticity: number;      // 0-100
  
  // Interaction Patterns
  responsiveness: number;    // 0-100
  engagement: number;        // 0-100
  listening: number;         // 0-100
  clarification: number;     // 0-100
  storytelling: number;      // 0-100
}

export interface StressIndicators {
  // Linguistic Stress Markers
  hesitation: number;        // 0-100
  repetition: number;        // 0-100
  fillerWords: number;       // count
  incompleteThoughts: number; // count
  
  // Cognitive Load Indicators
  complexityReduction: number; // 0-100
  responseTime: number;       // estimated seconds
  errorRate: number;          // 0-100
  
  // Emotional Stress
  anxiety: number;           // 0-100
  frustration: number;       // 0-100
  overwhelm: number;         // 0-100
  
  // Overall Stress Level
  overallStress: number;     // 0-100
  stressLevel: 'low' | 'moderate' | 'high' | 'severe';
}

export interface AdvancedEmotionReport {
  emotions: EmotionVector;
  psychology: PsychologicalProfile;
  communication: CommunicationAnalysis;
  stress: StressIndicators;
  
  // Temporal Analysis
  emotionalJourney: EmotionVector[];  // emotion changes over time
  stressProgression: number[];        // stress levels over time
  
  // Insights
  dominantEmotions: string[];
  emotionalStability: number;         // 0-100
  communicationEffectiveness: number; // 0-100
  overallWellbeing: number;          // 0-100
  
  // Recommendations
  emotionalRecommendations: string[];
  communicationImprovements: string[];
  stressManagement: string[];
  
  // Metadata
  analysisDepth: 'basic' | 'intermediate' | 'advanced' | 'expert';
  confidenceScore: number;           // 0-100
  processingTime: number;            // milliseconds
}

/**
 * Advanced emotion detection using multiple linguistic models
 */
export class AdvancedEmotionDetector {
  private emotionLexicon: Map<string, EmotionVector>;
  private personalityMarkers: Map<string, Partial<PsychologicalProfile>>;
  private stressIndicators: Map<string, number>;
  
  constructor() {
    this.initializeLexicons();
  }
  
  /**
   * Analyze emotions with deep psychological profiling
   */
  public analyzeEmotions(
    transcript: string[], 
    timestamps?: Date[]
  ): AdvancedEmotionReport {
    const startTime = Date.now();
    
    // Preprocess text
    const processedText = this.preprocessText(transcript);
    
    // Extract emotion vectors
    const emotions = this.extractEmotionVector(processedText);
    
    // Analyze psychological profile
    const psychology = this.analyzePsychology(processedText);
    
    // Analyze communication patterns
    const communication = this.analyzeCommunication(processedText, transcript);
    
    // Detect stress indicators
    const stress = this.analyzeStress(processedText, transcript);
    
    // Temporal analysis
    const { emotionalJourney, stressProgression } = this.analyzeTemporalPatterns(
      transcript, 
      timestamps
    );
    
    // Generate insights
    const insights = this.generateInsights(emotions, psychology, communication, stress);
    
    // Calculate derived metrics
    const emotionalStability = this.calculateEmotionalStability(emotionalJourney);
    const communicationEffectiveness = this.calculateCommunicationEffectiveness(communication);
    const overallWellbeing = this.calculateOverallWellbeing(emotions, stress);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      emotions, 
      psychology, 
      communication, 
      stress
    );
    
    const processingTime = Date.now() - startTime;
    
    return {
      emotions,
      psychology,
      communication,
      stress,
      emotionalJourney,
      stressProgression,
      ...insights,
      emotionalStability,
      communicationEffectiveness,
      overallWellbeing,
      ...recommendations,
      analysisDepth: 'expert',
      confidenceScore: this.calculateConfidenceScore(processedText.length),
      processingTime
    };
  }
  
  private initializeLexicons(): void {
    // Initialize comprehensive emotion lexicon
    this.emotionLexicon = new Map([
      // Joy indicators
      ['excited', { joy: 85, trust: 20, fear: 0, surprise: 30, sadness: 0, disgust: 0, anger: 0, anticipation: 40, optimism: 62, love: 52, submission: 10, awe: 15, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 20 }],
      ['happy', { joy: 90, trust: 30, fear: 0, surprise: 10, sadness: 0, disgust: 0, anger: 0, anticipation: 20, optimism: 55, love: 60, submission: 15, awe: 5, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 10 }],
      ['thrilled', { joy: 95, trust: 25, fear: 0, surprise: 40, sadness: 0, disgust: 0, anger: 0, anticipation: 50, optimism: 72, love: 60, submission: 12, awe: 20, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 25 }],
      ['delighted', { joy: 88, trust: 35, fear: 0, surprise: 25, sadness: 0, disgust: 0, anger: 0, anticipation: 30, optimism: 59, love: 61, submission: 17, awe: 12, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 15 }],
      
      // Trust indicators
      ['confident', { joy: 40, trust: 85, fear: 10, surprise: 5, sadness: 0, disgust: 0, anger: 0, anticipation: 60, optimism: 50, love: 62, submission: 47, awe: 7, disappointment: 2, remorse: 0, contempt: 0, aggressiveness: 30 }],
      ['certain', { joy: 30, trust: 90, fear: 5, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 50, optimism: 40, love: 60, submission: 47, awe: 2, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 25 }],
      ['reliable', { joy: 25, trust: 88, fear: 0, surprise: 0, sadness: 0, disgust: 0, anger: 0, anticipation: 40, optimism: 32, love: 56, submission: 44, awe: 0, disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 20 }],
      
      // Fear indicators
      ['nervous', { joy: 0, trust: 20, fear: 80, surprise: 30, sadness: 20, disgust: 10, anger: 5, anticipation: 10, optimism: 5, love: 10, submission: 50, awe: 55, disappointment: 25, remorse: 15, contempt: 7, aggressiveness: 7 }],
      ['anxious', { joy: 0, trust: 15, fear: 85, surprise: 25, sadness: 30, disgust: 15, anger: 10, anticipation: 20, optimism: 10, love: 7, submission: 50, awe: 55, disappointment: 27, remorse: 22, contempt: 12, aggressiveness: 15 }],
      ['worried', { joy: 0, trust: 25, fear: 75, surprise: 20, sadness: 40, disgust: 5, anger: 5, anticipation: 30, optimism: 15, love: 12, submission: 50, awe: 47, disappointment: 30, remorse: 22, contempt: 5, aggressiveness: 17 }],
      
      // Surprise indicators
      ['surprised', { joy: 20, trust: 10, fear: 30, surprise: 90, sadness: 5, disgust: 0, anger: 0, anticipation: 15, optimism: 17, love: 15, submission: 20, awe: 60, disappointment: 47, remorse: 2, contempt: 0, aggressiveness: 7 }],
      ['amazed', { joy: 50, trust: 20, fear: 20, surprise: 85, sadness: 0, disgust: 0, anger: 0, anticipation: 25, optimism: 37, love: 35, submission: 20, awe: 52, disappointment: 42, remorse: 0, contempt: 0, aggressiveness: 12 }],
      
      // Sadness indicators
      ['disappointed', { joy: 0, trust: 10, fear: 20, surprise: 40, sadness: 80, disgust: 20, anger: 15, anticipation: 5, optimism: 2, love: 5, submission: 15, awe: 30, disappointment: 60, remorse: 50, contempt: 17, aggressiveness: 10 }],
      ['frustrated', { joy: 0, trust: 5, fear: 30, surprise: 10, sadness: 60, disgust: 40, anger: 70, anticipation: 10, optimism: 5, love: 2, submission: 17, awe: 20, disappointment: 35, remorse: 50, contempt: 55, aggressiveness: 40 }],
      
      // Professional emotions
      ['professional', { joy: 30, trust: 70, fear: 10, surprise: 5, sadness: 0, disgust: 0, anger: 0, anticipation: 40, optimism: 35, love: 50, submission: 40, awe: 7, disappointment: 2, remorse: 0, contempt: 0, aggressiveness: 20 }],
      ['motivated', { joy: 60, trust: 50, fear: 5, surprise: 10, sadness: 0, disgust: 0, anger: 0, anticipation: 80, optimism: 70, love: 55, submission: 27, awe: 7, disappointment: 5, remorse: 0, contempt: 0, aggressiveness: 40 }],
      ['determined', { joy: 40, trust: 60, fear: 10, surprise: 5, sadness: 0, disgust: 0, anger: 20, anticipation: 85, optimism: 62, love: 50, submission: 35, awe: 7, disappointment: 2, remorse: 0, contempt: 10, aggressiveness: 52 }],
    ]);
    
    // Initialize personality markers
    this.personalityMarkers = new Map([
      // Openness markers
      ['creative', { openness: 80, conscientiousness: 20, extraversion: 30, agreeableness: 40, neuroticism: -10 }],
      ['innovative', { openness: 85, conscientiousness: 30, extraversion: 40, agreeableness: 30, neuroticism: -5 }],
      ['curious', { openness: 75, conscientiousness: 10, extraversion: 50, agreeableness: 40, neuroticism: 5 }],
      
      // Conscientiousness markers
      ['organized', { openness: 20, conscientiousness: 85, extraversion: 10, agreeableness: 30, neuroticism: -20 }],
      ['systematic', { openness: 30, conscientiousness: 80, extraversion: 5, agreeableness: 25, neuroticism: -15 }],
      ['detailed', { openness: 25, conscientiousness: 75, extraversion: 0, agreeableness: 20, neuroticism: -10 }],
      
      // Extraversion markers
      ['enthusiastic', { openness: 40, conscientiousness: 20, extraversion: 85, agreeableness: 50, neuroticism: -15 }],
      ['outgoing', { openness: 35, conscientiousness: 15, extraversion: 90, agreeableness: 60, neuroticism: -20 }],
      ['energetic', { openness: 45, conscientiousness: 25, extraversion: 80, agreeableness: 40, neuroticism: -10 }],
      
      // Agreeableness markers
      ['collaborative', { openness: 30, conscientiousness: 40, extraversion: 50, agreeableness: 85, neuroticism: -15 }],
      ['supportive', { openness: 25, conscientiousness: 35, extraversion: 40, agreeableness: 80, neuroticism: -20 }],
      ['helpful', { openness: 20, conscientiousness: 45, extraversion: 45, agreeableness: 75, neuroticism: -10 }],
      
      // Neuroticism markers (negative values reduce neuroticism)
      ['calm', { openness: 10, conscientiousness: 30, extraversion: 20, agreeableness: 40, neuroticism: -80 }],
      ['stable', { openness: 15, conscientiousness: 50, extraversion: 25, agreeableness: 35, neuroticism: -75 }],
      ['resilient', { openness: 25, conscientiousness: 40, extraversion: 35, agreeableness: 30, neuroticism: -70 }],
    ]);
    
    // Initialize stress indicators
    this.stressIndicators = new Map([
      ['um', 15], ['uh', 12], ['like', 8], ['you know', 10],
      ['basically', 6], ['actually', 4], ['literally', 5],
      ['sort of', 8], ['kind of', 7], ['i mean', 9],
      ['well', 3], ['so', 2], ['right', 3], ['okay', 4],
      ['i think', 6], ['maybe', 8], ['probably', 7],
      ['not sure', 12], ['i guess', 10], ['uncertain', 15],
      ['confused', 18], ['difficult', 12], ['hard', 10],
      ['struggle', 16], ['challenge', 8], ['problem', 10]
    ]);
  }
  
  private preprocessText(transcript: string[]): string {
    return transcript
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private extractEmotionVector(text: string): EmotionVector {
    const words = text.split(/\s+/);
    const emotionScores: EmotionVector = {
      joy: 0, trust: 0, fear: 0, surprise: 0,
      sadness: 0, disgust: 0, anger: 0, anticipation: 0,
      optimism: 0, love: 0, submission: 0, awe: 0,
      disappointment: 0, remorse: 0, contempt: 0, aggressiveness: 0
    };
    
    let matchCount = 0;
    
    words.forEach(word => {
      if (this.emotionLexicon.has(word)) {
        const emotions = this.emotionLexicon.get(word)!;
        matchCount++;
        
        // Accumulate emotion scores
        Object.keys(emotions).forEach(emotion => {
          emotionScores[emotion as keyof EmotionVector] += emotions[emotion as keyof EmotionVector];
        });
      }
    });
    
    // Normalize scores
    if (matchCount > 0) {
      Object.keys(emotionScores).forEach(emotion => {
        emotionScores[emotion as keyof EmotionVector] = Math.min(100, 
          emotionScores[emotion as keyof EmotionVector] / matchCount
        );
      });
    }
    
    return emotionScores;
  }
  
  private analyzePsychology(text: string): PsychologicalProfile {
    const words = text.split(/\s+/);
    const profile: PsychologicalProfile = {
      openness: 50, conscientiousness: 50, extraversion: 50,
      agreeableness: 50, neuroticism: 50,
      selfAwareness: 50, selfRegulation: 50, motivation: 50,
      empathy: 50, socialSkills: 50,
      analyticalThinking: 50, creativity: 50, problemSolving: 50,
      decisionMaking: 50, adaptability: 50
    };
    
    let matchCount = 0;
    
    words.forEach(word => {
      if (this.personalityMarkers.has(word)) {
        const markers = this.personalityMarkers.get(word)!;
        matchCount++;
        
        Object.keys(markers).forEach(trait => {
          if (trait in profile) {
            profile[trait as keyof PsychologicalProfile] += markers[trait as keyof PsychologicalProfile] || 0;
          }
        });
      }
    });
    
    // Normalize and clamp values
    Object.keys(profile).forEach(trait => {
      profile[trait as keyof PsychologicalProfile] = Math.max(0, Math.min(100, 
        profile[trait as keyof PsychologicalProfile]
      ));
    });
    
    // Calculate emotional intelligence components
    profile.selfAwareness = this.calculateSelfAwareness(text);
    profile.selfRegulation = this.calculateSelfRegulation(text);
    profile.empathy = this.calculateEmpathy(text);
    profile.socialSkills = this.calculateSocialSkills(text);
    
    // Calculate cognitive abilities
    profile.analyticalThinking = this.calculateAnalyticalThinking(text);
    profile.creativity = this.calculateCreativity(text);
    profile.problemSolving = this.calculateProblemSolving(text);
    profile.decisionMaking = this.calculateDecisionMaking(text);
    profile.adaptability = this.calculateAdaptability(text);
    
    return profile;
  }
  
  private analyzeCommunication(processedText: string, originalTranscript: string[]): CommunicationAnalysis {
    const words = processedText.split(/\s+/);
    const totalWords = words.length;
    
    return {
      articulation: this.calculateArticulation(originalTranscript),
      vocabulary: this.calculateVocabulary(words),
      grammar: this.calculateGrammar(originalTranscript),
      fluency: this.calculateFluency(originalTranscript),
      coherence: this.calculateCoherence(originalTranscript),
      confidence: this.calculateConfidence(processedText),
      assertiveness: this.calculateAssertiveness(processedText),
      enthusiasm: this.calculateEnthusiasm(processedText),
      professionalism: this.calculateProfessionalism(processedText),
      authenticity: this.calculateAuthenticity(processedText),
      responsiveness: this.calculateResponsiveness(originalTranscript),
      engagement: this.calculateEngagement(originalTranscript),
      listening: this.calculateListening(originalTranscript),
      clarification: this.calculateClarification(originalTranscript),
      storytelling: this.calculateStorytelling(originalTranscript)
    };
  }
  
  private analyzeStress(processedText: string, originalTranscript: string[]): StressIndicators {
    const words = processedText.split(/\s+/);
    let fillerCount = 0;
    let stressScore = 0;
    
    words.forEach(word => {
      if (this.stressIndicators.has(word)) {
        fillerCount++;
        stressScore += this.stressIndicators.get(word)!;
      }
    });
    
    const hesitation = Math.min(100, (fillerCount / Math.max(words.length / 50, 1)) * 100);
    const repetition = this.calculateRepetition(originalTranscript);
    const incompleteThoughts = this.calculateIncompleteThoughts(originalTranscript);
    
    const anxiety = this.calculateAnxiety(processedText);
    const frustration = this.calculateFrustration(processedText);
    const overwhelm = this.calculateOverwhelm(processedText);
    
    const overallStress = Math.round(
      (hesitation * 0.3 + anxiety * 0.25 + frustration * 0.2 + 
       overwhelm * 0.15 + repetition * 0.1) / 1
    );
    
    let stressLevel: 'low' | 'moderate' | 'high' | 'severe';
    if (overallStress < 25) stressLevel = 'low';
    else if (overallStress < 50) stressLevel = 'moderate';
    else if (overallStress < 75) stressLevel = 'high';
    else stressLevel = 'severe';
    
    return {
      hesitation: Math.round(hesitation),
      repetition: Math.round(repetition),
      fillerWords: fillerCount,
      incompleteThoughts,
      complexityReduction: this.calculateComplexityReduction(originalTranscript),
      responseTime: this.estimateResponseTime(originalTranscript),
      errorRate: this.calculateErrorRate(originalTranscript),
      anxiety: Math.round(anxiety),
      frustration: Math.round(frustration),
      overwhelm: Math.round(overwhelm),
      overallStress: Math.round(overallStress),
      stressLevel
    };
  }
  
  private analyzeTemporalPatterns(
    transcript: string[], 
    timestamps?: Date[]
  ): { emotionalJourney: EmotionVector[], stressProgression: number[] } {
    const segmentSize = Math.max(1, Math.floor(transcript.length / 5));
    const emotionalJourney: EmotionVector[] = [];
    const stressProgression: number[] = [];
    
    for (let i = 0; i < transcript.length; i += segmentSize) {
      const segment = transcript.slice(i, i + segmentSize);
      const segmentText = this.preprocessText(segment);
      
      // Analyze emotions for this segment
      const emotions = this.extractEmotionVector(segmentText);
      emotionalJourney.push(emotions);
      
      // Analyze stress for this segment
      const stress = this.analyzeStress(segmentText, segment);
      stressProgression.push(stress.overallStress);
    }
    
    return { emotionalJourney, stressProgression };
  }
  
  // Helper methods for detailed analysis
  private calculateSelfAwareness(text: string): number {
    const indicators = ['i feel', 'i realize', 'i understand', 'i know', 'i believe'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateSelfRegulation(text: string): number {
    const indicators = ['control', 'manage', 'handle', 'cope', 'adapt'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateEmpathy(text: string): number {
    const indicators = ['understand', 'perspective', 'others', 'team', 'collaborate'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateSocialSkills(text: string): number {
    const indicators = ['communicate', 'discuss', 'explain', 'share', 'present'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateAnalyticalThinking(text: string): number {
    const indicators = ['analyze', 'evaluate', 'assess', 'examine', 'investigate'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateCreativity(text: string): number {
    const indicators = ['creative', 'innovative', 'design', 'develop', 'build'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateProblemSolving(text: string): number {
    const indicators = ['solve', 'solution', 'approach', 'method', 'strategy'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateDecisionMaking(text: string): number {
    const indicators = ['decide', 'choose', 'select', 'determine', 'conclude'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateAdaptability(text: string): number {
    const indicators = ['adapt', 'flexible', 'adjust', 'change', 'modify'];
    return this.calculateIndicatorScore(text, indicators, 50);
  }
  
  private calculateIndicatorScore(text: string, indicators: string[], baseScore: number): number {
    let count = 0;
    indicators.forEach(indicator => {
      const regex = new RegExp(`\\b${indicator}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    });
    
    const words = text.split(/\s+/).length;
    const score = baseScore + (count / Math.max(words / 100, 1)) * 50;
    return Math.max(0, Math.min(100, score));
  }
  
  // Communication analysis methods
  private calculateArticulation(transcript: string[]): number {
    // Analyze clarity and precision of expression
    let score = 50;
    const avgLength = transcript.reduce((sum, t) => sum + t.length, 0) / transcript.length;
    
    if (avgLength > 100) score += 20;
    else if (avgLength > 50) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateVocabulary(words: string[]): number {
    const uniqueWords = new Set(words);
    const diversity = uniqueWords.size / Math.max(words.length, 1);
    return Math.min(100, diversity * 150);
  }
  
  private calculateGrammar(transcript: string[]): number {
    // Basic grammar analysis
    let score = 70;
    const text = transcript.join(' ');
    
    // Check for proper sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properSentences = sentences.filter(s => /^[A-Z]/.test(s.trim())).length;
    score += (properSentences / sentences.length) * 30;
    
    return Math.min(100, score);
  }
  
  private calculateFluency(transcript: string[]): number {
    const text = transcript.join(' ').toLowerCase();
    const fillers = ['um', 'uh', 'like', 'you know'];
    let fillerCount = 0;
    
    fillers.forEach(filler => {
      const matches = text.match(new RegExp(`\\b${filler}\\b`, 'g'));
      if (matches) fillerCount += matches.length;
    });
    
    const words = text.split(/\s+/).length;
    const fluency = Math.max(0, 100 - (fillerCount / words) * 200);
    return Math.round(fluency);
  }
  
  private calculateCoherence(transcript: string[]): number {
    // Analyze logical flow and connection between ideas
    let score = 60;
    
    const connectors = ['because', 'therefore', 'however', 'moreover', 'furthermore'];
    const text = transcript.join(' ').toLowerCase();
    
    connectors.forEach(connector => {
      if (text.includes(connector)) score += 8;
    });
    
    return Math.min(100, score);
  }
  
  private calculateConfidence(text: string): number {
    const confident = ['definitely', 'certainly', 'sure', 'confident', 'know'];
    const uncertain = ['maybe', 'perhaps', 'i think', 'probably', 'not sure'];
    
    const confidentCount = this.countWords(text, confident);
    const uncertainCount = this.countWords(text, uncertain);
    
    const score = 50 + (confidentCount - uncertainCount) * 10;
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateAssertiveness(text: string): number {
    const assertive = ['will', 'must', 'should', 'need to', 'important'];
    const passive = ['might', 'could', 'would', 'if possible', 'maybe'];
    
    const assertiveCount = this.countWords(text, assertive);
    const passiveCount = this.countWords(text, passive);
    
    const score = 50 + (assertiveCount - passiveCount) * 8;
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateEnthusiasm(text: string): number {
    const enthusiastic = ['excited', 'love', 'passionate', 'amazing', 'fantastic'];
    return this.calculateIndicatorScore(text, enthusiastic, 40);
  }
  
  private calculateProfessionalism(text: string): number {
    const professional = ['implement', 'develop', 'solution', 'approach', 'methodology'];
    const unprofessional = ['stuff', 'things', 'whatever', 'gonna', 'wanna'];
    
    const professionalCount = this.countWords(text, professional);
    const unprofessionalCount = this.countWords(text, unprofessional);
    
    const score = 60 + professionalCount * 5 - unprofessionalCount * 10;
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateAuthenticity(text: string): number {
    // Analyze genuine vs rehearsed responses
    const personal = ['i', 'my', 'me', 'personally', 'experience'];
    const generic = ['one', 'people', 'generally', 'typically', 'usually'];
    
    const personalCount = this.countWords(text, personal);
    const genericCount = this.countWords(text, generic);
    
    const score = 50 + (personalCount - genericCount) * 3;
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateResponsiveness(transcript: string[]): number {
    // Analyze how well responses address questions
    let score = 70;
    
    const avgLength = transcript.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / transcript.length;
    if (avgLength > 50) score += 20;
    else if (avgLength < 20) score -= 20;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private calculateEngagement(transcript: string[]): number {
    let score = 50;
    
    // Check for questions back to interviewer
    const hasQuestions = transcript.some(t => t.includes('?'));
    if (hasQuestions) score += 20;
    
    // Check for examples
    const hasExamples = transcript.some(t => /for example|such as|like when/i.test(t));
    if (hasExamples) score += 15;
    
    return Math.min(100, score);
  }
  
  private calculateListening(transcript: string[]): number {
    // Analyze references to previous questions or building on topics
    const references = ['as you mentioned', 'building on', 'related to', 'following up'];
    const text = transcript.join(' ').toLowerCase();
    
    let score = 50;
    references.forEach(ref => {
      if (text.includes(ref)) score += 12;
    });
    
    return Math.min(100, score);
  }
  
  private calculateClarification(transcript: string[]): number {
    const clarifications = ['to clarify', 'what i mean', 'in other words', 'specifically'];
    const text = transcript.join(' ').toLowerCase();
    
    let score = 50;
    clarifications.forEach(clarif => {
      if (text.includes(clarif)) score += 15;
    });
    
    return Math.min(100, score);
  }
  
  private calculateStorytelling(transcript: string[]): number {
    const narrative = ['first', 'then', 'next', 'finally', 'when', 'after'];
    const text = transcript.join(' ').toLowerCase();
    
    let score = 40;
    narrative.forEach(word => {
      const matches = text.match(new RegExp(`\\b${word}\\b`, 'g'));
      if (matches) score += matches.length * 5;
    });
    
    return Math.min(100, score);
  }
  
  // Stress analysis methods
  private calculateRepetition(transcript: string[]): number {
    const words = transcript.join(' ').toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();
    
    words.forEach(word => {
      if (word.length > 3) { // Only count meaningful words
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    });
    
    let repetitions = 0;
    wordCount.forEach(count => {
      if (count > 2) repetitions += count - 2;
    });
    
    return Math.min(100, (repetitions / words.length) * 200);
  }
  
  private calculateIncompleteThoughts(transcript: string[]): number {
    let incomplete = 0;
    
    transcript.forEach(text => {
      // Check for incomplete sentences
      if (!text.trim().match(/[.!?]$/) && text.length > 10) {
        incomplete++;
      }
      
      // Check for trailing off
      if (text.includes('...') || text.endsWith(' and') || text.endsWith(' but')) {
        incomplete++;
      }
    });
    
    return incomplete;
  }
  
  private calculateComplexityReduction(transcript: string[]): number {
    const avgSentenceLength = transcript.reduce((sum, t) => {
      const sentences = t.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = sentences.reduce((wordSum, s) => wordSum + s.split(/\s+/).length, 0);
      return sum + (words / Math.max(sentences.length, 1));
    }, 0) / transcript.length;
    
    // Lower complexity might indicate stress
    if (avgSentenceLength < 8) return 70;
    if (avgSentenceLength < 12) return 40;
    return 20;
  }
  
  private estimateResponseTime(transcript: string[]): number {
    // Estimate based on response length and complexity
    const avgWords = transcript.reduce((sum, t) => sum + t.split(/\s+/).length, 0) / transcript.length;
    return Math.max(2, avgWords / 3); // Rough estimate: 3 words per second
  }
  
  private calculateErrorRate(transcript: string[]): number {
    const text = transcript.join(' ');
    const errors = (text.match(/\b(teh|adn|nad|hte|taht|waht)\b/g) || []).length;
    const words = text.split(/\s+/).length;
    return Math.min(100, (errors / words) * 1000);
  }
  
  private calculateAnxiety(text: string): number {
    const anxietyWords = ['nervous', 'anxious', 'worried', 'scared', 'afraid'];
    return this.calculateIndicatorScore(text, anxietyWords, 20);
  }
  
  private calculateFrustration(text: string): number {
    const frustrationWords = ['frustrated', 'annoyed', 'difficult', 'hard', 'struggle'];
    return this.calculateIndicatorScore(text, frustrationWords, 20);
  }
  
  private calculateOverwhelm(text: string): number {
    const overwhelmWords = ['overwhelmed', 'too much', 'complicated', 'complex', 'confusing'];
    return this.calculateIndicatorScore(text, overwhelmWords, 15);
  }
  
  // Insight generation methods
  private generateInsights(
    emotions: EmotionVector,
    psychology: PsychologicalProfile,
    communication: CommunicationAnalysis,
    stress: StressIndicators
  ): { dominantEmotions: string[] } {
    const emotionEntries = Object.entries(emotions)
      .filter(([_, value]) => value > 30)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([emotion, _]) => emotion);
    
    return {
      dominantEmotions: emotionEntries
    };
  }
  
  private calculateEmotionalStability(emotionalJourney: EmotionVector[]): number {
    if (emotionalJourney.length < 2) return 50;
    
    let totalVariance = 0;
    const emotions = ['joy', 'trust', 'fear', 'surprise', 'sadness', 'disgust', 'anger', 'anticipation'] as const;
    
    emotions.forEach(emotion => {
      const values = emotionalJourney.map(e => e[emotion]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      totalVariance += variance;
    });
    
    const avgVariance = totalVariance / emotions.length;
    return Math.max(0, Math.min(100, 100 - avgVariance));
  }
  
  private calculateCommunicationEffectiveness(communication: CommunicationAnalysis): number {
    return Math.round(
      (communication.articulation * 0.2 +
       communication.coherence * 0.2 +
       communication.engagement * 0.15 +
       communication.professionalism * 0.15 +
       communication.fluency * 0.15 +
       communication.confidence * 0.15) / 1
    );
  }
  
  private calculateOverallWellbeing(emotions: EmotionVector, stress: StressIndicators): number {
    const positiveEmotions = (emotions.joy + emotions.trust + emotions.anticipation) / 3;
    const negativeEmotions = (emotions.fear + emotions.sadness + emotions.anger) / 3;
    const stressImpact = 100 - stress.overallStress;
    
    return Math.round((positiveEmotions * 0.4 + stressImpact * 0.4 + (100 - negativeEmotions) * 0.2));
  }
  
  private generateRecommendations(
    emotions: EmotionVector,
    psychology: PsychologicalProfile,
    communication: CommunicationAnalysis,
    stress: StressIndicators
  ): {
    emotionalRecommendations: string[];
    communicationImprovements: string[];
    stressManagement: string[];
  } {
    const emotionalRecommendations: string[] = [];
    const communicationImprovements: string[] = [];
    const stressManagement: string[] = [];
    
    // Emotional recommendations
    if (emotions.fear > 60) {
      emotionalRecommendations.push('Practice confidence-building exercises and positive visualization');
    }
    if (emotions.joy < 30) {
      emotionalRecommendations.push('Focus on highlighting achievements and positive experiences');
    }
    if (emotions.trust < 40) {
      emotionalRecommendations.push('Build credibility through specific examples and evidence');
    }
    
    // Communication improvements
    if (communication.articulation < 60) {
      communicationImprovements.push('Practice clear and structured communication techniques');
    }
    if (communication.engagement < 50) {
      communicationImprovements.push('Increase engagement through storytelling and examples');
    }
    if (communication.professionalism < 70) {
      communicationImprovements.push('Use more professional terminology and formal language');
    }
    
    // Stress management
    if (stress.overallStress > 60) {
      stressManagement.push('Implement relaxation techniques before and during interviews');
    }
    if (stress.hesitation > 50) {
      stressManagement.push('Practice pausing to think rather than using filler words');
    }
    if (stress.anxiety > 70) {
      stressManagement.push('Consider anxiety management strategies and mock interview practice');
    }
    
    return {
      emotionalRecommendations,
      communicationImprovements,
      stressManagement
    };
  }
  
  private calculateConfidenceScore(textLength: number): number {
    // Confidence based on analysis depth
    if (textLength < 100) return 60;
    if (textLength < 500) return 75;
    if (textLength < 1000) return 85;
    return 95;
  }
  
  private countWords(text: string, words: string[]): number {
    let count = 0;
    words.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  }
}