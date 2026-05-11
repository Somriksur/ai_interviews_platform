/**
 * AI Learning Path & Skill Gap Engine
 * Transforms HireFlow into an AI coaching system
 * Provides personalized learning recommendations
 */

export interface StudentData {
  studentId: string;
  resumeSkills: string[];
  domain?: string;
  experienceLevel?: string;
  evaluationScores?: {
    technical: number;
    communication: number;
    problemSolving: number;
    overall: number;
  };
  semanticGaps?: {
    missingConcepts: string[];
    weakAreas: string[];
  };
  interviewCount?: number;
}

export interface SkillGap {
  skill: string;
  currentLevel: 'none' | 'beginner' | 'intermediate' | 'advanced';
  requiredLevel: 'intermediate' | 'advanced' | 'expert';
  priority: 'high' | 'medium' | 'low';
  domain: string;
}

export interface LearningRecommendation {
  title: string;
  type: 'technical' | 'communication' | 'problem-solving' | 'soft-skill';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedTime: string;
  resources: string[];
}

export interface LearningPathResult {
  weakAreas: Array<{
    area: string;
    score: number;
    severity: 'critical' | 'moderate' | 'minor';
  }>;
  skillGaps: SkillGap[];
  recommendations: LearningRecommendation[];
  learningPath: string[];
  priorityFocus: string;
  estimatedTimeToImprove: string;
  confidence: number;
}

/**
 * Learning Path Service
 * AI-powered personalized learning recommendations
 */
export class LearningPathService {
  
  // Skill domains and their key skills
  private readonly SKILL_DOMAINS = {
    'Frontend': ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'typescript'],
    'Backend': ['node', 'express', 'django', 'flask', 'spring', 'api', 'rest'],
    'Database': ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'database design'],
    'DSA': ['algorithms', 'data structures', 'complexity', 'sorting', 'searching', 'trees', 'graphs'],
    'System Design': ['scalability', 'microservices', 'load balancing', 'caching', 'distributed systems'],
    'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'aws', 'azure', 'cloud'],
    'Communication': ['presentation', 'articulation', 'clarity', 'confidence', 'storytelling']
  };
  
  // Required skills by experience level
  private readonly REQUIRED_SKILLS = {
    'fresher': ['programming basics', 'data structures', 'algorithms', 'one framework'],
    'junior': ['data structures', 'algorithms', 'framework', 'database', 'api design'],
    'mid': ['system design', 'architecture', 'multiple frameworks', 'database optimization', 'testing'],
    'senior': ['system design', 'architecture', 'leadership', 'mentoring', 'scalability', 'performance']
  };
  
  /**
   * Generate personalized learning path
   */
  public generateLearningPath(studentData: StudentData): LearningPathResult {
    console.log('🎓 Generating AI learning path...');
    
    // Step 1: Identify weak areas
    const weakAreas = this.identifyWeakAreas(studentData);
    
    // Step 2: Identify skill gaps
    const skillGaps = this.identifySkillGaps(studentData);
    
    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations(weakAreas, skillGaps, studentData);
    
    // Step 4: Create step-by-step learning path
    const learningPath = this.createLearningPath(recommendations);
    
    // Step 5: Determine priority focus
    const priorityFocus = this.determinePriorityFocus(weakAreas, skillGaps);
    
    // Step 6: Estimate time to improve
    const estimatedTimeToImprove = this.estimateTimeToImprove(weakAreas, skillGaps);
    
    // Step 7: Calculate confidence in recommendations
    const confidence = this.calculateConfidence(studentData);
    
    console.log('✅ Learning path generated successfully');
    
    return {
      weakAreas,
      skillGaps,
      recommendations,
      learningPath,
      priorityFocus,
      estimatedTimeToImprove,
      confidence
    };
  }
  
  /**
   * Identify weak areas from evaluation scores
   */
  private identifyWeakAreas(studentData: StudentData): Array<{
    area: string;
    score: number;
    severity: 'critical' | 'moderate' | 'minor';
  }> {
    const weakAreas: Array<{ area: string; score: number; severity: 'critical' | 'moderate' | 'minor' }> = [];
    
    if (!studentData.evaluationScores) {
      return weakAreas;
    }
    
    const { technical, communication, problemSolving } = studentData.evaluationScores;
    
    // Technical skills
    if (technical < 70) {
      weakAreas.push({
        area: 'Technical Knowledge',
        score: technical,
        severity: technical < 50 ? 'critical' : technical < 60 ? 'moderate' : 'minor'
      });
    }
    
    // Communication skills
    if (communication < 70) {
      weakAreas.push({
        area: 'Communication Skills',
        score: communication,
        severity: communication < 50 ? 'critical' : communication < 60 ? 'moderate' : 'minor'
      });
    }
    
    // Problem solving
    if (problemSolving < 70) {
      weakAreas.push({
        area: 'Problem Solving',
        score: problemSolving,
        severity: problemSolving < 50 ? 'critical' : problemSolving < 60 ? 'moderate' : 'minor'
      });
    }
    
    // Add semantic gaps if available
    if (studentData.semanticGaps?.weakAreas) {
      studentData.semanticGaps.weakAreas.forEach(area => {
        if (!weakAreas.find(wa => wa.area === area)) {
          weakAreas.push({
            area,
            score: 50, // Default score for semantic gaps
            severity: 'moderate'
          });
        }
      });
    }
    
    return weakAreas.sort((a, b) => a.score - b.score); // Sort by score (worst first)
  }
  
  /**
   * Identify skill gaps based on resume and required skills
   */
  private identifySkillGaps(studentData: StudentData): SkillGap[] {
    const skillGaps: SkillGap[] = [];
    const resumeSkillsLower = studentData.resumeSkills.map(s => s.toLowerCase());
    const experienceLevel = studentData.experienceLevel || 'fresher';
    
    // Get required skills for experience level
    const requiredSkills = this.REQUIRED_SKILLS[experienceLevel as keyof typeof this.REQUIRED_SKILLS] || [];
    
    // Check each required skill
    requiredSkills.forEach(requiredSkill => {
      const hasSkill = resumeSkillsLower.some(skill => 
        skill.includes(requiredSkill.toLowerCase()) || 
        requiredSkill.toLowerCase().includes(skill)
      );
      
      if (!hasSkill) {
        skillGaps.push({
          skill: requiredSkill,
          currentLevel: 'none',
          requiredLevel: experienceLevel === 'fresher' ? 'intermediate' : 'advanced',
          priority: 'high',
          domain: this.mapSkillToDomain(requiredSkill)
        });
      }
    });
    
    // Add missing concepts from semantic analysis
    if (studentData.semanticGaps?.missingConcepts) {
      studentData.semanticGaps.missingConcepts.forEach(concept => {
        if (!skillGaps.find(sg => sg.skill === concept)) {
          skillGaps.push({
            skill: concept,
            currentLevel: 'beginner',
            requiredLevel: 'intermediate',
            priority: 'medium',
            domain: this.mapSkillToDomain(concept)
          });
        }
      });
    }
    
    // Check domain-specific skills
    if (studentData.domain) {
      const domainSkills = this.SKILL_DOMAINS[studentData.domain as keyof typeof this.SKILL_DOMAINS] || [];
      domainSkills.forEach(domainSkill => {
        const hasSkill = resumeSkillsLower.some(skill => 
          skill.includes(domainSkill.toLowerCase())
        );
        
        if (!hasSkill && skillGaps.length < 10) { // Limit to 10 gaps
          skillGaps.push({
            skill: domainSkill,
            currentLevel: 'none',
            requiredLevel: 'intermediate',
            priority: 'medium',
            domain: studentData.domain!
          });
        }
      });
    }
    
    return skillGaps.slice(0, 10); // Limit to top 10 gaps
  }
  
  /**
   * Map skill to domain
   */
  private mapSkillToDomain(skill: string): string {
    const skillLower = skill.toLowerCase();
    
    for (const [domain, skills] of Object.entries(this.SKILL_DOMAINS)) {
      if (skills.some(s => skillLower.includes(s) || s.includes(skillLower))) {
        return domain;
      }
    }
    
    return 'General';
  }
  
  /**
   * Generate learning recommendations
   */
  private generateRecommendations(
    weakAreas: any[],
    skillGaps: SkillGap[],
    studentData: StudentData
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];
    
    // Recommendations for weak areas
    weakAreas.forEach(weakArea => {
      if (weakArea.area === 'Technical Knowledge') {
        recommendations.push({
          title: 'Strengthen Technical Fundamentals',
          type: 'technical',
          priority: weakArea.severity === 'critical' ? 'high' : 'medium',
          description: 'Focus on core technical concepts and hands-on practice',
          estimatedTime: '4-6 weeks',
          resources: [
            'Practice coding problems on LeetCode/HackerRank',
            'Build 2-3 projects in your domain',
            'Review fundamental concepts daily'
          ]
        });
      } else if (weakArea.area === 'Communication Skills') {
        recommendations.push({
          title: 'Improve Communication & Articulation',
          type: 'communication',
          priority: weakArea.severity === 'critical' ? 'high' : 'medium',
          description: 'Practice explaining technical concepts clearly and confidently',
          estimatedTime: '2-3 weeks',
          resources: [
            'Practice mock interviews with peers',
            'Record yourself explaining concepts',
            'Join public speaking groups or Toastmasters'
          ]
        });
      } else if (weakArea.area === 'Problem Solving') {
        recommendations.push({
          title: 'Enhance Problem-Solving Skills',
          type: 'problem-solving',
          priority: 'high',
          description: 'Develop structured approach to solving complex problems',
          estimatedTime: '3-4 weeks',
          resources: [
            'Practice DSA problems daily (start easy, progress to medium)',
            'Learn problem-solving patterns and techniques',
            'Participate in coding contests'
          ]
        });
      }
    });
    
    // Recommendations for skill gaps (top 3 priority)
    const topSkillGaps = skillGaps
      .filter(sg => sg.priority === 'high')
      .slice(0, 3);
    
    topSkillGaps.forEach(gap => {
      recommendations.push({
        title: `Learn ${gap.skill}`,
        type: 'technical',
        priority: gap.priority,
        description: `Develop ${gap.requiredLevel} level proficiency in ${gap.skill}`,
        estimatedTime: gap.currentLevel === 'none' ? '3-4 weeks' : '2-3 weeks',
        resources: [
          `Complete online course on ${gap.skill}`,
          `Build a project using ${gap.skill}`,
          `Read documentation and best practices`
        ]
      });
    });
    
    // Add domain-specific recommendations
    if (studentData.domain) {
      recommendations.push({
        title: `Master ${studentData.domain} Development`,
        type: 'technical',
        priority: 'medium',
        description: `Become proficient in ${studentData.domain} technologies and best practices`,
        estimatedTime: '6-8 weeks',
        resources: [
          `Build 3-4 ${studentData.domain} projects`,
          `Study ${studentData.domain} design patterns`,
          `Contribute to open-source ${studentData.domain} projects`
        ]
      });
    }
    
    // Add interview preparation recommendation
    if ((studentData.interviewCount || 0) < 3) {
      recommendations.push({
        title: 'Interview Preparation & Practice',
        type: 'soft-skill',
        priority: 'high',
        description: 'Build confidence through regular mock interviews',
        estimatedTime: 'Ongoing',
        resources: [
          'Schedule weekly mock interviews',
          'Practice common interview questions',
          'Review and learn from each interview'
        ]
      });
    }
    
    return recommendations.slice(0, 8); // Limit to 8 recommendations
  }
  
  /**
   * Create step-by-step learning path
   */
  private createLearningPath(recommendations: LearningRecommendation[]): string[] {
    const learningPath: string[] = [];
    
    // Sort by priority
    const sortedRecs = [...recommendations].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Create sequential steps
    sortedRecs.forEach((rec, index) => {
      learningPath.push(`Step ${index + 1}: ${rec.title}`);
      
      // Add first resource as sub-step
      if (rec.resources.length > 0) {
        learningPath.push(`  → ${rec.resources[0]}`);
      }
    });
    
    // Add final step
    learningPath.push('Final Step: Apply for positions and continue practicing');
    
    return learningPath;
  }
  
  /**
   * Determine priority focus area
   */
  private determinePriorityFocus(weakAreas: any[], skillGaps: SkillGap[]): string {
    // Find most critical weak area
    const criticalArea = weakAreas.find(wa => wa.severity === 'critical');
    if (criticalArea) {
      return criticalArea.area;
    }
    
    // Find highest priority skill gap
    const highPriorityGap = skillGaps.find(sg => sg.priority === 'high');
    if (highPriorityGap) {
      return `${highPriorityGap.skill} (${highPriorityGap.domain})`;
    }
    
    // Default to first weak area
    if (weakAreas.length > 0) {
      return weakAreas[0].area;
    }
    
    return 'Continue building on existing strengths';
  }
  
  /**
   * Estimate time to improve
   */
  private estimateTimeToImprove(weakAreas: any[], skillGaps: SkillGap[]): string {
    const criticalCount = weakAreas.filter(wa => wa.severity === 'critical').length;
    const moderateCount = weakAreas.filter(wa => wa.severity === 'moderate').length;
    const highPriorityGaps = skillGaps.filter(sg => sg.priority === 'high').length;
    
    // Calculate weeks needed
    let weeks = 0;
    weeks += criticalCount * 6; // 6 weeks per critical area
    weeks += moderateCount * 4; // 4 weeks per moderate area
    weeks += highPriorityGaps * 3; // 3 weeks per high priority gap
    
    if (weeks === 0) {
      return '2-3 weeks for refinement';
    } else if (weeks <= 4) {
      return '3-4 weeks with focused effort';
    } else if (weeks <= 8) {
      return '6-8 weeks with consistent practice';
    } else if (weeks <= 12) {
      return '2-3 months with dedicated learning';
    } else {
      return '3-4 months with structured learning plan';
    }
  }
  
  /**
   * Calculate confidence in recommendations
   */
  private calculateConfidence(studentData: StudentData): number {
    let confidence = 50; // Base confidence
    
    // Higher confidence if we have evaluation scores
    if (studentData.evaluationScores) {
      confidence += 20;
    }
    
    // Higher confidence if we have resume skills
    if (studentData.resumeSkills && studentData.resumeSkills.length > 0) {
      confidence += 15;
    }
    
    // Higher confidence if we have semantic gaps
    if (studentData.semanticGaps) {
      confidence += 15;
    }
    
    return Math.min(100, confidence);
  }
}
