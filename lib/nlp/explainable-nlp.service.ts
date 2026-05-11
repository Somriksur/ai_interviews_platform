/**
 * Explainable AI (XAI) for NLP
 * Provides transparency and interpretability for all NLP scores
 */

export interface ExplainableScore {
  score: number;
  explanation: string;
  reasoning: string[];
  featureContributions: FeatureContribution[];
  highlightedText?: TextHighlight[];
  confidence: number;
}

export interface FeatureContribution {
  feature: string;
  contribution: number; // -100 to +100
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

export interface TextHighlight {
  text: string;
  type: 'strength' | 'weakness' | 'neutral';
  reason: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Explainable NLP Service
 * Makes NLP decisions transparent and interpretable
 */
export class ExplainableNLPService {
  
  /**
   * Create explainable score for technical evaluation
   */
  public explainTechnicalScore(
    score: number,
    answer: string,
    question: string,
    analysis: any
  ): ExplainableScore {
    const reasoning: string[] = [];
    const featureContributions: FeatureContribution[] = [];
    
    // Analyze what contributed to the score
    if (analysis.conceptCoverage !== undefined) {
      const contribution = (analysis.conceptCoverage - 50) * 0.4;
      featureContributions.push({
        feature: 'Concept Coverage',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Covered ${analysis.conceptCoverage}% of expected concepts`
      });
      
      if (analysis.conceptCoverage >= 80) {
        reasoning.push('Comprehensive coverage of key concepts');
      } else if (analysis.conceptCoverage < 50) {
        reasoning.push('Missing several important concepts');
      }
    }
    
    if (analysis.reasoningScore !== undefined) {
      const contribution = (analysis.reasoningScore - 50) * 0.3;
      featureContributions.push({
        feature: 'Logical Reasoning',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Reasoning quality: ${analysis.reasoningScore}/100`
      });
      
      if (analysis.reasoningScore >= 70) {
        reasoning.push('Strong logical reasoning demonstrated');
      } else if (analysis.reasoningScore < 50) {
        reasoning.push('Limited logical structure in explanation');
      }
    }
    
    if (analysis.clarity !== undefined) {
      const contribution = (analysis.clarity - 50) * 0.3;
      featureContributions.push({
        feature: 'Clarity',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Communication clarity: ${analysis.clarity}/100`
      });
      
      if (analysis.clarity >= 75) {
        reasoning.push('Clear and well-articulated response');
      } else if (analysis.clarity < 50) {
        reasoning.push('Response lacks clarity, contains hesitations');
      }
    }
    
    // Highlight important parts of the answer
    const highlights = this.highlightKeyParts(answer, analysis);
    
    // Generate main explanation
    let explanation = this.generateMainExplanation(score, reasoning);
    
    // Add specific feedback
    if (analysis.missingConcepts && analysis.missingConcepts.length > 0) {
      explanation += ` Missing: ${analysis.missingConcepts.slice(0, 3).join(', ')}.`;
    }
    
    return {
      score,
      explanation,
      reasoning,
      featureContributions,
      highlightedText: highlights,
      confidence: analysis.confidence || 75
    };
  }
  
  /**
   * Create explainable score for communication evaluation
   */
  public explainCommunicationScore(
    score: number,
    transcript: string[],
    analysis: any
  ): ExplainableScore {
    const reasoning: string[] = [];
    const featureContributions: FeatureContribution[] = [];
    
    // Fluency contribution
    if (analysis.fluency !== undefined) {
      const contribution = (analysis.fluency - 50) * 0.4;
      featureContributions.push({
        feature: 'Fluency',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Speech fluency: ${analysis.fluency}/100`
      });
      
      if (analysis.fluency >= 75) {
        reasoning.push('Fluent communication with minimal hesitations');
      } else if (analysis.fluency < 50) {
        reasoning.push('Frequent hesitations and filler words detected');
      }
    }
    
    // Confidence contribution
    if (analysis.confidence !== undefined) {
      const contribution = (analysis.confidence - 50) * 0.35;
      featureContributions.push({
        feature: 'Confidence',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Communication confidence: ${analysis.confidence}/100`
      });
      
      if (analysis.confidence >= 70) {
        reasoning.push('Confident and assertive communication style');
      } else if (analysis.confidence < 50) {
        reasoning.push('Uncertain language patterns observed');
      }
    }
    
    // Professionalism contribution
    if (analysis.professionalism !== undefined) {
      const contribution = (analysis.professionalism - 50) * 0.25;
      featureContributions.push({
        feature: 'Professionalism',
        contribution: Math.round(contribution),
        impact: contribution > 0 ? 'positive' : contribution < 0 ? 'negative' : 'neutral',
        description: `Professional tone: ${analysis.professionalism}/100`
      });
      
      if (analysis.professionalism >= 75) {
        reasoning.push('Professional and appropriate language use');
      } else if (analysis.professionalism < 50) {
        reasoning.push('Consider using more professional terminology');
      }
    }
    
    const explanation = this.generateMainExplanation(score, reasoning);
    
    return {
      score,
      explanation,
      reasoning,
      featureContributions,
      confidence: 80
    };
  }
  
  /**
   * Create explainable score for resume evaluation
   */
  public explainResumeScore(
    score: number,
    breakdown: { skillsScore: number; projectsScore: number; experienceScore: number },
    skills: any[],
    projects: any[]
  ): ExplainableScore {
    const reasoning: string[] = [];
    const featureContributions: FeatureContribution[] = [];
    
    // Skills contribution
    const skillsContribution = (breakdown.skillsScore / 40) * 40 - 20;
    featureContributions.push({
      feature: 'Skills',
      contribution: Math.round(skillsContribution),
      impact: skillsContribution > 0 ? 'positive' : 'negative',
      description: `${skills.length} skills identified (${breakdown.skillsScore}/40 points)`
    });
    
    if (skills.length >= 10) {
      reasoning.push(`Strong skill set with ${skills.length} identified skills`);
    } else if (skills.length < 5) {
      reasoning.push('Limited skills mentioned in resume');
    }
    
    // Projects contribution
    const projectsContribution = (breakdown.projectsScore / 30) * 30 - 15;
    featureContributions.push({
      feature: 'Projects',
      contribution: Math.round(projectsContribution),
      impact: projectsContribution > 0 ? 'positive' : 'negative',
      description: `${projects.length} projects found (${breakdown.projectsScore}/30 points)`
    });
    
    if (projects.length >= 3) {
      reasoning.push(`Good project experience with ${projects.length} projects`);
    } else if (projects.length === 0) {
      reasoning.push('No projects mentioned - consider adding project work');
    }
    
    // Experience contribution
    const experienceContribution = (breakdown.experienceScore / 30) * 30 - 15;
    featureContributions.push({
      feature: 'Experience Level',
      contribution: Math.round(experienceContribution),
      impact: experienceContribution > 0 ? 'positive' : 'neutral',
      description: `Experience level contributes ${breakdown.experienceScore}/30 points`
    });
    
    const explanation = this.generateMainExplanation(score, reasoning);
    
    return {
      score,
      explanation,
      reasoning,
      featureContributions,
      confidence: 85
    };
  }
  
  /**
   * Highlight key parts of text
   */
  private highlightKeyParts(text: string, analysis: any): TextHighlight[] {
    const highlights: TextHighlight[] = [];
    const lowerText = text.toLowerCase();
    
    // Highlight covered concepts (strengths)
    if (analysis.coveredConcepts && analysis.coveredConcepts.length > 0) {
      analysis.coveredConcepts.forEach((concept: string) => {
        const index = lowerText.indexOf(concept.toLowerCase());
        if (index !== -1) {
          highlights.push({
            text: concept,
            type: 'strength',
            reason: 'Key concept covered',
            startIndex: index,
            endIndex: index + concept.length
          });
        }
      });
    }
    
    // Highlight filler words (weaknesses)
    const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of'];
    fillerWords.forEach(filler => {
      let index = lowerText.indexOf(filler);
      while (index !== -1) {
        highlights.push({
          text: filler,
          type: 'weakness',
          reason: 'Filler word - reduces clarity',
          startIndex: index,
          endIndex: index + filler.length
        });
        index = lowerText.indexOf(filler, index + 1);
      }
    });
    
    // Highlight strong reasoning words (strengths)
    const reasoningWords = ['because', 'therefore', 'thus', 'for example', 'specifically'];
    reasoningWords.forEach(word => {
      const index = lowerText.indexOf(word);
      if (index !== -1) {
        highlights.push({
          text: word,
          type: 'strength',
          reason: 'Strong reasoning indicator',
          startIndex: index,
          endIndex: index + word.length
        });
      }
    });
    
    return highlights.slice(0, 20); // Limit to 20 highlights
  }
  
  /**
   * Generate main explanation text
   */
  private generateMainExplanation(score: number, reasoning: string[]): string {
    let explanation = '';
    
    if (score >= 80) {
      explanation = `Excellent performance (${score}/100). `;
    } else if (score >= 65) {
      explanation = `Good performance (${score}/100). `;
    } else if (score >= 50) {
      explanation = `Satisfactory performance (${score}/100). `;
    } else {
      explanation = `Needs improvement (${score}/100). `;
    }
    
    if (reasoning.length > 0) {
      explanation += reasoning.join('. ') + '.';
    }
    
    return explanation;
  }
  
  /**
   * Compare two scores and explain the difference
   */
  public explainScoreDifference(
    score1: ExplainableScore,
    score2: ExplainableScore,
    label1: string,
    label2: string
  ): string {
    const diff = score1.score - score2.score;
    
    if (Math.abs(diff) < 5) {
      return `${label1} and ${label2} are very similar (difference: ${Math.abs(diff)} points).`;
    }
    
    const better = diff > 0 ? label1 : label2;
    const worse = diff > 0 ? label2 : label1;
    const betterScore = diff > 0 ? score1 : score2;
    const worseScore = diff > 0 ? score2 : score1;
    
    let explanation = `${better} scored ${Math.abs(diff)} points higher than ${worse}. `;
    
    // Find the biggest contributing factor
    const betterContributions = betterScore.featureContributions;
    const worseContributions = worseScore.featureContributions;
    
    betterContributions.forEach(bc => {
      const wc = worseContributions.find(w => w.feature === bc.feature);
      if (wc && bc.contribution - wc.contribution > 10) {
        explanation += `Main difference: ${bc.feature} (${bc.contribution} vs ${wc.contribution}). `;
      }
    });
    
    return explanation;
  }
}
