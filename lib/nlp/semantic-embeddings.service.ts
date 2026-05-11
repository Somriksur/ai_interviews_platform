/**
 * Semantic Embeddings Service
 * Provides embedding-based semantic similarity and understanding
 * Uses simple but effective TF-IDF + cosine similarity approach
 */

export interface SemanticSimilarityResult {
  score: number; // 0-100
  confidence: number; // 0-100
  matchedConcepts: string[];
  missingConcepts: string[];
}

export interface EmbeddingVector {
  text: string;
  vector: number[];
  metadata?: Record<string, any>;
}

/**
 * Simple but effective semantic similarity calculator
 * Uses TF-IDF-like approach with domain-specific term weighting
 */
export class SemanticEmbeddingsService {
  private domainTerms: Map<string, number> = new Map();
  private stopWords: Set<string> = new Set();
  
  constructor() {
    this.initializeDomainTerms();
    this.initializeStopWords();
  }
  
  /**
   * Calculate semantic similarity between two texts
   */
  public calculateSimilarity(text1: string, text2: string): SemanticSimilarityResult {
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);
    
    const vector1 = this.createVector(tokens1);
    const vector2 = this.createVector(tokens2);
    
    const similarity = this.cosineSimilarity(vector1, vector2);
    const score = Math.round(similarity * 100);
    
    // Find matched and missing concepts
    const concepts1 = this.extractConcepts(tokens1);
    const concepts2 = this.extractConcepts(tokens2);
    
    const matchedConcepts = concepts1.filter(c => concepts2.includes(c));
    const missingConcepts = concepts2.filter(c => !concepts1.includes(c));
    
    // Calculate confidence based on text length and concept coverage
    const confidence = this.calculateConfidence(tokens1.length, tokens2.length, matchedConcepts.length);
    
    return {
      score,
      confidence,
      matchedConcepts,
      missingConcepts
    };
  }
  
  /**
   * Group similar skills using semantic similarity
   */
  public groupSimilarSkills(skills: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    const processed = new Set<string>();
    
    const skillCategories = {
      'Frontend': ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript', 'nextjs', 'svelte'],
      'Backend': ['node', 'express', 'django', 'flask', 'spring', 'fastapi', 'nestjs', 'rails'],
      'Database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'firebase', 'dynamodb'],
      'Cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins'],
      'Mobile': ['android', 'ios', 'react native', 'flutter', 'swift', 'kotlin'],
      'AI/ML': ['machine learning', 'tensorflow', 'pytorch', 'nlp', 'computer vision', 'data science'],
      'Testing': ['jest', 'mocha', 'pytest', 'selenium', 'cypress', 'unit testing']
    };
    
    skills.forEach(skill => {
      const lowerSkill = skill.toLowerCase();
      let assigned = false;
      
      for (const [category, keywords] of Object.entries(skillCategories)) {
        if (keywords.some(keyword => lowerSkill.includes(keyword) || keyword.includes(lowerSkill))) {
          if (!groups.has(category)) {
            groups.set(category, []);
          }
          groups.get(category)!.push(skill);
          processed.add(skill);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        if (!groups.has('Other')) {
          groups.set('Other', []);
        }
        groups.get('Other')!.push(skill);
      }
    });
    
    return groups;
  }
  
  /**
   * Calculate concept coverage in answer
   */
  public calculateConceptCoverage(answer: string, expectedConcepts: string[]): {
    coverage: number;
    coveredConcepts: string[];
    missingConcepts: string[];
  } {
    const answerTokens = this.tokenize(answer.toLowerCase());
    const answerText = answerTokens.join(' ');
    
    const coveredConcepts: string[] = [];
    const missingConcepts: string[] = [];
    
    expectedConcepts.forEach(concept => {
      const conceptTokens = this.tokenize(concept.toLowerCase());
      const isPresent = conceptTokens.some(token => answerText.includes(token));
      
      if (isPresent) {
        coveredConcepts.push(concept);
      } else {
        missingConcepts.push(concept);
      }
    });
    
    const coverage = expectedConcepts.length > 0 
      ? Math.round((coveredConcepts.length / expectedConcepts.length) * 100)
      : 0;
    
    return {
      coverage,
      coveredConcepts,
      missingConcepts
    };
  }
  
  private initializeDomainTerms(): void {
    // Technical terms with importance weights
    const terms = [
      // Programming concepts
      ['algorithm', 3.0], ['data structure', 3.0], ['complexity', 2.5], ['optimization', 2.5],
      ['recursion', 2.0], ['iteration', 2.0], ['polymorphism', 2.5], ['inheritance', 2.0],
      
      // Architecture
      ['architecture', 3.0], ['design pattern', 2.5], ['microservices', 2.5], ['scalability', 2.5],
      ['distributed', 2.5], ['monolithic', 2.0], ['serverless', 2.0], ['api', 2.0],
      
      // Development practices
      ['testing', 2.0], ['debugging', 2.0], ['refactoring', 2.0], ['deployment', 2.0],
      ['ci/cd', 2.5], ['version control', 2.0], ['agile', 2.0], ['scrum', 1.5],
      
      // Database
      ['database', 2.5], ['query', 2.0], ['indexing', 2.5], ['normalization', 2.5],
      ['transaction', 2.5], ['acid', 2.5], ['nosql', 2.0], ['sql', 2.0],
      
      // Web
      ['frontend', 2.0], ['backend', 2.0], ['fullstack', 2.0], ['rest', 2.0],
      ['graphql', 2.0], ['authentication', 2.5], ['authorization', 2.5], ['security', 2.5],
      
      // Cloud
      ['cloud', 2.0], ['container', 2.5], ['orchestration', 2.5], ['kubernetes', 2.0],
      ['docker', 2.0], ['aws', 2.0], ['azure', 2.0], ['gcp', 2.0]
    ];
    
    terms.forEach(([term, weight]) => {
      this.domainTerms.set(term as string, weight as number);
    });
  }
  
  private initializeStopWords(): void {
    const words = [
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
      'could', 'may', 'might', 'must', 'can', 'of', 'at', 'by', 'for', 'with',
      'about', 'against', 'between', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
      'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
    ];
    
    words.forEach(word => this.stopWords.add(word));
  }
  
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2 && !this.stopWords.has(token));
  }
  
  private extractConcepts(tokens: string[]): string[] {
    const concepts: string[] = [];
    
    // Extract domain-specific concepts
    tokens.forEach(token => {
      if (this.domainTerms.has(token)) {
        concepts.push(token);
      }
    });
    
    // Extract multi-word concepts (bigrams)
    for (let i = 0; i < tokens.length - 1; i++) {
      const bigram = `${tokens[i]} ${tokens[i + 1]}`;
      if (this.domainTerms.has(bigram)) {
        concepts.push(bigram);
      }
    }
    
    return [...new Set(concepts)];
  }
  
  private createVector(tokens: string[]): Map<string, number> {
    const vector = new Map<string, number>();
    const tokenCounts = new Map<string, number>();
    
    // Count token frequencies
    tokens.forEach(token => {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1);
    });
    
    // Apply TF-IDF-like weighting
    tokenCounts.forEach((count, token) => {
      const tf = count / tokens.length;
      const domainWeight = this.domainTerms.get(token) || 1.0;
      vector.set(token, tf * domainWeight);
    });
    
    return vector;
  }
  
  private cosineSimilarity(vector1: Map<string, number>, vector2: Map<string, number>): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    // Get all unique terms
    const allTerms = new Set([...vector1.keys(), ...vector2.keys()]);
    
    allTerms.forEach(term => {
      const val1 = vector1.get(term) || 0;
      const val2 = vector2.get(term) || 0;
      
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  private calculateConfidence(len1: number, len2: number, matchedCount: number): number {
    // Confidence based on text length and concept matches
    const lengthFactor = Math.min(len1, len2) / Math.max(len1, len2, 1);
    const matchFactor = matchedCount > 0 ? Math.min(matchedCount / 5, 1) : 0;
    
    const confidence = (lengthFactor * 0.4 + matchFactor * 0.6) * 100;
    return Math.round(Math.max(30, Math.min(100, confidence)));
  }
}
