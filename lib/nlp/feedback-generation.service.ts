/**
 * LLM-Powered Feedback Generation Service
 * Generates professional, human-like, personalized feedback
 */

import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export interface FeedbackResult {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
  tone: 'professional' | 'encouraging' | 'constructive';
  personalization: {
    candidateName?: string;
    role?: string;
    specificExamples: string[];
  };
}

/**
 * Feedback Generation Service
 * Uses LLM to generate human-like, personalized feedback
 */
export class FeedbackGenerationService {
  
  /**
   * Generate comprehensive feedback using LLM
   */
  public async generateFeedback(input: {
    candidateName?: string;
    role: string;
    scores: {
      technical: number;
      communication: number;
      problemSolving: number;
      overall: number;
    };
    analysis: {
      strengths: string[];
      weaknesses: string[];
      coveredConcepts?: string[];
      missingConcepts?: string[];
      emotionalProfile?: string;
    };
    transcript?: string[];
  }): Promise<FeedbackResult> {
    
    const systemPrompt = `You are an expert interview feedback specialist. Generate professional, constructive, and personalized feedback for candidates.

Your feedback should be:
1. PROFESSIONAL: Use formal but warm language
2. HUMAN-LIKE: Sound natural, not robotic
3. PERSONALIZED: Reference specific examples from the interview
4. CONSTRUCTIVE: Focus on growth and improvement
5. BALANCED: Acknowledge strengths while addressing areas for improvement
6. ACTIONABLE: Provide specific, implementable suggestions

Tone guidelines:
- Be encouraging and supportive
- Avoid harsh criticism
- Use "you" to make it personal
- Be specific with examples
- End on a positive note`;

    const userPrompt = this.buildFeedbackPrompt(input);
    
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7, // Balanced creativity
        max_tokens: 2000
      });
      
      const responseText = completion.choices[0]?.message?.content || '';
      
      // Parse structured response
      return this.parseFeedbackResponse(responseText, input);
      
    } catch (error) {
      console.error('Feedback generation error:', error);
      
      // Fallback to rule-based feedback
      return this.generateFallbackFeedback(input);
    }
  }
  
  /**
   * Build prompt for LLM
   */
  private buildFeedbackPrompt(input: any): string {
    const { candidateName, role, scores, analysis, transcript } = input;
    
    let prompt = `Generate interview feedback for ${candidateName || 'the candidate'} who interviewed for the ${role} position.\n\n`;
    
    prompt += `SCORES:\n`;
    prompt += `- Technical: ${scores.technical}/100\n`;
    prompt += `- Communication: ${scores.communication}/100\n`;
    prompt += `- Problem Solving: ${scores.problemSolving}/100\n`;
    prompt += `- Overall: ${scores.overall}/100\n\n`;
    
    if (analysis.strengths && analysis.strengths.length > 0) {
      prompt += `IDENTIFIED STRENGTHS:\n`;
      analysis.strengths.forEach((s: string) => prompt += `- ${s}\n`);
      prompt += `\n`;
    }
    
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      prompt += `AREAS FOR IMPROVEMENT:\n`;
      analysis.weaknesses.forEach((w: string) => prompt += `- ${w}\n`);
      prompt += `\n`;
    }
    
    if (analysis.coveredConcepts && analysis.coveredConcepts.length > 0) {
      prompt += `CONCEPTS COVERED: ${analysis.coveredConcepts.join(', ')}\n\n`;
    }
    
    if (analysis.missingConcepts && analysis.missingConcepts.length > 0) {
      prompt += `CONCEPTS TO IMPROVE: ${analysis.missingConcepts.join(', ')}\n\n`;
    }
    
    if (analysis.emotionalProfile) {
      prompt += `EMOTIONAL PROFILE: ${analysis.emotionalProfile}\n\n`;
    }
    
    prompt += `Please provide feedback in the following JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["area 1", "area 2"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "summary": "A 2-3 sentence overall summary that is encouraging and constructive"
}

Make the feedback:
- Specific and actionable
- Professional yet warm
- Focused on growth
- Personalized to the candidate's performance`;
    
    return prompt;
  }
  
  /**
   * Parse LLM response into structured feedback
   */
  private parseFeedbackResponse(responseText: string, input: any): FeedbackResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        return {
          strengths: parsed.strengths || [],
          weaknesses: parsed.weaknesses || [],
          suggestions: parsed.suggestions || [],
          summary: parsed.summary || 'Overall, you demonstrated good potential.',
          tone: 'professional',
          personalization: {
            candidateName: input.candidateName,
            role: input.role,
            specificExamples: this.extractSpecificExamples(input)
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
    }
    
    // Fallback parsing
    return this.generateFallbackFeedback(input);
  }
  
  /**
   * Generate fallback feedback using rules
   */
  private generateFallbackFeedback(input: any): FeedbackResult {
    const { scores, analysis, role } = input;
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    
    // Generate strengths based on scores
    if (scores.technical >= 75) {
      strengths.push(`Strong technical knowledge demonstrated for the ${role} position`);
    }
    if (scores.communication >= 75) {
      strengths.push('Excellent communication skills with clear articulation');
    }
    if (scores.problemSolving >= 75) {
      strengths.push('Impressive problem-solving approach and analytical thinking');
    }
    
    // Add analysis strengths
    if (analysis.strengths && analysis.strengths.length > 0) {
      strengths.push(...analysis.strengths.slice(0, 3));
    }
    
    // Generate weaknesses based on scores
    if (scores.technical < 60) {
      weaknesses.push('Technical knowledge could be strengthened');
      suggestions.push('Focus on deepening your understanding of core technical concepts');
    }
    if (scores.communication < 60) {
      weaknesses.push('Communication clarity needs improvement');
      suggestions.push('Practice explaining technical concepts more clearly and concisely');
    }
    if (scores.problemSolving < 60) {
      weaknesses.push('Problem-solving approach could be more structured');
      suggestions.push('Work on breaking down problems systematically before solving');
    }
    
    // Add analysis weaknesses
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      weaknesses.push(...analysis.weaknesses.slice(0, 2));
    }
    
    // Add concept-based suggestions
    if (analysis.missingConcepts && analysis.missingConcepts.length > 0) {
      suggestions.push(`Review these concepts: ${analysis.missingConcepts.slice(0, 3).join(', ')}`);
    }
    
    // General suggestions
    if (suggestions.length < 3) {
      suggestions.push('Continue practicing mock interviews to build confidence');
      suggestions.push('Stay updated with latest industry trends and technologies');
    }
    
    // Generate summary
    let summary = '';
    if (scores.overall >= 75) {
      summary = `You demonstrated strong capabilities for the ${role} position. Your technical skills and communication are commendable. Keep building on these strengths!`;
    } else if (scores.overall >= 60) {
      summary = `You showed good potential for the ${role} position. With focused improvement in the identified areas, you'll be well-positioned for success.`;
    } else {
      summary = `Thank you for your interest in the ${role} position. We encourage you to work on the suggested areas and continue developing your skills.`;
    }
    
    return {
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 3),
      suggestions: suggestions.slice(0, 5),
      summary,
      tone: 'professional',
      personalization: {
        candidateName: input.candidateName,
        role: input.role,
        specificExamples: this.extractSpecificExamples(input)
      }
    };
  }
  
  /**
   * Extract specific examples from interview
   */
  private extractSpecificExamples(input: any): string[] {
    const examples: string[] = [];
    
    if (input.analysis.coveredConcepts && input.analysis.coveredConcepts.length > 0) {
      examples.push(`Demonstrated understanding of ${input.analysis.coveredConcepts[0]}`);
    }
    
    if (input.scores.technical >= 80) {
      examples.push('Showed strong technical expertise in responses');
    }
    
    if (input.scores.communication >= 80) {
      examples.push('Communicated ideas clearly and professionally');
    }
    
    return examples;
  }
  
  /**
   * Generate quick feedback summary (for UI preview)
   */
  public generateQuickSummary(scores: any): string {
    const overall = scores.overall || 0;
    
    if (overall >= 80) {
      return 'Excellent performance across all areas. Strong candidate.';
    } else if (overall >= 65) {
      return 'Good performance with some areas for improvement.';
    } else if (overall >= 50) {
      return 'Satisfactory performance. Several areas need development.';
    } else {
      return 'Performance below expectations. Significant improvement needed.';
    }
  }
}
