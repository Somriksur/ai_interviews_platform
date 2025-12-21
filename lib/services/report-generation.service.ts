/**
 * Advanced Report Generation Service
 * Creates comprehensive, industry-level interview reports for all stakeholders
 */

import { EvaluationReport } from './nlp-evaluation.service';
import { AdvancedEmotionReport } from '../nlp/advanced-emotion-detection';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  targetAudience: 'organization' | 'college' | 'student' | 'all';
  sections: ReportSection[];
}

export interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'scores' | 'analysis' | 'recommendations' | 'transcript' | 'charts' | 'insights';
  content: any;
  priority: number; // 1-10, higher = more important
  confidential?: boolean;
}

export interface GeneratedReport {
  id: string;
  studentId: string;
  driveId: string;
  sessionId: string;
  targetAudience: 'organization' | 'college' | 'student';
  
  // Report content
  executiveSummary: string;
  sections: ReportSection[];
  
  // Metadata
  generatedAt: Date;
  reportVersion: string;
  confidentialityLevel: 'public' | 'internal' | 'confidential';
  
  // Export formats
  formats: {
    html: string;
    pdf?: Buffer;
    json: any;
  };
}

export class ReportGenerationService {
  private templates: Map<string, ReportTemplate> = new Map();
  
  constructor() {
    this.initializeTemplates();
  }
  
  /**
   * Generate comprehensive report for specific audience
   */
  public async generateReport(
    evaluation: EvaluationReport,
    targetAudience: 'organization' | 'college' | 'student',
    includeTranscript: boolean = true
  ): Promise<GeneratedReport> {
    console.log(`📊 Generating ${targetAudience} report for session ${evaluation.sessionId}`);
    
    const template = this.getTemplateForAudience(targetAudience);
    const sections = await this.generateSections(evaluation, template, includeTranscript);
    const executiveSummary = this.generateExecutiveSummary(evaluation, targetAudience);
    
    const report: GeneratedReport = {
      id: `report_${evaluation.sessionId}_${targetAudience}_${Date.now()}`,
      studentId: evaluation.studentId,
      driveId: evaluation.driveId,
      sessionId: evaluation.sessionId,
      targetAudience,
      executiveSummary,
      sections,
      generatedAt: new Date(),
      reportVersion: '2.0.0',
      confidentialityLevel: this.getConfidentialityLevel(targetAudience),
      formats: {
        html: await this.generateHTML(executiveSummary, sections, targetAudience),
        json: this.generateJSON(evaluation, sections)
      }
    };
    
    console.log(`✅ Generated ${targetAudience} report with ${sections.length} sections`);
    return report;
  }
  
  /**
   * Generate reports for all stakeholders
   */
  public async generateAllReports(
    evaluation: EvaluationReport,
    includeTranscript: boolean = true
  ): Promise<{
    organizationReport: GeneratedReport;
    collegeReport: GeneratedReport;
    studentReport: GeneratedReport;
  }> {
    console.log('📊 Generating comprehensive reports for all stakeholders...');
    
    const [organizationReport, collegeReport, studentReport] = await Promise.all([
      this.generateReport(evaluation, 'organization', includeTranscript),
      this.generateReport(evaluation, 'college', includeTranscript),
      this.generateReport(evaluation, 'student', false) // Students get limited transcript access
    ]);
    
    return {
      organizationReport,
      collegeReport,
      studentReport
    };
  }
  
  private initializeTemplates(): void {
    this.templates = new Map([
      ['organization', {
        id: 'organization',
        name: 'Organization Hiring Report',
        description: 'Comprehensive evaluation for hiring decisions',
        targetAudience: 'organization',
        sections: [
          { id: 'executive_summary', title: 'Executive Summary', type: 'summary', content: null, priority: 10 },
          { id: 'recommendation', title: 'Hiring Recommendation', type: 'summary', content: null, priority: 9 },
          { id: 'scores_overview', title: 'Performance Scores', type: 'scores', content: null, priority: 8 },
          { id: 'technical_analysis', title: 'Technical Assessment', type: 'analysis', content: null, priority: 8 },
          { id: 'emotional_intelligence', title: 'Emotional Intelligence Analysis', type: 'analysis', content: null, priority: 7 },
          { id: 'personality_profile', title: 'Personality & Work Style', type: 'insights', content: null, priority: 7 },
          { id: 'communication_analysis', title: 'Communication Skills', type: 'analysis', content: null, priority: 6 },
          { id: 'stress_resilience', title: 'Stress Management & Resilience', type: 'analysis', content: null, priority: 6 },
          { id: 'cultural_fit', title: 'Cultural Fit Assessment', type: 'insights', content: null, priority: 6 },
          { id: 'leadership_potential', title: 'Leadership Potential', type: 'insights', content: null, priority: 5 },
          { id: 'teamwork_assessment', title: 'Teamwork & Collaboration', type: 'insights', content: null, priority: 5 },
          { id: 'detailed_transcript', title: 'Interview Transcript', type: 'transcript', content: null, priority: 4 },
          { id: 'question_analysis', title: 'Question-by-Question Analysis', type: 'analysis', content: null, priority: 4 },
          { id: 'development_recommendations', title: 'Development Recommendations', type: 'recommendations', content: null, priority: 3 }
        ]
      }],
      ['college', {
        id: 'college',
        name: 'College Performance Report',
        description: 'Student performance analysis for academic institutions',
        targetAudience: 'college',
        sections: [
          { id: 'student_overview', title: 'Student Performance Overview', type: 'summary', content: null, priority: 10 },
          { id: 'academic_readiness', title: 'Industry Readiness Assessment', type: 'analysis', content: null, priority: 9 },
          { id: 'skills_analysis', title: 'Technical & Soft Skills Analysis', type: 'analysis', content: null, priority: 8 },
          { id: 'emotional_development', title: 'Emotional & Social Development', type: 'analysis', content: null, priority: 7 },
          { id: 'communication_skills', title: 'Communication & Presentation Skills', type: 'analysis', content: null, priority: 7 },
          { id: 'interview_performance', title: 'Interview Performance Metrics', type: 'scores', content: null, priority: 6 },
          { id: 'improvement_areas', title: 'Areas for Academic Support', type: 'recommendations', content: null, priority: 6 },
          { id: 'career_guidance', title: 'Career Development Guidance', type: 'recommendations', content: null, priority: 5 },
          { id: 'transcript_summary', title: 'Interview Summary', type: 'transcript', content: null, priority: 4 }
        ]
      }],
      ['student', {
        id: 'student',
        name: 'Personal Development Report',
        description: 'Personalized feedback and growth recommendations',
        targetAudience: 'student',
        sections: [
          { id: 'personal_summary', title: 'Your Interview Performance', type: 'summary', content: null, priority: 10 },
          { id: 'strengths_celebration', title: 'Your Key Strengths', type: 'analysis', content: null, priority: 9 },
          { id: 'growth_opportunities', title: 'Growth Opportunities', type: 'recommendations', content: null, priority: 8 },
          { id: 'skill_development', title: 'Skill Development Plan', type: 'recommendations', content: null, priority: 8 },
          { id: 'emotional_insights', title: 'Emotional Intelligence Insights', type: 'insights', content: null, priority: 7 },
          { id: 'communication_feedback', title: 'Communication Feedback', type: 'analysis', content: null, priority: 6 },
          { id: 'confidence_building', title: 'Confidence & Stress Management', type: 'recommendations', content: null, priority: 6 },
          { id: 'next_steps', title: 'Next Steps & Action Plan', type: 'recommendations', content: null, priority: 5 },
          { id: 'resources', title: 'Learning Resources', type: 'recommendations', content: null, priority: 4 }
        ]
      }]
    ]);
  }
  
  private getTemplateForAudience(audience: 'organization' | 'college' | 'student'): ReportTemplate {
    const template = this.templates.get(audience);
    if (!template) {
      throw new Error(`No template found for audience: ${audience}`);
    }
    return template;
  }
  
  private async generateSections(
    evaluation: EvaluationReport,
    template: ReportTemplate,
    includeTranscript: boolean
  ): Promise<ReportSection[]> {
    const sections: ReportSection[] = [];
    
    for (const sectionTemplate of template.sections) {
      if (sectionTemplate.type === 'transcript' && !includeTranscript) {
        continue; // Skip transcript if not requested
      }
      
      const section: ReportSection = {
        ...sectionTemplate,
        content: await this.generateSectionContent(sectionTemplate, evaluation, template.targetAudience)
      };
      
      sections.push(section);
    }
    
    return sections.sort((a, b) => b.priority - a.priority);
  }
  
  private async generateSectionContent(
    sectionTemplate: ReportSection,
    evaluation: EvaluationReport,
    audience: 'organization' | 'college' | 'student'
  ): Promise<any> {
    const { id, type } = sectionTemplate;
    const { scores, emotionAnalysis, insights, feedback } = evaluation;
    
    switch (id) {
      case 'executive_summary':
      case 'student_overview':
      case 'personal_summary':
        return this.generateExecutiveSummaryContent(evaluation, audience);
        
      case 'recommendation':
        return this.generateRecommendationContent(evaluation);
        
      case 'scores_overview':
      case 'interview_performance':
        return this.generateScoresContent(evaluation);
        
      case 'technical_analysis':
      case 'academic_readiness':
        return this.generateTechnicalAnalysisContent(evaluation);
        
      case 'emotional_intelligence':
      case 'emotional_development':
      case 'emotional_insights':
        return this.generateEmotionalIntelligenceContent(evaluation, audience);
        
      case 'personality_profile':
        return this.generatePersonalityProfileContent(evaluation);
        
      case 'communication_analysis':
      case 'communication_skills':
      case 'communication_feedback':
        return this.generateCommunicationAnalysisContent(evaluation, audience);
        
      case 'stress_resilience':
      case 'confidence_building':
        return this.generateStressResilienceContent(evaluation, audience);
        
      case 'cultural_fit':
        return this.generateCulturalFitContent(evaluation);
        
      case 'leadership_potential':
        return this.generateLeadershipPotentialContent(evaluation);
        
      case 'teamwork_assessment':
        return this.generateTeamworkAssessmentContent(evaluation);
        
      case 'detailed_transcript':
      case 'transcript_summary':
        return this.generateTranscriptContent(evaluation, audience);
        
      case 'question_analysis':
        return this.generateQuestionAnalysisContent(evaluation);
        
      case 'strengths_celebration':
        return this.generateStrengthsContent(evaluation, audience);
        
      case 'growth_opportunities':
      case 'improvement_areas':
      case 'development_recommendations':
      case 'skill_development':
      case 'career_guidance':
      case 'next_steps':
        return this.generateRecommendationsContent(evaluation, audience, id);
        
      case 'resources':
        return this.generateResourcesContent(evaluation);
        
      default:
        return { message: 'Content not available' };
    }
  }
  
  private generateExecutiveSummary(evaluation: EvaluationReport, audience: string): string {
    const { scores, emotionAnalysis, recommendation, insights } = evaluation;
    
    let summary = '';
    
    if (audience === 'organization') {
      summary = `This candidate demonstrates ${this.getPerformanceLevel(scores.overall)} overall performance with a ${recommendation.replace('-', ' ')} rating. `;
      summary += `Technical competency scored ${scores.technical}/100, while communication effectiveness rated ${scores.communication}/100. `;
      summary += `The candidate shows ${emotionAnalysis.emotionalStability >= 70 ? 'excellent' : emotionAnalysis.emotionalStability >= 50 ? 'good' : 'developing'} emotional stability `;
      summary += `and ${insights.stressResilience >= 70 ? 'strong' : insights.stressResilience >= 50 ? 'adequate' : 'limited'} stress resilience. `;
      summary += `Cultural fit assessment indicates ${insights.culturalFit >= 70 ? 'strong alignment' : insights.culturalFit >= 50 ? 'good potential' : 'some concerns'} with organizational values.`;
    } else if (audience === 'college') {
      summary = `This student demonstrates ${this.getPerformanceLevel(scores.overall)} industry readiness with strong potential for professional growth. `;
      summary += `Academic preparation is reflected in technical skills (${scores.technical}/100) and problem-solving abilities (${scores.problemSolving}/100). `;
      summary += `Communication and interpersonal skills show ${scores.communication >= 70 ? 'excellent' : scores.communication >= 50 ? 'good' : 'developing'} development. `;
      summary += `Emotional intelligence and professional maturity indicate readiness for workplace challenges.`;
    } else {
      summary = `Your interview performance shows ${this.getPerformanceLevel(scores.overall)} results with many positive highlights. `;
      summary += `You demonstrated strong capabilities in several areas and have clear opportunities for continued growth. `;
      summary += `Your emotional intelligence and communication style reflect ${insights.emotionalIntelligence >= 70 ? 'excellent' : insights.emotionalIntelligence >= 50 ? 'good' : 'developing'} interpersonal skills. `;
      summary += `This report provides personalized insights to help you continue developing your professional capabilities.`;
    }
    
    return summary;
  }
  
  private generateExecutiveSummaryContent(evaluation: EvaluationReport, audience: string): any {
    return {
      summary: this.generateExecutiveSummary(evaluation, audience),
      keyMetrics: {
        overallScore: evaluation.scores.overall,
        recommendation: evaluation.recommendation,
        emotionalStability: evaluation.emotionAnalysis.emotionalStability,
        stressResilience: evaluation.insights.stressResilience,
        culturalFit: evaluation.insights.culturalFit
      }
    };
  }
  
  private generateRecommendationContent(evaluation: EvaluationReport): any {
    const { recommendation, scores, emotionAnalysis } = evaluation;
    
    let reasoning = '';
    let nextSteps = [];
    
    switch (recommendation) {
      case 'highly-recommended':
        reasoning = 'Exceptional candidate with strong technical skills, excellent communication, and outstanding emotional intelligence. Demonstrates high potential for immediate contribution and long-term growth.';
        nextSteps = ['Proceed with offer', 'Consider for leadership track', 'Plan comprehensive onboarding'];
        break;
      case 'recommended':
        reasoning = 'Strong candidate with solid technical foundation and good interpersonal skills. Shows potential for growth with proper support and development.';
        nextSteps = ['Proceed with offer', 'Plan targeted development', 'Assign experienced mentor'];
        break;
      case 'consider':
        reasoning = 'Candidate shows promise but has areas requiring development. Technical skills are adequate but communication or emotional factors need attention.';
        nextSteps = ['Consider with conditions', 'Plan intensive support', 'Regular performance reviews'];
        break;
      case 'not-recommended':
        reasoning = 'Significant concerns in technical competency, communication effectiveness, or emotional readiness that would impact job performance.';
        nextSteps = ['Do not proceed', 'Provide feedback', 'Suggest reapplication timeline'];
        break;
    }
    
    return {
      recommendation: recommendation.replace('-', ' ').toUpperCase(),
      reasoning,
      nextSteps,
      riskFactors: this.identifyRiskFactors(evaluation),
      strengths: evaluation.feedback.strengths.slice(0, 5)
    };
  }
  
  private generateScoresContent(evaluation: EvaluationReport): any {
    const { scores, emotionAnalysis, insights } = evaluation;
    
    return {
      coreScores: {
        technical: { score: scores.technical, grade: this.getGrade(scores.technical) },
        communication: { score: scores.communication, grade: this.getGrade(scores.communication) },
        problemSolving: { score: scores.problemSolving, grade: this.getGrade(scores.problemSolving) },
        overall: { score: scores.overall, grade: this.getGrade(scores.overall) }
      },
      emotionalScores: {
        emotionalIntelligence: { score: insights.emotionalIntelligence, grade: this.getGrade(insights.emotionalIntelligence) },
        stressResilience: { score: insights.stressResilience, grade: this.getGrade(insights.stressResilience) },
        emotionalStability: { score: emotionAnalysis.emotionalStability, grade: this.getGrade(emotionAnalysis.emotionalStability) }
      },
      professionalScores: {
        culturalFit: { score: insights.culturalFit, grade: this.getGrade(insights.culturalFit) },
        leadershipPotential: { score: insights.leadershipPotential, grade: this.getGrade(insights.leadershipPotential) },
        teamworkAbility: { score: insights.teamworkAbility, grade: this.getGrade(insights.teamworkAbility) }
      },
      benchmarks: {
        industryAverage: 65,
        topPerformers: 85,
        minimumThreshold: 50
      }
    };
  }
  
  private generateTechnicalAnalysisContent(evaluation: EvaluationReport): any {
    return {
      overallAssessment: evaluation.scores.technical,
      strengths: evaluation.feedback.strengths.filter(s => 
        s.toLowerCase().includes('technical') || 
        s.toLowerCase().includes('skill') || 
        s.toLowerCase().includes('knowledge')
      ),
      improvements: evaluation.feedback.improvements.filter(i => 
        i.toLowerCase().includes('technical') || 
        i.toLowerCase().includes('skill') || 
        i.toLowerCase().includes('knowledge')
      ),
      questionAnalysis: evaluation.feedback.questionResponses.map(qr => ({
        question: qr.question,
        score: qr.score,
        feedback: qr.feedback,
        category: this.categorizeQuestion(qr.question)
      }))
    };
  }
  
  private generateEmotionalIntelligenceContent(evaluation: EvaluationReport, audience: string): any {
    const { emotionAnalysis, insights } = evaluation;
    
    const content = {
      overallScore: insights.emotionalIntelligence,
      components: {
        selfAwareness: emotionAnalysis.psychology.selfAwareness,
        selfRegulation: emotionAnalysis.psychology.selfRegulation,
        motivation: emotionAnalysis.psychology.motivation,
        empathy: emotionAnalysis.psychology.empathy,
        socialSkills: emotionAnalysis.psychology.socialSkills
      },
      emotionalProfile: emotionAnalysis.dominantEmotions,
      stability: emotionAnalysis.emotionalStability,
      wellbeing: emotionAnalysis.overallWellbeing
    };
    
    if (audience === 'student') {
      (content as any).developmentTips = [
        'Practice mindfulness to increase self-awareness',
        'Develop emotional vocabulary to better express feelings',
        'Seek feedback from peers and mentors',
        'Practice active listening in conversations',
        'Learn stress management techniques'
      ];
    }
    
    return content;
  }
  
  private generatePersonalityProfileContent(evaluation: EvaluationReport): any {
    const { psychology } = evaluation.emotionAnalysis;
    
    return {
      bigFiveProfile: {
        openness: { score: psychology.openness, description: this.getPersonalityDescription('openness', psychology.openness) },
        conscientiousness: { score: psychology.conscientiousness, description: this.getPersonalityDescription('conscientiousness', psychology.conscientiousness) },
        extraversion: { score: psychology.extraversion, description: this.getPersonalityDescription('extraversion', psychology.extraversion) },
        agreeableness: { score: psychology.agreeableness, description: this.getPersonalityDescription('agreeableness', psychology.agreeableness) },
        neuroticism: { score: psychology.neuroticism, description: this.getPersonalityDescription('neuroticism', psychology.neuroticism) }
      },
      workStyle: evaluation.insights.personalityProfile,
      communicationStyle: evaluation.insights.communicationStyle,
      preferredEnvironment: this.determinePreferredEnvironment(psychology),
      motivationFactors: this.identifyMotivationFactors(psychology)
    };
  }
  
  private generateCommunicationAnalysisContent(evaluation: EvaluationReport, audience: string): any {
    const { communication } = evaluation.emotionAnalysis;
    
    const content = {
      overallEffectiveness: evaluation.emotionAnalysis.communicationEffectiveness,
      components: {
        articulation: communication.articulation,
        vocabulary: communication.vocabulary,
        fluency: communication.fluency,
        coherence: communication.coherence,
        professionalism: communication.professionalism,
        engagement: communication.engagement
      },
      style: evaluation.insights.communicationStyle,
      strengths: this.identifyCommunicationStrengths(communication),
      improvements: this.identifyCommunicationImprovements(communication)
    };
    
    if (audience === 'student') {
      (content as any).practiceExercises = [
        'Record yourself answering practice questions',
        'Join public speaking groups like Toastmasters',
        'Practice the STAR method for behavioral questions',
        'Work on reducing filler words through mindful speaking',
        'Seek opportunities to present to groups'
      ];
    }
    
    return content;
  }
  
  private generateStressResilienceContent(evaluation: EvaluationReport, audience: string): any {
    const { stress } = evaluation.emotionAnalysis;
    
    const content = {
      overallResilience: evaluation.insights.stressResilience,
      stressLevel: stress.stressLevel,
      indicators: {
        hesitation: stress.hesitation,
        anxiety: stress.anxiety,
        overwhelm: stress.overwhelm,
        fillerWords: stress.fillerWords
      },
      copingStrategies: this.identifyCopingStrategies(stress),
      recommendations: evaluation.emotionAnalysis.stressManagement
    };
    
    if (audience === 'student') {
      (content as any).stressManagementTips = [
        'Practice deep breathing exercises before interviews',
        'Prepare thoroughly to build confidence',
        'Use positive visualization techniques',
        'Develop a pre-interview routine',
        'Focus on progress rather than perfection'
      ];
    }
    
    return content;
  }
  
  private generateCulturalFitContent(evaluation: EvaluationReport): any {
    return {
      overallFit: evaluation.insights.culturalFit,
      factors: {
        professionalism: evaluation.emotionAnalysis.communication.professionalism,
        collaboration: evaluation.insights.teamworkAbility,
        adaptability: evaluation.emotionAnalysis.psychology.adaptability,
        values: this.assessValues(evaluation.emotionAnalysis)
      },
      workEnvironmentMatch: this.determineEnvironmentMatch(evaluation),
      teamDynamics: this.assessTeamDynamics(evaluation)
    };
  }
  
  private generateLeadershipPotentialContent(evaluation: EvaluationReport): any {
    return {
      overallPotential: evaluation.insights.leadershipPotential,
      components: {
        confidence: evaluation.emotionAnalysis.communication.confidence,
        assertiveness: evaluation.emotionAnalysis.communication.assertiveness,
        emotionalIntelligence: evaluation.insights.emotionalIntelligence,
        decisionMaking: evaluation.emotionAnalysis.psychology.decisionMaking
      },
      leadershipStyle: this.determineLeadershipStyle(evaluation),
      developmentAreas: this.identifyLeadershipDevelopmentAreas(evaluation)
    };
  }
  
  private generateTeamworkAssessmentContent(evaluation: EvaluationReport): any {
    return {
      overallAbility: evaluation.insights.teamworkAbility,
      components: {
        collaboration: evaluation.emotionAnalysis.psychology.agreeableness,
        communication: evaluation.emotionAnalysis.communication.engagement,
        listening: evaluation.emotionAnalysis.communication.listening,
        empathy: evaluation.emotionAnalysis.psychology.empathy
      },
      teamRole: this.determineTeamRole(evaluation),
      conflictResolution: this.assessConflictResolution(evaluation)
    };
  }
  
  private generateTranscriptContent(evaluation: EvaluationReport, audience: string): any {
    const { transcript } = evaluation;
    
    // Generate extremely detailed transcript with comprehensive analysis
    const detailedTranscript = this.generateDetailedTranscript(evaluation, audience);
    
    if (audience === 'student') {
      // Enhanced transcript for students with more detail but privacy-conscious
      return {
        summary: 'Complete interview transcript with detailed analysis and feedback.',
        conversationFlow: detailedTranscript.conversationFlow,
        keyMoments: detailedTranscript.keyMoments,
        responseAnalysis: detailedTranscript.responseAnalysis,
        emotionalJourney: detailedTranscript.emotionalJourney,
        improvementInsights: detailedTranscript.improvementInsights,
        fullTranscript: detailedTranscript.studentFocusedTranscript
      };
    }
    
    // Full detailed transcript for organizations and colleges
    return {
      fullTranscript: detailedTranscript.completeTranscript,
      interviewerTranscript: detailedTranscript.interviewerTranscript,
      candidateTranscript: detailedTranscript.candidateTranscript,
      conversationFlow: detailedTranscript.conversationFlow,
      questionResponses: detailedTranscript.enhancedQuestionResponses,
      emotionalJourney: detailedTranscript.emotionalJourney,
      stressProgression: detailedTranscript.stressProgression,
      communicationPatterns: detailedTranscript.communicationPatterns,
      interactionAnalysis: detailedTranscript.interactionAnalysis,
      timelineAnalysis: detailedTranscript.timelineAnalysis,
      behavioralObservations: detailedTranscript.behavioralObservations,
      technicalDiscussion: detailedTranscript.technicalDiscussion,
      keyMoments: detailedTranscript.keyMoments,
      responseAnalysis: detailedTranscript.responseAnalysis
    };
  }
  
  private generateQuestionAnalysisContent(evaluation: EvaluationReport): any {
    return {
      responses: evaluation.feedback.questionResponses.map((qr, index) => ({
        questionNumber: index + 1,
        question: qr.question,
        response: qr.response,
        score: qr.score,
        feedback: qr.feedback,
        category: this.categorizeQuestion(qr.question),
        emotionalState: evaluation.transcript.questionResponses[index]?.emotionalState,
        stressLevel: evaluation.transcript.questionResponses[index]?.stressLevel,
        improvements: this.generateQuestionSpecificImprovements(qr)
      })),
      overallPatterns: this.identifyResponsePatterns(evaluation.feedback.questionResponses)
    };
  }
  
  private generateStrengthsContent(evaluation: EvaluationReport, audience: string): any {
    const strengths = evaluation.feedback.strengths;
    
    return {
      topStrengths: strengths.slice(0, 5),
      categories: {
        technical: strengths.filter(s => this.isTechnicalStrength(s)),
        interpersonal: strengths.filter(s => this.isInterpersonalStrength(s)),
        emotional: strengths.filter(s => this.isEmotionalStrength(s))
      },
      evidence: strengths.map(strength => ({
        strength,
        evidence: this.findEvidenceForStrength(strength, evaluation)
      })),
      buildingOnStrengths: audience === 'student' ? this.generateStrengthBuildingTips(strengths) : null
    };
  }
  
  private generateRecommendationsContent(evaluation: EvaluationReport, audience: string, sectionId: string): any {
    const improvements = evaluation.feedback.improvements;
    const emotionalRecs = evaluation.emotionAnalysis.emotionalRecommendations;
    const communicationRecs = evaluation.emotionAnalysis.communicationImprovements;
    const stressRecs = evaluation.emotionAnalysis.stressManagement;
    
    const allRecommendations = [...improvements, ...emotionalRecs, ...communicationRecs, ...stressRecs];
    
    return {
      priority: allRecommendations.slice(0, 3),
      shortTerm: this.categorizeRecommendations(allRecommendations, 'short-term'),
      longTerm: this.categorizeRecommendations(allRecommendations, 'long-term'),
      actionPlan: this.createActionPlan(allRecommendations, audience),
      resources: this.suggestResources(allRecommendations)
    };
  }
  
  private generateResourcesContent(evaluation: EvaluationReport): any {
    const improvements = evaluation.feedback.improvements;
    
    return {
      books: this.suggestBooks(improvements),
      onlineCourses: this.suggestOnlineCourses(improvements),
      practiceTools: this.suggestPracticeTools(improvements),
      communities: this.suggestCommunities(improvements),
      mentorship: this.suggestMentorshipOpportunities(improvements)
    };
  }
  
  private getConfidentialityLevel(audience: string): 'public' | 'internal' | 'confidential' {
    switch (audience) {
      case 'student': return 'public';
      case 'college': return 'internal';
      case 'organization': return 'confidential';
      default: return 'internal';
    }
  }
  
  private async generateHTML(
    executiveSummary: string,
    sections: ReportSection[],
    audience: string
  ): Promise<string> {
    // Generate comprehensive HTML report
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Evaluation Report - ${audience.charAt(0).toUpperCase() + audience.slice(1)}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
        .section { margin-bottom: 30px; padding: 20px; border-left: 4px solid #2563eb; background: #f8fafc; }
        .score { display: inline-block; padding: 10px 20px; border-radius: 25px; color: white; font-weight: bold; margin: 5px; }
        .score.excellent { background: #10b981; }
        .score.good { background: #3b82f6; }
        .score.fair { background: #f59e0b; }
        .score.poor { background: #ef4444; }
        .recommendation { padding: 20px; border-radius: 10px; margin: 20px 0; }
        .recommendation.highly-recommended { background: #d1fae5; border: 2px solid #10b981; }
        .recommendation.recommended { background: #dbeafe; border: 2px solid #3b82f6; }
        .recommendation.consider { background: #fef3c7; border: 2px solid #f59e0b; }
        .recommendation.not-recommended { background: #fee2e2; border: 2px solid #ef4444; }
        .chart { margin: 20px 0; }
        .progress-bar { background: #e5e7eb; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 20px; transition: width 0.3s ease; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .timestamp { color: #6b7280; font-size: 0.9em; }
        .confidential { background: #fef2f2; border: 1px solid #fca5a5; padding: 10px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Interview Evaluation Report</h1>
            <p class="timestamp">Generated on ${new Date().toLocaleDateString()} for ${audience.charAt(0).toUpperCase() + audience.slice(1)}</p>
            ${audience === 'organization' ? '<div class="confidential"><strong>CONFIDENTIAL:</strong> This report contains sensitive evaluation data for hiring purposes only.</div>' : ''}
        </div>
        
        <div class="section">
            <h2>Executive Summary</h2>
            <p>${executiveSummary}</p>
        </div>
    `;
    
    // Add sections
    sections.forEach(section => {
      html += `
        <div class="section">
            <h2>${section.title}</h2>
            ${this.renderSectionHTML(section)}
        </div>
      `;
    });
    
    html += `
        <div class="section">
            <h2>Report Information</h2>
            <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
            <p><strong>Version:</strong> 2.0.0</p>
            <p><strong>Analysis Depth:</strong> Expert Level</p>
            <p><strong>Confidentiality:</strong> ${this.getConfidentialityLevel(audience).toUpperCase()}</p>
        </div>
    </div>
</body>
</html>
    `;
    
    return html;
  }
  
  private renderSectionHTML(section: ReportSection): string {
    // Render section content based on type
    if (!section.content) return '<p>Content not available</p>';
    
    switch (section.type) {
      case 'scores':
        return this.renderScoresHTML(section.content);
      case 'analysis':
        return this.renderAnalysisHTML(section.content);
      case 'recommendations':
        return this.renderRecommendationsHTML(section.content);
      case 'transcript':
        return this.renderTranscriptHTML(section.content);
      case 'insights':
        return this.renderInsightsHTML(section.content);
      default:
        return `<pre>${JSON.stringify(section.content, null, 2)}</pre>`;
    }
  }
  
  private renderScoresHTML(content: any): string {
    if (!content.coreScores) return '<p>Score data not available</p>';
    
    let html = '<div class="grid">';
    
    Object.entries(content.coreScores).forEach(([key, value]: [string, any]) => {
      const scoreClass = this.getScoreClass(value.score);
      html += `
        <div class="card">
            <h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>
            <div class="score ${scoreClass}">${value.score}/100 (${value.grade})</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${value.score}%; background: ${this.getScoreColor(value.score)};"></div>
            </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }
  
  private renderAnalysisHTML(content: any): string {
    let html = '';
    
    if (content.overallAssessment !== undefined) {
      html += `<p><strong>Overall Assessment:</strong> ${content.overallAssessment}/100</p>`;
    }
    
    if (content.strengths && content.strengths.length > 0) {
      html += '<h3>Strengths:</h3><ul>';
      content.strengths.forEach((strength: string) => {
        html += `<li>${strength}</li>`;
      });
      html += '</ul>';
    }
    
    if (content.improvements && content.improvements.length > 0) {
      html += '<h3>Areas for Improvement:</h3><ul>';
      content.improvements.forEach((improvement: string) => {
        html += `<li>${improvement}</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  }
  
  private renderRecommendationsHTML(content: any): string {
    let html = '';
    
    if (content.priority && content.priority.length > 0) {
      html += '<h3>Priority Recommendations:</h3><ol>';
      content.priority.forEach((rec: string) => {
        html += `<li>${rec}</li>`;
      });
      html += '</ol>';
    }
    
    if (content.actionPlan && content.actionPlan.length > 0) {
      html += '<h3>Action Plan:</h3><ul>';
      content.actionPlan.forEach((action: any) => {
        html += `<li><strong>${action.timeframe}:</strong> ${action.action}</li>`;
      });
      html += '</ul>';
    }
    
    return html;
  }
  
  private renderTranscriptHTML(content: any): string {
    if (content.summary && !content.fullTranscript) {
      // Student-focused transcript
      let html = `<p><strong>Summary:</strong> ${content.summary}</p>`;
      
      if (content.conversationFlow) {
        html += '<h4>Conversation Flow Analysis</h4>';
        html += `<p><strong>Total Questions:</strong> ${content.conversationFlow.totalQuestions}</p>`;
        html += `<p><strong>Average Response Time:</strong> ${Math.round(content.conversationFlow.averageResponseTime)} seconds</p>`;
        html += `<p><strong>Conversation Quality:</strong> ${content.conversationFlow.conversationQuality}/100</p>`;
      }
      
      if (content.keyMoments && content.keyMoments.length > 0) {
        html += '<h4>Key Moments</h4>';
        content.keyMoments.forEach((moment: any) => {
          html += `
            <div class="card" style="margin-bottom: 15px; border-left: 4px solid #3b82f6;">
              <h5>${moment.type.replace('_', ' ').toUpperCase()}</h5>
              <p><strong>Question ${moment.sequence}:</strong> ${moment.question.substring(0, 100)}...</p>
              <p><strong>Analysis:</strong> ${moment.analysis}</p>
              <p><strong>Significance:</strong> ${moment.significance}</p>
            </div>
          `;
        });
      }
      
      if (content.improvementInsights) {
        html += '<h4>Personalized Improvement Insights</h4>';
        if (content.improvementInsights.priorityAreas) {
          html += '<h5>Priority Areas:</h5><ul>';
          content.improvementInsights.priorityAreas.forEach((area: string) => {
            html += `<li>${area}</li>`;
          });
          html += '</ul>';
        }
      }
      
      return html;
    }
    
    // Full detailed transcript for organizations and colleges
    let html = '<div class="detailed-transcript">';
    
    if (content.completeTranscript) {
      html += '<h4>Complete Interview Transcript</h4>';
      html += `<div class="transcript-content" style="background: #f8f9fa; padding: 20px; border-radius: 8px; font-family: monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${content.completeTranscript}</div>`;
    }
    
    if (content.conversationFlow) {
      html += '<h4>Conversation Flow Analysis</h4>';
      html += `<p><strong>Total Questions:</strong> ${content.conversationFlow.totalQuestions}</p>`;
      html += `<p><strong>Average Response Time:</strong> ${Math.round(content.conversationFlow.averageResponseTime)} seconds</p>`;
      html += `<p><strong>Conversation Quality:</strong> ${content.conversationFlow.conversationQuality}/100</p>`;
      
      if (content.conversationFlow.flow) {
        html += '<h5>Question-by-Question Flow</h5>';
        content.conversationFlow.flow.forEach((item: any) => {
          html += `
            <div class="card" style="margin-bottom: 20px;">
              <h6>Question ${item.sequence} - ${item.interviewer.category}</h6>
              <p><strong>Q:</strong> ${item.interviewer.question}</p>
              <p><strong>Difficulty:</strong> ${item.interviewer.difficulty} | <strong>Intent:</strong> ${item.interviewer.intent}</p>
              <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                <div>
                  <strong>Candidate Response:</strong>
                  <p>Word Count: ${item.candidate.wordCount}</p>
                  <p>Emotional State: ${item.candidate.emotionalState}</p>
                  <p>Confidence: ${item.candidate.confidence}/100</p>
                  <p>Clarity: ${item.candidate.clarity}/100</p>
                </div>
                <div>
                  <strong>Interaction Quality:</strong>
                  <p>Engagement: ${item.interaction.engagement}/100</p>
                  <p>Rapport: ${item.interaction.rapport}/100</p>
                  <p>Flow: ${item.interaction.flow}/100</p>
                </div>
              </div>
            </div>
          `;
        });
      }
    }
    
    if (content.interviewerTranscript) {
      html += '<h4>Interviewer Analysis</h4>';
      html += `<p><strong>Total Questions:</strong> ${content.interviewerTranscript.totalQuestions}</p>`;
      html += `<p><strong>Questioning Strategy:</strong> ${content.interviewerTranscript.questioningStrategy}</p>`;
      html += `<p><strong>Difficulty Progression:</strong> ${content.interviewerTranscript.difficultyProgression}</p>`;
      
      if (content.interviewerTranscript.questionCategories) {
        html += '<h5>Question Categories:</h5>';
        Object.entries(content.interviewerTranscript.questionCategories).forEach(([category, count]) => {
          html += `<p><strong>${category.charAt(0).toUpperCase() + category.slice(1)}:</strong> ${count}</p>`;
        });
      }
    }
    
    if (content.candidateTranscript) {
      html += '<h4>Candidate Response Analysis</h4>';
      html += `<p><strong>Total Responses:</strong> ${content.candidateTranscript.totalResponses}</p>`;
      html += `<p><strong>Average Response Length:</strong> ${Math.round(content.candidateTranscript.averageResponseLength)} characters</p>`;
      
      if (content.candidateTranscript.communicationStyle) {
        html += '<h5>Communication Style:</h5>';
        html += `<p>Articulation: ${content.candidateTranscript.communicationStyle.articulation}/100</p>`;
        html += `<p>Professionalism: ${content.candidateTranscript.communicationStyle.professionalism}/100</p>`;
        html += `<p>Engagement: ${content.candidateTranscript.communicationStyle.engagement}/100</p>`;
      }
    }
    
    if (content.enhancedQuestionResponses) {
      html += '<h4>Enhanced Question-Response Analysis</h4>';
      content.enhancedQuestionResponses.forEach((qr: any) => {
        html += `
          <div class="card" style="margin-bottom: 25px; border-left: 4px solid #10b981;">
            <h5>Question ${qr.questionNumber}</h5>
            <p><strong>Q:</strong> ${qr.question}</p>
            <p><strong>A:</strong> ${qr.response.substring(0, 200)}${qr.response.length > 200 ? '...' : ''}</p>
            
            <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <strong>Analysis Scores:</strong>
                <p>Overall Score: ${qr.analysis.score}/100</p>
                <p>Emotional State: ${qr.analysis.emotionalState}</p>
                <p>Stress Level: ${qr.analysis.stressLevel}/100</p>
                <p>Confidence: ${qr.analysis.confidenceLevel}/100</p>
              </div>
              <div>
                <strong>Response Metrics:</strong>
                <p>Word Count: ${qr.analysis.responseMetrics.wordCount}</p>
                <p>Sentences: ${qr.analysis.responseMetrics.sentenceCount}</p>
                <p>Technical Depth: ${qr.analysis.responseMetrics.technicalDepth}/100</p>
                <p>Specificity: ${qr.analysis.responseMetrics.specificityScore}/100</p>
              </div>
              <div>
                <strong>Communication:</strong>
                <p>Clarity: ${qr.analysis.communicationAnalysis.clarity}/100</p>
                <p>Structure: ${qr.analysis.communicationAnalysis.structure}/100</p>
                <p>Engagement: ${qr.analysis.communicationAnalysis.engagement}/100</p>
                <p>Professionalism: ${qr.analysis.communicationAnalysis.professionalism}/100</p>
              </div>
            </div>
            
            ${qr.analysis.feedback ? `<p><strong>Detailed Feedback:</strong> ${qr.analysis.feedback}</p>` : ''}
            
            <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px;">
              <div>
                <strong>Strengths:</strong>
                <ul>
                  ${qr.strengths.content.concat(qr.strengths.communication, qr.strengths.technical, qr.strengths.behavioral).map((strength: string) => `<li>${strength}</li>`).join('')}
                </ul>
              </div>
              <div>
                <strong>Improvements:</strong>
                <ul>
                  ${qr.improvements.immediate.concat(qr.improvements.structural, qr.improvements.content, qr.improvements.delivery).map((improvement: string) => `<li>${improvement}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        `;
      });
    }
    
    if (content.emotionalJourney) {
      html += '<h4>Detailed Emotional Journey</h4>';
      html += `<p><strong>Dominant Emotions:</strong> ${content.emotionalJourney.overview.dominantEmotions.join(', ')}</p>`;
      html += `<p><strong>Emotional Stability:</strong> ${content.emotionalJourney.overview.emotionalStability}/100</p>`;
      html += `<p><strong>Overall Wellbeing:</strong> ${content.emotionalJourney.overview.overallWellbeing}/100</p>`;
      
      if (content.emotionalJourney.patterns) {
        html += '<h5>Emotional Patterns:</h5>';
        html += `<p><strong>Trends:</strong> ${content.emotionalJourney.patterns.emotionalTrends}</p>`;
        html += `<p><strong>Stability:</strong> ${content.emotionalJourney.patterns.stabilityPatterns}</p>`;
        html += `<p><strong>Recovery:</strong> ${content.emotionalJourney.patterns.recoveryPatterns}</p>`;
      }
    }
    
    if (content.stressProgression) {
      html += '<h4>Stress Progression Analysis</h4>';
      html += `<p><strong>Overall Stress Level:</strong> ${content.stressProgression.overview.overallStressLevel}/100</p>`;
      html += `<p><strong>Stress Resilience:</strong> ${content.stressProgression.overview.stressResilience}/100</p>`;
      
      if (content.stressProgression.analysis) {
        html += '<h5>Stress Analysis:</h5>';
        html += `<p><strong>Stress Triggers:</strong> ${content.stressProgression.analysis.stressTriggers}</p>`;
        html += `<p><strong>Recovery Points:</strong> ${content.stressProgression.analysis.recoveryPoints}</p>`;
        html += `<p><strong>Management Effectiveness:</strong> ${content.stressProgression.analysis.managementEffectiveness}</p>`;
      }
    }
    
    if (content.timelineAnalysis) {
      html += '<h4>Interview Timeline Analysis</h4>';
      html += `<p><strong>Total Duration:</strong> ${content.timelineAnalysis.totalDuration} minutes</p>`;
      
      if (content.timelineAnalysis.phases) {
        html += '<h5>Interview Phases:</h5>';
        content.timelineAnalysis.phases.forEach((phase: any) => {
          html += `<p><strong>${phase.phase}:</strong> ${phase.characteristics}</p>`;
        });
      }
      
      if (content.timelineAnalysis.criticalMoments && content.timelineAnalysis.criticalMoments.length > 0) {
        html += '<h5>Critical Moments:</h5>';
        content.timelineAnalysis.criticalMoments.forEach((moment: any) => {
          html += `<p><strong>Question ${moment.sequence}:</strong> ${moment.keyObservations.join(', ')}</p>`;
        });
      }
    }
    
    if (content.behavioralObservations) {
      html += '<h4>Behavioral Observations</h4>';
      
      if (content.behavioralObservations.personalityTraits) {
        html += '<h5>Personality Profile:</h5>';
        const bigFive = content.behavioralObservations.personalityTraits.bigFive;
        html += `<p>Openness: ${bigFive.openness}/100</p>`;
        html += `<p>Conscientiousness: ${bigFive.conscientiousness}/100</p>`;
        html += `<p>Extraversion: ${bigFive.extraversion}/100</p>`;
        html += `<p>Agreeableness: ${bigFive.agreeableness}/100</p>`;
        html += `<p>Neuroticism: ${bigFive.neuroticism}/100</p>`;
      }
      
      if (content.behavioralObservations.emotionalIntelligence) {
        html += '<h5>Emotional Intelligence:</h5>';
        const eq = content.behavioralObservations.emotionalIntelligence;
        html += `<p>Overall EQ: ${eq.overallEQ}/100</p>`;
        html += `<p>Self-Awareness: ${eq.selfAwareness}/100</p>`;
        html += `<p>Self-Regulation: ${eq.selfRegulation}/100</p>`;
        html += `<p>Empathy: ${eq.empathy}/100</p>`;
        html += `<p>Social Skills: ${eq.socialSkills}/100</p>`;
      }
    }
    
    if (content.technicalDiscussion) {
      html += '<h4>Technical Discussion Analysis</h4>';
      html += `<p><strong>Technical Score:</strong> ${content.technicalDiscussion.overallTechnicalPerformance.technicalScore}/100</p>`;
      html += `<p><strong>Technical Correctness:</strong> ${content.technicalDiscussion.overallTechnicalPerformance.technicalCorrectness}/100</p>`;
      html += `<p><strong>Conceptual Understanding:</strong> ${content.technicalDiscussion.overallTechnicalPerformance.conceptualUnderstanding}/100</p>`;
      
      if (content.technicalDiscussion.technicalStrengths) {
        html += '<h5>Technical Strengths:</h5><ul>';
        content.technicalDiscussion.technicalStrengths.forEach((strength: string) => {
          html += `<li>${strength}</li>`;
        });
        html += '</ul>';
      }
      
      if (content.technicalDiscussion.knowledgeGaps) {
        html += '<h5>Knowledge Gaps:</h5><ul>';
        content.technicalDiscussion.knowledgeGaps.forEach((gap: string) => {
          html += `<li>${gap}</li>`;
        });
        html += '</ul>';
      }
    }
    
    html += '</div>';
    return html;
  }
  
  private renderInsightsHTML(content: any): string {
    let html = '';
    
    Object.entries(content).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        html += `<h3>${key.charAt(0).toUpperCase() + key.slice(1)}:</h3>`;
        html += `<pre>${JSON.stringify(value, null, 2)}</pre>`;
      } else {
        html += `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`;
      }
    });
    
    return html;
  }
  
  private generateJSON(evaluation: EvaluationReport, sections: ReportSection[]): any {
    return {
      evaluation,
      sections,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        format: 'json'
      }
    };
  }
  
  // Helper methods
  private getPerformanceLevel(score: number): string {
    if (score >= 85) return 'exceptional';
    if (score >= 70) return 'strong';
    if (score >= 55) return 'satisfactory';
    if (score >= 40) return 'developing';
    return 'concerning';
  }
  
  private getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    return 'F';
  }
  
  private getScoreClass(score: number): string {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }
  
  private getScoreColor(score: number): string {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }
  
  private categorizeQuestion(question: string): string {
    const lower = question.toLowerCase();
    if (lower.includes('technical') || lower.includes('code') || lower.includes('algorithm')) return 'Technical';
    if (lower.includes('experience') || lower.includes('project') || lower.includes('work')) return 'Experience';
    if (lower.includes('team') || lower.includes('conflict') || lower.includes('leadership')) return 'Behavioral';
    return 'General';
  }
  
  private identifyRiskFactors(evaluation: EvaluationReport): string[] {
    const risks: string[] = [];
    
    if (evaluation.emotionAnalysis.stress.overallStress > 70) {
      risks.push('High stress levels during interview');
    }
    if (evaluation.emotionAnalysis.emotionalStability < 40) {
      risks.push('Emotional instability concerns');
    }
    if (evaluation.scores.communication < 50) {
      risks.push('Communication effectiveness below threshold');
    }
    if (evaluation.insights.culturalFit < 50) {
      risks.push('Potential cultural fit challenges');
    }
    
    return risks;
  }
  
  private getPersonalityDescription(trait: string, score: number): string {
    const descriptions = {
      openness: {
        high: 'Creative, curious, and open to new experiences',
        medium: 'Balanced approach to new ideas and experiences',
        low: 'Prefers familiar approaches and established methods'
      },
      conscientiousness: {
        high: 'Highly organized, disciplined, and detail-oriented',
        medium: 'Generally organized with good attention to detail',
        low: 'More flexible and spontaneous in approach'
      },
      extraversion: {
        high: 'Outgoing, energetic, and socially confident',
        medium: 'Comfortable in both social and individual settings',
        low: 'Thoughtful, reserved, and prefers smaller groups'
      },
      agreeableness: {
        high: 'Cooperative, trusting, and team-oriented',
        medium: 'Balanced approach to collaboration and independence',
        low: 'Independent, competitive, and direct in communication'
      },
      neuroticism: {
        high: 'May experience higher stress and emotional reactivity',
        medium: 'Generally emotionally stable with normal stress responses',
        low: 'Very calm, resilient, and emotionally stable'
      }
    };
    
    const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    return descriptions[trait as keyof typeof descriptions]?.[level] || 'Assessment not available';
  }
  
  private determinePreferredEnvironment(psychology: any): string {
    if (psychology.extraversion >= 70) {
      return 'Collaborative, open office environment with frequent team interactions';
    } else if (psychology.extraversion <= 30) {
      return 'Quiet, focused environment with minimal distractions';
    } else {
      return 'Flexible environment with both collaborative and individual work spaces';
    }
  }
  
  private identifyMotivationFactors(psychology: any): string[] {
    const factors: string[] = [];
    
    if (psychology.openness >= 70) factors.push('Learning and growth opportunities');
    if (psychology.conscientiousness >= 70) factors.push('Clear goals and structured processes');
    if (psychology.extraversion >= 70) factors.push('Team collaboration and social interaction');
    if (psychology.agreeableness >= 70) factors.push('Helping others and making a positive impact');
    
    return factors.length > 0 ? factors : ['Professional development', 'Achievement recognition'];
  }
  
  private identifyCommunicationStrengths(communication: any): string[] {
    const strengths: string[] = [];
    
    if (communication.articulation >= 70) strengths.push('Clear and articulate expression');
    if (communication.professionalism >= 70) strengths.push('Professional communication style');
    if (communication.engagement >= 70) strengths.push('High engagement and enthusiasm');
    if (communication.fluency >= 70) strengths.push('Fluent and smooth delivery');
    
    return strengths;
  }
  
  private identifyCommunicationImprovements(communication: any): string[] {
    const improvements: string[] = [];
    
    if (communication.articulation < 60) improvements.push('Work on clarity and precision of expression');
    if (communication.fluency < 60) improvements.push('Reduce hesitation and filler words');
    if (communication.engagement < 60) improvements.push('Increase enthusiasm and active participation');
    if (communication.professionalism < 60) improvements.push('Enhance professional communication style');
    
    return improvements;
  }
  
  private identifyCopingStrategies(stress: any): string[] {
    const strategies: string[] = [];
    
    if (stress.overallStress <= 30) {
      strategies.push('Excellent natural stress management');
    } else if (stress.overallStress <= 60) {
      strategies.push('Good stress management with room for improvement');
    } else {
      strategies.push('Needs development in stress management techniques');
    }
    
    return strategies;
  }
  
  private assessValues(emotionAnalysis: any): string {
    const { psychology, communication } = emotionAnalysis;
    
    if (psychology.agreeableness >= 70 && communication.professionalism >= 70) {
      return 'Strong alignment with collaborative and professional values';
    } else if (psychology.conscientiousness >= 70) {
      return 'Values quality, reliability, and attention to detail';
    } else if (psychology.openness >= 70) {
      return 'Values innovation, creativity, and continuous learning';
    } else {
      return 'Values independence and individual achievement';
    }
  }
  
  private determineEnvironmentMatch(evaluation: EvaluationReport): string {
    const { psychology } = evaluation.emotionAnalysis;
    
    if (psychology.extraversion >= 70 && psychology.agreeableness >= 70) {
      return 'Excellent fit for collaborative, team-oriented environments';
    } else if (psychology.conscientiousness >= 70) {
      return 'Well-suited for structured, process-oriented environments';
    } else if (psychology.openness >= 70) {
      return 'Thrives in innovative, dynamic environments';
    } else {
      return 'Adaptable to various work environments';
    }
  }
  
  private assessTeamDynamics(evaluation: EvaluationReport): string {
    const teamwork = evaluation.insights.teamworkAbility;
    
    if (teamwork >= 80) {
      return 'Excellent team player with strong collaborative skills';
    } else if (teamwork >= 60) {
      return 'Good team collaboration with effective interpersonal skills';
    } else if (teamwork >= 40) {
      return 'Adequate team skills with potential for development';
    } else {
      return 'May prefer individual work or need team skills development';
    }
  }
  
  private determineLeadershipStyle(evaluation: EvaluationReport): string {
    const { psychology, communication } = evaluation.emotionAnalysis;
    
    if (communication.assertiveness >= 70 && psychology.extraversion >= 70) {
      return 'Direct, charismatic leadership style';
    } else if (psychology.agreeableness >= 70 && psychology.empathy >= 70) {
      return 'Collaborative, supportive leadership style';
    } else if (psychology.conscientiousness >= 70) {
      return 'Structured, detail-oriented leadership style';
    } else {
      return 'Developing leadership style with potential for growth';
    }
  }
  
  private identifyLeadershipDevelopmentAreas(evaluation: EvaluationReport): string[] {
    const areas: string[] = [];
    const { communication, psychology } = evaluation.emotionAnalysis;
    
    if (communication.confidence < 60) areas.push('Building confidence and executive presence');
    if (psychology.empathy < 60) areas.push('Developing emotional intelligence and empathy');
    if (communication.assertiveness < 60) areas.push('Enhancing assertiveness and decision-making');
    if (psychology.socialSkills < 60) areas.push('Improving interpersonal and communication skills');
    
    return areas.length > 0 ? areas : ['Continue developing leadership capabilities'];
  }
  
  private determineTeamRole(evaluation: EvaluationReport): string {
    const { psychology, communication } = evaluation.emotionAnalysis;
    
    if (psychology.extraversion >= 70 && communication.assertiveness >= 70) {
      return 'Natural team leader and motivator';
    } else if (psychology.agreeableness >= 70 && psychology.empathy >= 70) {
      return 'Team harmonizer and supporter';
    } else if (psychology.conscientiousness >= 70) {
      return 'Team organizer and quality controller';
    } else if (psychology.openness >= 70) {
      return 'Team innovator and creative contributor';
    } else {
      return 'Reliable team contributor';
    }
  }
  
  private assessConflictResolution(evaluation: EvaluationReport): string {
    const { psychology } = evaluation.emotionAnalysis;
    const emotionalIntelligence = evaluation.insights.emotionalIntelligence;
    
    if (emotionalIntelligence >= 70 && psychology.agreeableness >= 70) {
      return 'Strong conflict resolution skills with diplomatic approach';
    } else if (emotionalIntelligence >= 60) {
      return 'Good conflict resolution potential with continued development';
    } else {
      return 'May need support in conflict resolution situations';
    }
  }
  
  private generateQuestionSpecificImprovements(qr: any): string[] {
    const improvements: string[] = [];
    
    if (qr.score < 60) {
      improvements.push('Provide more specific examples and details');
    }
    if (qr.response.length < 100) {
      improvements.push('Expand on answers with more comprehensive explanations');
    }
    if (!qr.response.includes('example') && !qr.response.includes('experience')) {
      improvements.push('Include concrete examples from personal experience');
    }
    
    return improvements;
  }
  
  private identifyResponsePatterns(questionResponses: any[]): any {
    const avgScore = questionResponses.reduce((sum, qr) => sum + qr.score, 0) / questionResponses.length;
    const avgLength = questionResponses.reduce((sum, qr) => sum + qr.response.length, 0) / questionResponses.length;
    
    return {
      averageScore: Math.round(avgScore),
      averageResponseLength: Math.round(avgLength),
      consistency: this.calculateResponseConsistency(questionResponses),
      improvement: avgScore < 70 ? 'Focus on providing more detailed, structured responses' : 'Maintain current response quality'
    };
  }
  
  private calculateResponseConsistency(responses: any[]): string {
    const scores = responses.map(r => r.score);
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - (scores.reduce((a, b) => a + b) / scores.length), 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 10) return 'Very consistent performance';
    if (stdDev < 20) return 'Generally consistent with some variation';
    return 'Inconsistent performance across questions';
  }
  
  private isTechnicalStrength(strength: string): boolean {
    return /technical|skill|knowledge|programming|coding|algorithm|system|architecture/i.test(strength);
  }
  
  private isInterpersonalStrength(strength: string): boolean {
    return /communication|team|collaboration|interpersonal|social|leadership|empathy/i.test(strength);
  }
  
  private isEmotionalStrength(strength: string): boolean {
    return /emotional|confidence|calm|stable|resilient|stress|anxiety|motivation/i.test(strength);
  }
  
  private findEvidenceForStrength(strength: string, evaluation: EvaluationReport): string {
    // Find specific evidence from the evaluation data
    if (strength.toLowerCase().includes('confidence')) {
      return `Demonstrated ${evaluation.emotionAnalysis.communication.confidence}/100 confidence score`;
    }
    if (strength.toLowerCase().includes('professional')) {
      return `Maintained ${evaluation.emotionAnalysis.communication.professionalism}/100 professionalism throughout`;
    }
    if (strength.toLowerCase().includes('technical')) {
      return `Achieved ${evaluation.scores.technical}/100 in technical assessment`;
    }
    
    return 'Observed throughout interview responses and analysis';
  }
  
  private generateStrengthBuildingTips(strengths: string[]): string[] {
    return [
      'Continue leveraging your natural strengths in professional settings',
      'Seek opportunities to mentor others in your areas of strength',
      'Look for roles that align with and utilize your key capabilities',
      'Build on existing strengths to develop complementary skills'
    ];
  }
  
  private categorizeRecommendations(recommendations: string[], timeframe: 'short-term' | 'long-term'): string[] {
    if (timeframe === 'short-term') {
      return recommendations.filter(rec => 
        /practice|prepare|review|study|immediate|quick|daily|weekly/i.test(rec)
      ).slice(0, 3);
    } else {
      return recommendations.filter(rec => 
        /develop|build|enhance|improve|long-term|career|professional|advanced/i.test(rec)
      ).slice(0, 3);
    }
  }
  
  private createActionPlan(recommendations: string[], audience: string): any[] {
    return [
      { timeframe: 'Immediate (1-2 weeks)', action: recommendations[0] || 'Review interview performance and feedback' },
      { timeframe: 'Short-term (1-3 months)', action: recommendations[1] || 'Focus on primary development areas' },
      { timeframe: 'Long-term (3-12 months)', action: recommendations[2] || 'Continue professional development journey' }
    ];
  }
  
  private suggestResources(recommendations: string[]): any {
    return {
      books: this.suggestBooks(recommendations),
      courses: this.suggestOnlineCourses(recommendations),
      tools: this.suggestPracticeTools(recommendations)
    };
  }
  
  private suggestBooks(improvements: string[]): string[] {
    const books = [
      'Emotional Intelligence 2.0 by Travis Bradberry',
      'The Charisma Myth by Olivia Fox Cabane',
      'Crucial Conversations by Kerry Patterson',
      'Mindset by Carol Dweck',
      'The Confidence Code by Kay and Shipman'
    ];
    
    return books.slice(0, 3);
  }
  
  private suggestOnlineCourses(improvements: string[]): string[] {
    const courses = [
      'Public Speaking and Communication Skills (Coursera)',
      'Emotional Intelligence at Work (LinkedIn Learning)',
      'Stress Management and Resilience (edX)',
      'Leadership and Team Management (Udemy)',
      'Technical Interview Preparation (LeetCode/HackerRank)'
    ];
    
    return courses.slice(0, 3);
  }
  
  private suggestPracticeTools(improvements: string[]): string[] {
    const tools = [
      'Toastmasters International for public speaking',
      'Mock interview platforms (Pramp, InterviewBuddy)',
      'Meditation apps (Headspace, Calm) for stress management',
      'Technical practice platforms (LeetCode, CodeSignal)',
      'Communication skills apps (Orai, VirtualSpeech)'
    ];
    
    return tools.slice(0, 3);
  }
  
  private suggestCommunities(improvements: string[]): string[] {
    return [
      'Professional networking groups in your field',
      'Local Toastmasters chapters',
      'Industry-specific online communities',
      'Career development meetups',
      'Technical user groups and conferences'
    ];
  }
  
  private generateDetailedTranscript(evaluation: EvaluationReport, audience: string): any {
    const { transcript, emotionAnalysis, confidenceAnalysis, feedback, scores } = evaluation;
    
    // Generate complete conversation flow with timestamps and analysis
    const conversationFlow = this.generateConversationFlow(transcript, emotionAnalysis);
    
    // Generate separate interviewer and candidate transcripts
    const interviewerTranscript = this.generateInterviewerTranscript(transcript, emotionAnalysis);
    const candidateTranscript = this.generateCandidateTranscript(transcript, emotionAnalysis);
    
    // Enhanced question-response analysis
    const enhancedQuestionResponses = this.generateEnhancedQuestionResponses(
      transcript.questionResponses, 
      feedback.questionResponses, 
      emotionAnalysis,
      confidenceAnalysis
    );
    
    // Emotional journey with detailed analysis
    const emotionalJourney = this.generateDetailedEmotionalJourney(emotionAnalysis);
    
    // Stress progression analysis
    const stressProgression = this.generateStressProgressionAnalysis(emotionAnalysis);
    
    // Communication patterns analysis
    const communicationPatterns = this.generateCommunicationPatterns(emotionAnalysis, transcript);
    
    // Interaction analysis between interviewer and candidate
    const interactionAnalysis = this.generateInteractionAnalysis(transcript, emotionAnalysis);
    
    // Timeline analysis of the interview
    const timelineAnalysis = this.generateTimelineAnalysis(transcript, emotionAnalysis, confidenceAnalysis);
    
    // Behavioral observations throughout the interview
    const behavioralObservations = this.generateBehavioralObservations(emotionAnalysis, confidenceAnalysis);
    
    // Technical discussion analysis
    const technicalDiscussion = this.generateTechnicalDiscussionAnalysis(feedback, scores);
    
    // Key moments identification
    const keyMoments = this.generateKeyMoments(transcript, emotionAnalysis, confidenceAnalysis);
    
    // Response analysis with detailed feedback
    const responseAnalysis = this.generateResponseAnalysis(feedback.questionResponses, emotionAnalysis);
    
    // Improvement insights based on transcript analysis
    const improvementInsights = this.generateImprovementInsights(feedback, emotionAnalysis, audience);
    
    // Complete transcript with all details
    const completeTranscript = this.generateCompleteTranscript(transcript, emotionAnalysis, confidenceAnalysis);
    
    // Student-focused transcript (more privacy-conscious but still detailed)
    const studentFocusedTranscript = this.generateStudentFocusedTranscript(transcript, emotionAnalysis, feedback);
    
    return {
      completeTranscript,
      interviewerTranscript,
      candidateTranscript,
      conversationFlow,
      enhancedQuestionResponses,
      emotionalJourney,
      stressProgression,
      communicationPatterns,
      interactionAnalysis,
      timelineAnalysis,
      behavioralObservations,
      technicalDiscussion,
      keyMoments,
      responseAnalysis,
      improvementInsights,
      studentFocusedTranscript
    };
  }
  
  private generateConversationFlow(transcript: any, emotionAnalysis: any): any {
    const flow = transcript.questionResponses.map((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const stressLevel = this.getStressLevelAtIndex(emotionAnalysis, index);
      
      return {
        sequence: index + 1,
        timestamp: qr.timestamp || new Date(),
        interviewer: {
          question: qr.question,
          intent: this.analyzeQuestionIntent(qr.question),
          difficulty: this.assessQuestionDifficulty(qr.question),
          category: this.categorizeQuestion(qr.question)
        },
        candidate: {
          response: qr.response,
          responseTime: this.estimateResponseTime(qr.response),
          wordCount: qr.response.split(' ').length,
          emotionalState: emotionalState,
          stressLevel: stressLevel,
          confidence: this.assessResponseConfidence(qr.response, emotionalState),
          clarity: this.assessResponseClarity(qr.response),
          completeness: this.assessResponseCompleteness(qr.response, qr.question)
        },
        interaction: {
          engagement: this.assessEngagement(qr.response, emotionalState),
          rapport: this.assessRapport(emotionalState, stressLevel),
          flow: this.assessConversationFlow(qr.response, index)
        }
      };
    });
    
    return {
      totalQuestions: flow.length,
      averageResponseTime: flow.reduce((sum, f) => sum + f.candidate.responseTime, 0) / flow.length,
      conversationQuality: this.assessOverallConversationQuality(flow),
      flow: flow
    };
  }
  
  private generateInterviewerTranscript(transcript: any, emotionAnalysis: any): any {
    return {
      role: 'Interviewer',
      totalQuestions: transcript.questionResponses.length,
      questionCategories: this.categorizeAllQuestions(transcript.questionResponses),
      questioningStrategy: this.analyzeQuestioningStrategy(transcript.questionResponses),
      difficultyProgression: this.analyzeDifficultyProgression(transcript.questionResponses),
      questions: transcript.questionResponses.map((qr: any, index: number) => ({
        sequence: index + 1,
        question: qr.question,
        category: this.categorizeQuestion(qr.question),
        difficulty: this.assessQuestionDifficulty(qr.question),
        intent: this.analyzeQuestionIntent(qr.question),
        expectedResponse: this.generateExpectedResponse(qr.question),
        candidateResponse: qr.response,
        responseQuality: this.assessResponseQuality(qr.response, qr.question),
        followUpOpportunities: this.identifyFollowUpOpportunities(qr.question, qr.response)
      }))
    };
  }
  
  private generateCandidateTranscript(transcript: any, emotionAnalysis: any): any {
    return {
      role: 'Candidate',
      totalResponses: transcript.questionResponses.length,
      averageResponseLength: transcript.questionResponses.reduce((sum: number, qr: any) => sum + qr.response.length, 0) / transcript.questionResponses.length,
      communicationStyle: emotionAnalysis.communication,
      emotionalProfile: emotionAnalysis.psychology,
      responses: transcript.questionResponses.map((qr: any, index: number) => ({
        sequence: index + 1,
        questionReceived: qr.question,
        response: qr.response,
        responseAnalysis: {
          wordCount: qr.response.split(' ').length,
          sentenceCount: qr.response.split(/[.!?]+/).length - 1,
          averageWordsPerSentence: qr.response.split(' ').length / (qr.response.split(/[.!?]+/).length - 1),
          technicalTerms: this.extractTechnicalTerms(qr.response),
          emotionalTone: this.getEmotionalStateAtIndex(emotionAnalysis, index),
          stressIndicators: this.identifyStressIndicators(qr.response),
          confidenceMarkers: this.identifyConfidenceMarkers(qr.response),
          clarityScore: this.assessResponseClarity(qr.response),
          completenessScore: this.assessResponseCompleteness(qr.response, qr.question),
          professionalismScore: this.assessProfessionalism(qr.response)
        },
        improvements: this.generateResponseImprovements(qr.response, qr.question),
        strengths: this.identifyResponseStrengths(qr.response, qr.question)
      }))
    };
  }
  
  private generateEnhancedQuestionResponses(questionResponses: any[], feedbackResponses: any[], emotionAnalysis: any, confidenceAnalysis: any): any[] {
    return questionResponses.map((qr, index) => {
      const feedbackQR = feedbackResponses[index];
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const stressLevel = this.getStressLevelAtIndex(emotionAnalysis, index);
      const confidenceLevel = this.getConfidenceLevelAtIndex(confidenceAnalysis, index);
      
      return {
        questionNumber: index + 1,
        question: qr.question,
        response: qr.response,
        timestamp: qr.timestamp,
        
        // Enhanced analysis
        analysis: {
          score: feedbackQR?.score || 0,
          feedback: feedbackQR?.feedback || '',
          emotionalState: emotionalState,
          stressLevel: stressLevel,
          confidenceLevel: confidenceLevel,
          
          // Detailed metrics
          responseMetrics: {
            wordCount: qr.response.split(' ').length,
            sentenceCount: qr.response.split(/[.!?]+/).length - 1,
            averageWordsPerSentence: Math.round(qr.response.split(' ').length / Math.max(1, qr.response.split(/[.!?]+/).length - 1)),
            readabilityScore: this.calculateReadabilityScore(qr.response),
            technicalDepth: this.assessTechnicalDepth(qr.response),
            specificityScore: this.assessSpecificity(qr.response)
          },
          
          // Communication analysis
          communicationAnalysis: {
            clarity: this.assessResponseClarity(qr.response),
            structure: this.assessResponseStructure(qr.response),
            engagement: this.assessEngagement(qr.response, emotionalState),
            professionalism: this.assessProfessionalism(qr.response),
            enthusiasm: this.assessEnthusiasm(qr.response, emotionalState)
          },
          
          // Content analysis
          contentAnalysis: {
            relevance: this.assessRelevance(qr.response, qr.question),
            completeness: this.assessResponseCompleteness(qr.response, qr.question),
            examples: this.extractExamples(qr.response),
            technicalAccuracy: this.assessTechnicalAccuracy(qr.response, qr.question),
            problemSolvingApproach: this.assessProblemSolvingApproach(qr.response)
          }
        },
        
        // Improvement suggestions
        improvements: {
          immediate: this.generateImmediateImprovements(qr.response, qr.question),
          structural: this.generateStructuralImprovements(qr.response, qr.question),
          content: this.generateContentImprovements(qr.response, qr.question),
          delivery: this.generateDeliveryImprovements(qr.response, emotionalState, stressLevel)
        },
        
        // Strengths identification
        strengths: {
          content: this.identifyContentStrengths(qr.response, qr.question),
          communication: this.identifyCommunicationStrengths(qr.response, emotionalState),
          technical: this.identifyTechnicalStrengths(qr.response, qr.question),
          behavioral: this.identifyBehavioralStrengths(qr.response, emotionalState)
        }
      };
    });
  }
  
  private generateDetailedEmotionalJourney(emotionAnalysis: any): any {
    return {
      overview: {
        dominantEmotions: emotionAnalysis.dominantEmotions,
        emotionalStability: emotionAnalysis.emotionalStability,
        overallWellbeing: emotionAnalysis.overallWellbeing,
        emotionalRange: this.calculateEmotionalRange(emotionAnalysis.emotionalJourney)
      },
      journey: emotionAnalysis.emotionalJourney.map((segment: any, index: number) => ({
        timeSegment: index + 1,
        emotions: segment,
        dominantEmotion: this.getDominantEmotion(segment),
        emotionalIntensity: this.calculateEmotionalIntensity(segment),
        stability: this.calculateSegmentStability(segment),
        insights: this.generateEmotionalInsights(segment, index),
        recommendations: this.generateEmotionalRecommendations(segment)
      })),
      patterns: {
        emotionalTrends: this.identifyEmotionalTrends(emotionAnalysis.emotionalJourney),
        stabilityPatterns: this.identifyStabilityPatterns(emotionAnalysis.emotionalJourney),
        recoveryPatterns: this.identifyRecoveryPatterns(emotionAnalysis.emotionalJourney),
        peakMoments: this.identifyEmotionalPeaks(emotionAnalysis.emotionalJourney),
        lowMoments: this.identifyEmotionalLows(emotionAnalysis.emotionalJourney)
      }
    };
  }
  
  private generateStressProgressionAnalysis(emotionAnalysis: any): any {
    return {
      overview: {
        overallStressLevel: emotionAnalysis.stress.overallStress,
        stressResilience: 100 - emotionAnalysis.stress.overallStress,
        stressManagement: emotionAnalysis.stressManagement
      },
      progression: emotionAnalysis.stressProgression.map((level: number, index: number) => ({
        timeSegment: index + 1,
        stressLevel: level,
        stressCategory: this.categorizeStressLevel(level),
        indicators: this.identifyStressIndicatorsAtSegment(emotionAnalysis, index),
        impact: this.assessStressImpact(level, index),
        copingStrategies: this.identifyCopingStrategies(emotionAnalysis.stress)
      })),
      analysis: {
        stressTriggers: this.identifyStressTriggers(emotionAnalysis.stressProgression),
        recoveryPoints: this.identifyStressRecovery(emotionAnalysis.stressProgression),
        peakStressMoments: this.identifyPeakStress(emotionAnalysis.stressProgression),
        stressResilience: this.assessStressResilience(emotionAnalysis.stressProgression),
        managementEffectiveness: this.assessStressManagement(emotionAnalysis.stress)
      }
    };
  }
  
  private generateCommunicationPatterns(emotionAnalysis: any, transcript: any): any {
    const communication = emotionAnalysis.communication;
    
    return {
      overallEffectiveness: emotionAnalysis.communicationEffectiveness,
      patterns: {
        articulation: {
          score: communication.articulation,
          analysis: this.analyzeCommunicationPattern(communication.articulation, 'articulation'),
          examples: this.findArticulationExamples(transcript)
        },
        fluency: {
          score: communication.fluency,
          analysis: this.analyzeCommunicationPattern(communication.fluency, 'fluency'),
          examples: this.findFluencyExamples(transcript)
        },
        professionalism: {
          score: communication.professionalism,
          analysis: this.analyzeCommunicationPattern(communication.professionalism, 'professionalism'),
          examples: this.findProfessionalismExamples(transcript)
        },
        engagement: {
          score: communication.engagement,
          analysis: this.analyzeCommunicationPattern(communication.engagement, 'engagement'),
          examples: this.findEngagementExamples(transcript)
        },
        confidence: {
          score: communication.confidence,
          analysis: this.analyzeCommunicationPattern(communication.confidence, 'confidence'),
          examples: this.findConfidenceExamples(transcript)
        }
      },
      trends: this.identifyCommunicationTrends(communication),
      strengths: this.identifyCommunicationStrengths(communication),
      improvements: this.identifyCommunicationImprovements(communication)
    };
  }
  
  private generateInteractionAnalysis(transcript: any, emotionAnalysis: any): any {
    return {
      overallQuality: this.assessOverallInteractionQuality(transcript, emotionAnalysis),
      rapport: {
        level: this.assessRapportLevel(emotionAnalysis),
        development: this.assessRapportDevelopment(transcript, emotionAnalysis),
        indicators: this.identifyRapportIndicators(transcript, emotionAnalysis)
      },
      engagement: {
        level: emotionAnalysis.communication.engagement,
        consistency: this.assessEngagementConsistency(transcript, emotionAnalysis),
        peaks: this.identifyEngagementPeaks(transcript, emotionAnalysis),
        dips: this.identifyEngagementDips(transcript, emotionAnalysis)
      },
      responsiveness: {
        questionHandling: this.assessQuestionHandling(transcript),
        adaptability: this.assessAdaptability(transcript, emotionAnalysis),
        clarificationSeeking: this.assessClarificationSeeking(transcript)
      },
      conversationFlow: {
        naturalness: this.assessConversationNaturalness(transcript),
        transitions: this.assessTransitions(transcript),
        momentum: this.assessConversationMomentum(transcript, emotionAnalysis)
      }
    };
  }
  
  private generateTimelineAnalysis(transcript: any, emotionAnalysis: any, confidenceAnalysis: any): any {
    const timeline = transcript.questionResponses.map((qr: any, index: number) => {
      const timePoint = {
        sequence: index + 1,
        timestamp: qr.timestamp || new Date(Date.now() + index * 300000), // Estimate 5 min intervals
        question: qr.question,
        response: qr.response,
        
        // Emotional state at this point
        emotionalState: this.getEmotionalStateAtIndex(emotionAnalysis, index),
        stressLevel: this.getStressLevelAtIndex(emotionAnalysis, index),
        confidenceLevel: this.getConfidenceLevelAtIndex(confidenceAnalysis, index),
        
        // Performance metrics
        responseQuality: this.assessResponseQuality(qr.response, qr.question),
        engagement: this.assessEngagement(qr.response, this.getEmotionalStateAtIndex(emotionAnalysis, index)),
        
        // Key observations
        keyObservations: this.generateKeyObservations(qr, emotionAnalysis, confidenceAnalysis, index),
        turningPoints: this.identifyTurningPoints(qr, emotionAnalysis, confidenceAnalysis, index)
      };
      
      return timePoint;
    });
    
    return {
      totalDuration: this.estimateInterviewDuration(transcript),
      timeline: timeline,
      phases: this.identifyInterviewPhases(timeline),
      criticalMoments: this.identifyCriticalMoments(timeline),
      progressionAnalysis: this.analyzeProgression(timeline),
      performanceTrends: this.analyzePerformanceTrends(timeline)
    };
  }
  
  private generateBehavioralObservations(emotionAnalysis: any, confidenceAnalysis: any): any {
    return {
      personalityTraits: {
        bigFive: emotionAnalysis.psychology,
        workStyle: this.determineWorkStyle(emotionAnalysis.psychology),
        leadershipStyle: this.determineLeadershipStyle({ emotionAnalysis }),
        teamRole: this.determineTeamRole({ emotionAnalysis })
      },
      emotionalIntelligence: {
        selfAwareness: emotionAnalysis.psychology.selfAwareness,
        selfRegulation: emotionAnalysis.psychology.selfRegulation,
        motivation: emotionAnalysis.psychology.motivation,
        empathy: emotionAnalysis.psychology.empathy,
        socialSkills: emotionAnalysis.psychology.socialSkills,
        overallEQ: Math.round((emotionAnalysis.psychology.selfAwareness + emotionAnalysis.psychology.selfRegulation + emotionAnalysis.psychology.motivation + emotionAnalysis.psychology.empathy + emotionAnalysis.psychology.socialSkills) / 5)
      },
      stressResponse: {
        stressLevel: emotionAnalysis.stress.stressLevel,
        copingMechanisms: this.identifyCopingMechanisms(emotionAnalysis.stress),
        resilience: 100 - emotionAnalysis.stress.overallStress,
        recoveryAbility: this.assessRecoveryAbility(emotionAnalysis.stressProgression)
      },
      confidencePatterns: {
        overallConfidence: confidenceAnalysis.metrics.overallConfidence,
        confidenceTrend: confidenceAnalysis.metrics.confidenceTrend,
        confidenceStability: 100 - confidenceAnalysis.metrics.confidenceVariability,
        recoveryAbility: confidenceAnalysis.metrics.confidenceRecovery,
        domainSpecificConfidence: {
          technical: confidenceAnalysis.metrics.technicalConfidence,
          communication: confidenceAnalysis.metrics.communicationConfidence
        }
      },
      adaptability: {
        questionAdaptation: this.assessQuestionAdaptation(emotionAnalysis),
        stressAdaptation: this.assessStressAdaptation(emotionAnalysis),
        environmentalAdaptation: this.assessEnvironmentalAdaptation(emotionAnalysis)
      }
    };
  }
  
  private generateTechnicalDiscussionAnalysis(feedback: any, scores: any): any {
    return {
      overallTechnicalPerformance: {
        technicalScore: scores.technical,
        technicalCorrectness: scores.technicalCorrectness,
        conceptualUnderstanding: scores.conceptualUnderstanding,
        practicalApplication: scores.practicalApplication
      },
      questionAnalysis: feedback.questionResponses
        .filter((qr: any) => this.isTechnicalQuestion(qr.question))
        .map((qr: any, index: number) => ({
          questionNumber: index + 1,
          question: qr.question,
          response: qr.response,
          technicalCategory: this.categorizeTechnicalQuestion(qr.question),
          difficultyLevel: this.assessQuestionDifficulty(qr.question),
          conceptsCovered: this.extractTechnicalConcepts(qr.response),
          accuracyAssessment: this.assessTechnicalAccuracy(qr.response, qr.question),
          depthAnalysis: this.assessTechnicalDepth(qr.response),
          practicalRelevance: this.assessPracticalRelevance(qr.response),
          improvementAreas: this.identifyTechnicalImprovements(qr.response, qr.question)
        })),
      technicalStrengths: this.identifyTechnicalStrengths(feedback.questionResponses),
      knowledgeGaps: this.identifyKnowledgeGaps(feedback.questionResponses),
      recommendedLearning: this.generateTechnicalLearningRecommendations(feedback.questionResponses, scores)
    };
  }
  
  private generateKeyMoments(transcript: any, emotionAnalysis: any, confidenceAnalysis: any): any[] {
    const moments: any[] = [];
    
    // Identify peak performance moments
    transcript.questionResponses.forEach((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const stressLevel = this.getStressLevelAtIndex(emotionAnalysis, index);
      const confidenceLevel = this.getConfidenceLevelAtIndex(confidenceAnalysis, index);
      
      // Peak confidence moment
      if (confidenceLevel > 80) {
        moments.push({
          type: 'peak_confidence',
          sequence: index + 1,
          question: qr.question,
          response: qr.response.substring(0, 200) + '...',
          analysis: 'Candidate demonstrated exceptional confidence and clarity',
          metrics: { confidence: confidenceLevel, stress: stressLevel, emotion: emotionalState },
          significance: 'High'
        });
      }
      
      // Stress recovery moment
      if (index > 0 && stressLevel < this.getStressLevelAtIndex(emotionAnalysis, index - 1) - 20) {
        moments.push({
          type: 'stress_recovery',
          sequence: index + 1,
          question: qr.question,
          response: qr.response.substring(0, 200) + '...',
          analysis: 'Candidate showed excellent stress recovery and resilience',
          metrics: { confidence: confidenceLevel, stress: stressLevel, emotion: emotionalState },
          significance: 'High'
        });
      }
      
      // Technical breakthrough moment
      if (this.isTechnicalQuestion(qr.question) && qr.response.length > 300) {
        moments.push({
          type: 'technical_depth',
          sequence: index + 1,
          question: qr.question,
          response: qr.response.substring(0, 200) + '...',
          analysis: 'Candidate provided comprehensive technical explanation',
          metrics: { confidence: confidenceLevel, stress: stressLevel, emotion: emotionalState },
          significance: 'Medium'
        });
      }
      
      // Emotional stability moment
      if (emotionalState === 'Confident' || emotionalState === 'Trust') {
        moments.push({
          type: 'emotional_stability',
          sequence: index + 1,
          question: qr.question,
          response: qr.response.substring(0, 200) + '...',
          analysis: 'Candidate maintained excellent emotional composure',
          metrics: { confidence: confidenceLevel, stress: stressLevel, emotion: emotionalState },
          significance: 'Medium'
        });
      }
    });
    
    return moments.sort((a, b) => b.metrics.confidence - a.metrics.confidence).slice(0, 10);
  }
  
  private generateResponseAnalysis(questionResponses: any[], emotionAnalysis: any): any {
    return {
      overallAnalysis: {
        totalResponses: questionResponses.length,
        averageScore: Math.round(questionResponses.reduce((sum, qr) => sum + qr.score, 0) / questionResponses.length),
        averageLength: Math.round(questionResponses.reduce((sum, qr) => sum + qr.response.length, 0) / questionResponses.length),
        responseConsistency: this.calculateResponseConsistency(questionResponses)
      },
      categoryAnalysis: {
        technical: this.analyzeResponseCategory(questionResponses, 'technical'),
        behavioral: this.analyzeResponseCategory(questionResponses, 'behavioral'),
        experiential: this.analyzeResponseCategory(questionResponses, 'experiential'),
        situational: this.analyzeResponseCategory(questionResponses, 'situational')
      },
      qualityMetrics: {
        clarity: this.calculateAverageClarity(questionResponses),
        completeness: this.calculateAverageCompleteness(questionResponses),
        relevance: this.calculateAverageRelevance(questionResponses),
        specificity: this.calculateAverageSpecificity(questionResponses),
        structure: this.calculateAverageStructure(questionResponses)
      },
      improvementPatterns: this.identifyImprovementPatterns(questionResponses),
      strengthPatterns: this.identifyStrengthPatterns(questionResponses)
    };
  }
  
  private generateImprovementInsights(feedback: any, emotionAnalysis: any, audience: string): any {
    const insights: any = {
      priorityAreas: feedback.improvements.slice(0, 3),
      developmentPlan: this.createDevelopmentPlan(feedback.improvements, audience),
      practiceRecommendations: this.generatePracticeRecommendations(feedback.improvements, emotionAnalysis),
      resourceSuggestions: this.suggestResources(feedback.improvements),
      timelineRecommendations: this.generateTimelineRecommendations(feedback.improvements),
      measurableGoals: this.generateMeasurableGoals(feedback.improvements, emotionAnalysis)
    };
    
    if (audience === 'student') {
      insights.motivationalInsights = this.generateMotivationalInsights(feedback, emotionAnalysis);
      insights.personalizedTips = this.generatePersonalizedTips(feedback, emotionAnalysis);
    }
    
    return insights;
  }
  
  private generateCompleteTranscript(transcript: any, emotionAnalysis: any, confidenceAnalysis: any): string {
    let completeTranscript = `COMPLETE INTERVIEW TRANSCRIPT\n`;
    completeTranscript += `=====================================\n\n`;
    completeTranscript += `Interview Date: ${new Date().toLocaleDateString()}\n`;
    completeTranscript += `Total Questions: ${transcript.questionResponses.length}\n`;
    completeTranscript += `Overall Emotional Stability: ${emotionAnalysis.emotionalStability}/100\n`;
    completeTranscript += `Overall Confidence: ${confidenceAnalysis.metrics.overallConfidence}/100\n`;
    completeTranscript += `Communication Effectiveness: ${emotionAnalysis.communicationEffectiveness}/100\n\n`;
    
    transcript.questionResponses.forEach((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const stressLevel = this.getStressLevelAtIndex(emotionAnalysis, index);
      const confidenceLevel = this.getConfidenceLevelAtIndex(confidenceAnalysis, index);
      
      completeTranscript += `QUESTION ${index + 1}\n`;
      completeTranscript += `Time: ${qr.timestamp || 'Not recorded'}\n`;
      completeTranscript += `Category: ${this.categorizeQuestion(qr.question)}\n`;
      completeTranscript += `Difficulty: ${this.assessQuestionDifficulty(qr.question)}\n\n`;
      
      completeTranscript += `INTERVIEWER: ${qr.question}\n\n`;
      
      completeTranscript += `CANDIDATE: ${qr.response}\n\n`;
      
      completeTranscript += `ANALYSIS:\n`;
      completeTranscript += `- Emotional State: ${emotionalState}\n`;
      completeTranscript += `- Stress Level: ${stressLevel}/100\n`;
      completeTranscript += `- Confidence Level: ${confidenceLevel}/100\n`;
      completeTranscript += `- Response Length: ${qr.response.split(' ').length} words\n`;
      completeTranscript += `- Technical Terms: ${this.extractTechnicalTerms(qr.response).length}\n`;
      completeTranscript += `- Clarity Score: ${this.assessResponseClarity(qr.response)}/100\n`;
      completeTranscript += `- Completeness Score: ${this.assessResponseCompleteness(qr.response, qr.question)}/100\n\n`;
      
      completeTranscript += `KEY OBSERVATIONS:\n`;
      const observations = this.generateKeyObservations(qr, emotionAnalysis, confidenceAnalysis, index);
      observations.forEach((obs: string) => {
        completeTranscript += `- ${obs}\n`;
      });
      
      completeTranscript += `\n${'='.repeat(80)}\n\n`;
    });
    
    completeTranscript += `INTERVIEW SUMMARY\n`;
    completeTranscript += `================\n`;
    completeTranscript += `Total Duration: ${this.estimateInterviewDuration(transcript)} minutes\n`;
    completeTranscript += `Average Response Length: ${Math.round(transcript.questionResponses.reduce((sum: number, qr: any) => sum + qr.response.split(' ').length, 0) / transcript.questionResponses.length)} words\n`;
    completeTranscript += `Emotional Journey: ${emotionAnalysis.dominantEmotions.join(' → ')}\n`;
    completeTranscript += `Confidence Trend: ${confidenceAnalysis.metrics.confidenceTrend}\n`;
    completeTranscript += `Overall Performance: ${this.getPerformanceLevel(emotionAnalysis.overallWellbeing)}\n`;
    
    return completeTranscript;
  }
  
  private generateStudentFocusedTranscript(transcript: any, emotionAnalysis: any, feedback: any): string {
    let studentTranscript = `YOUR INTERVIEW PERFORMANCE TRANSCRIPT\n`;
    studentTranscript += `====================================\n\n`;
    studentTranscript += `This detailed transcript shows your responses with personalized feedback to help you improve.\n\n`;
    
    transcript.questionResponses.forEach((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const feedbackQR = feedback.questionResponses[index];
      
      studentTranscript += `QUESTION ${index + 1}\n`;
      studentTranscript += `${qr.question}\n\n`;
      
      studentTranscript += `YOUR RESPONSE:\n`;
      studentTranscript += `${qr.response}\n\n`;
      
      studentTranscript += `FEEDBACK & ANALYSIS:\n`;
      studentTranscript += `Score: ${feedbackQR?.score || 'N/A'}/100\n`;
      studentTranscript += `Emotional State: ${emotionalState}\n`;
      studentTranscript += `Response Quality: ${this.getResponseQualityDescription(qr.response, qr.question)}\n\n`;
      
      if (feedbackQR?.feedback) {
        studentTranscript += `DETAILED FEEDBACK:\n`;
        studentTranscript += `${feedbackQR.feedback}\n\n`;
      }
      
      const improvements = this.generateResponseImprovements(qr.response, qr.question);
      if (improvements.length > 0) {
        studentTranscript += `IMPROVEMENT SUGGESTIONS:\n`;
        improvements.forEach((imp: string) => {
          studentTranscript += `• ${imp}\n`;
        });
        studentTranscript += `\n`;
      }
      
      const strengths = this.identifyResponseStrengths(qr.response, qr.question);
      if (strengths.length > 0) {
        studentTranscript += `WHAT YOU DID WELL:\n`;
        strengths.forEach((strength: string) => {
          studentTranscript += `• ${strength}\n`;
        });
        studentTranscript += `\n`;
      }
      
      studentTranscript += `${'-'.repeat(60)}\n\n`;
    });
    
    studentTranscript += `OVERALL PERFORMANCE SUMMARY\n`;
    studentTranscript += `==========================\n`;
    studentTranscript += `Your interview showed ${this.getPerformanceLevel(emotionAnalysis.overallWellbeing)} performance with many positive aspects.\n`;
    studentTranscript += `Key strengths: ${feedback.strengths.slice(0, 3).join(', ')}\n`;
    studentTranscript += `Growth areas: ${feedback.improvements.slice(0, 3).join(', ')}\n\n`;
    studentTranscript += `Remember: Every interview is a learning opportunity. Use this feedback to continue growing!\n`;
    
    return studentTranscript;
  }
  
  // Helper methods for detailed transcript generation
  private getEmotionalStateAtIndex(emotionAnalysis: any, index: number): string {
    if (!emotionAnalysis.emotionalJourney || index >= emotionAnalysis.emotionalJourney.length) {
      return 'Neutral';
    }
    
    const segment = emotionAnalysis.emotionalJourney[index];
    const dominantEmotion = Object.entries(segment)
      .filter(([key]) => ['joy', 'trust', 'fear', 'surprise', 'sadness', 'anger', 'anticipation', 'disgust'].includes(key))
      .sort(([, a], [, b]) => (b as number) - (a as number))[0];
    
    if (dominantEmotion && dominantEmotion[1] > 40) {
      return dominantEmotion[0].charAt(0).toUpperCase() + dominantEmotion[0].slice(1);
    }
    
    return 'Neutral';
  }
  
  private getStressLevelAtIndex(emotionAnalysis: any, index: number): number {
    if (!emotionAnalysis.stressProgression || index >= emotionAnalysis.stressProgression.length) {
      return emotionAnalysis.stress?.overallStress || 50;
    }
    return emotionAnalysis.stressProgression[index] || 50;
  }
  
  private getConfidenceLevelAtIndex(confidenceAnalysis: any, index: number): number {
    if (!confidenceAnalysis.timeline || index >= confidenceAnalysis.timeline.length) {
      return confidenceAnalysis.metrics?.overallConfidence || 50;
    }
    return confidenceAnalysis.timeline[index]?.confidence || 50;
  }
  
  private analyzeQuestionIntent(question: string): string {
    const lower = question.toLowerCase();
    if (lower.includes('tell me about') || lower.includes('describe')) return 'Information Gathering';
    if (lower.includes('how would you') || lower.includes('what would you do')) return 'Scenario Assessment';
    if (lower.includes('why') || lower.includes('explain')) return 'Reasoning Evaluation';
    if (lower.includes('experience') || lower.includes('example')) return 'Experience Validation';
    if (lower.includes('challenge') || lower.includes('difficult')) return 'Problem-Solving Assessment';
    return 'General Assessment';
  }
  
  private assessQuestionDifficulty(question: string): string {
    const lower = question.toLowerCase();
    const complexityIndicators = ['complex', 'advanced', 'detailed', 'comprehensive', 'analyze', 'evaluate', 'compare'];
    const basicIndicators = ['basic', 'simple', 'tell me', 'describe', 'what is'];
    
    const complexCount = complexityIndicators.filter(indicator => lower.includes(indicator)).length;
    const basicCount = basicIndicators.filter(indicator => lower.includes(indicator)).length;
    
    if (complexCount > basicCount && complexCount > 1) return 'High';
    if (basicCount > complexCount) return 'Low';
    return 'Medium';
  }
  
  private estimateResponseTime(response: string): number {
    // Estimate based on word count (average speaking rate: 150 words/minute)
    const wordCount = response.split(' ').length;
    return Math.round((wordCount / 150) * 60); // seconds
  }
  
  private assessResponseConfidence(response: string, emotionalState: string): number {
    let confidence = 50;
    
    // Positive indicators
    if (response.includes('I am confident') || response.includes('I believe')) confidence += 20;
    if (response.includes('definitely') || response.includes('certainly')) confidence += 15;
    if (emotionalState === 'Trust' || emotionalState === 'Joy') confidence += 15;
    
    // Negative indicators
    if (response.includes('I think maybe') || response.includes('I guess')) confidence -= 15;
    if (response.includes('um') || response.includes('uh')) confidence -= 10;
    if (emotionalState === 'Fear' || emotionalState === 'Anxiety') confidence -= 20;
    
    return Math.max(0, Math.min(100, confidence));
  }
  
  private assessResponseClarity(response: string): number {
    let clarity = 50;
    
    // Positive indicators
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = response.split(' ').length / sentences.length;
    
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) clarity += 20; // Good sentence length
    if (response.includes('first') || response.includes('second') || response.includes('finally')) clarity += 15; // Structure
    if (response.includes('for example') || response.includes('specifically')) clarity += 10; // Examples
    
    // Negative indicators
    if (avgWordsPerSentence > 30) clarity -= 15; // Too long sentences
    if (response.includes('um') || response.includes('uh')) clarity -= 10; // Filler words
    if (sentences.length < 2 && response.split(' ').length > 50) clarity -= 20; // Run-on sentences
    
    return Math.max(0, Math.min(100, clarity));
  }
  
  private assessResponseCompleteness(response: string, question: string): number {
    let completeness = 50;
    
    const questionWords = question.toLowerCase().split(' ');
    const responseWords = response.toLowerCase().split(' ');
    
    // Check if response addresses key question words
    const keyWords = questionWords.filter(word => 
      word.length > 3 && !['what', 'how', 'why', 'when', 'where', 'would', 'could', 'should'].includes(word)
    );
    
    const addressedWords = keyWords.filter(word => responseWords.includes(word));
    const addressedRatio = addressedWords.length / Math.max(1, keyWords.length);
    
    completeness += addressedRatio * 30;
    
    // Length consideration
    if (response.split(' ').length >= 50) completeness += 20;
    if (response.split(' ').length >= 100) completeness += 10;
    
    return Math.max(0, Math.min(100, completeness));
  }
  
  private assessEngagement(response: string, emotionalState: string): number {
    let engagement = 50;
    
    // Positive indicators
    if (response.includes('excited') || response.includes('passionate')) engagement += 20;
    if (response.includes('love') || response.includes('enjoy')) engagement += 15;
    if (emotionalState === 'Joy' || emotionalState === 'Anticipation') engagement += 15;
    if (response.split(' ').length > 75) engagement += 10; // Detailed response
    
    // Negative indicators
    if (response.split(' ').length < 20) engagement -= 20; // Too brief
    if (emotionalState === 'Sadness' || emotionalState === 'Fear') engagement -= 15;
    
    return Math.max(0, Math.min(100, engagement));
  }
  
  private assessRapport(emotionalState: string, stressLevel: number): number {
    let rapport = 50;
    
    if (emotionalState === 'Trust' || emotionalState === 'Joy') rapport += 20;
    if (stressLevel < 30) rapport += 15;
    if (stressLevel > 70) rapport -= 20;
    if (emotionalState === 'Fear' || emotionalState === 'Anger') rapport -= 15;
    
    return Math.max(0, Math.min(100, rapport));
  }
  
  private assessConversationFlow(response: string, index: number): number {
    let flow = 50;
    
    // Good flow indicators
    if (response.includes('building on') || response.includes('as I mentioned')) flow += 15;
    if (response.includes('similarly') || response.includes('in addition')) flow += 10;
    
    // Poor flow indicators
    if (index > 0 && response.split(' ').length < 15) flow -= 15; // Too brief for later questions
    
    return Math.max(0, Math.min(100, flow));
  }
  
  private assessOverallConversationQuality(flow: any[]): number {
    const avgEngagement = flow.reduce((sum: number, f: any) => sum + f.interaction.engagement, 0) / flow.length;
    const avgRapport = flow.reduce((sum: number, f: any) => sum + f.interaction.rapport, 0) / flow.length;
    const avgFlow = flow.reduce((sum: number, f: any) => sum + f.interaction.flow, 0) / flow.length;
    
    return Math.round((avgEngagement + avgRapport + avgFlow) / 3);
  }
  
  private categorizeAllQuestions(questionResponses: any[]): any {
    const categories = {
      technical: 0,
      behavioral: 0,
      experiential: 0,
      situational: 0,
      general: 0
    };
    
    questionResponses.forEach(qr => {
      const category = this.categorizeQuestion(qr.question).toLowerCase();
      if (category.includes('technical')) categories.technical++;
      else if (category.includes('behavioral')) categories.behavioral++;
      else if (category.includes('experience')) categories.experiential++;
      else if (category.includes('situational')) categories.situational++;
      else categories.general++;
    });
    
    return categories;
  }
  
  private analyzeQuestioningStrategy(questionResponses: any[]): string {
    const categories = this.categorizeAllQuestions(questionResponses);
    const total = questionResponses.length;
    
    if (categories.technical / total > 0.5) return 'Technical-focused strategy';
    if (categories.behavioral / total > 0.4) return 'Behavioral-focused strategy';
    if (categories.experiential / total > 0.4) return 'Experience-focused strategy';
    return 'Balanced questioning strategy';
  }
  
  private analyzeDifficultyProgression(questionResponses: any[]): string {
    const difficulties = questionResponses.map(qr => {
      const diff = this.assessQuestionDifficulty(qr.question);
      return diff === 'High' ? 3 : diff === 'Medium' ? 2 : 1;
    });
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < difficulties.length; i++) {
      if (difficulties[i] > difficulties[i-1]) increasing++;
      if (difficulties[i] < difficulties[i-1]) decreasing++;
    }
    
    if (increasing > decreasing) return 'Progressive difficulty increase';
    if (decreasing > increasing) return 'Difficulty tapering approach';
    return 'Mixed difficulty pattern';
  }
  
  private generateExpectedResponse(question: string): string {
    const category = this.categorizeQuestion(question);
    
    switch (category) {
      case 'Technical':
        return 'Expected: Detailed technical explanation with examples and best practices';
      case 'Behavioral':
        return 'Expected: STAR method response with specific situation, task, action, and result';
      case 'Experience':
        return 'Expected: Specific examples from past work or projects with measurable outcomes';
      default:
        return 'Expected: Clear, structured response with relevant examples';
    }
  }
  
  private assessResponseQuality(response: string, question: string): number {
    const clarity = this.assessResponseClarity(response);
    const completeness = this.assessResponseCompleteness(response, question);
    const relevance = this.assessRelevance(response, question);
    
    return Math.round((clarity + completeness + relevance) / 3);
  }
  
  private identifyFollowUpOpportunities(question: string, response: string): string[] {
    const opportunities: string[] = [];
    
    if (response.includes('project') && !response.includes('challenge')) {
      opportunities.push('Ask about challenges faced in the project');
    }
    
    if (response.includes('team') && !response.includes('conflict')) {
      opportunities.push('Explore team dynamics and conflict resolution');
    }
    
    if (this.isTechnicalQuestion(question) && response.split(' ').length < 50) {
      opportunities.push('Request more detailed technical explanation');
    }
    
    if (response.includes('learned') || response.includes('experience')) {
      opportunities.push('Ask about specific lessons learned');
    }
    
    return opportunities;
  }
  
  private extractTechnicalTerms(response: string): string[] {
    const technicalTerms = [
      'algorithm', 'database', 'api', 'framework', 'library', 'architecture', 'design pattern',
      'microservices', 'cloud', 'docker', 'kubernetes', 'react', 'angular', 'vue', 'node',
      'python', 'java', 'javascript', 'typescript', 'sql', 'nosql', 'mongodb', 'postgresql',
      'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'aws', 'azure', 'gcp', 'devops',
      'ci/cd', 'testing', 'unit test', 'integration test', 'tdd', 'bdd', 'agile', 'scrum'
    ];
    
    const words = response.toLowerCase().split(/\W+/);
    return technicalTerms.filter(term => 
      words.some(word => word.includes(term) || term.includes(word))
    );
  }
  
  private identifyStressIndicators(response: string): string[] {
    const indicators: string[] = [];
    
    if (response.includes('um') || response.includes('uh')) {
      indicators.push('Filler words indicating hesitation');
    }
    
    if (response.includes('I think maybe') || response.includes('I guess')) {
      indicators.push('Uncertain language patterns');
    }
    
    if (response.split(' ').length < 20) {
      indicators.push('Unusually brief response');
    }
    
    if (response.includes('difficult') || response.includes('challenging')) {
      indicators.push('Acknowledgment of difficulty');
    }
    
    return indicators;
  }
  
  private identifyConfidenceMarkers(response: string): string[] {
    const markers: string[] = [];
    
    if (response.includes('confident') || response.includes('certain')) {
      markers.push('Direct confidence statements');
    }
    
    if (response.includes('definitely') || response.includes('absolutely')) {
      markers.push('Strong affirmative language');
    }
    
    if (response.includes('experience') && response.includes('successful')) {
      markers.push('Reference to successful experiences');
    }
    
    if (response.split(' ').length > 100) {
      markers.push('Detailed, comprehensive response');
    }
    
    return markers;
  }
  
  private assessProfessionalism(response: string): number {
    let professionalism = 50;
    
    // Positive indicators
    if (response.includes('professional') || response.includes('business')) professionalism += 15;
    if (response.includes('stakeholder') || response.includes('client')) professionalism += 10;
    if (response.includes('process') || response.includes('methodology')) professionalism += 10;
    
    // Negative indicators
    if (response.includes('whatever') || response.includes('stuff')) professionalism -= 20;
    if (response.includes('like') && response.split('like').length > 3) professionalism -= 10;
    
    return Math.max(0, Math.min(100, professionalism));
  }
  
  private generateResponseImprovements(response: string, question: string): string[] {
    const improvements: string[] = [];
    
    if (response.split(' ').length < 30) {
      improvements.push('Provide more detailed explanations with specific examples');
    }
    
    if (!response.includes('example') && !response.includes('instance')) {
      improvements.push('Include concrete examples to illustrate your points');
    }
    
    if (this.isTechnicalQuestion(question) && this.extractTechnicalTerms(response).length < 2) {
      improvements.push('Use more specific technical terminology');
    }
    
    if (response.includes('um') || response.includes('uh')) {
      improvements.push('Practice reducing filler words for smoother delivery');
    }
    
    if (this.assessResponseStructure(response) < 60) {
      improvements.push('Structure responses with clear beginning, middle, and end');
    }
    
    return improvements;
  }
  
  private identifyResponseStrengths(response: string, question: string): string[] {
    const strengths: string[] = [];
    
    if (response.split(' ').length > 75) {
      strengths.push('Provided comprehensive and detailed response');
    }
    
    if (response.includes('example') || response.includes('instance')) {
      strengths.push('Supported answer with concrete examples');
    }
    
    if (this.isTechnicalQuestion(question) && this.extractTechnicalTerms(response).length > 3) {
      strengths.push('Demonstrated strong technical vocabulary');
    }
    
    if (response.includes('result') || response.includes('outcome')) {
      strengths.push('Focused on measurable results and outcomes');
    }
    
    if (this.assessResponseStructure(response) > 70) {
      strengths.push('Well-structured and organized response');
    }
    
    return strengths;
  }
  
  private calculateReadabilityScore(response: string): number {
    const words = response.split(' ').length;
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(1, sentences);
    
    // Optimal range: 15-20 words per sentence
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 20) return 90;
    if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 25) return 75;
    if (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 30) return 60;
    return 40;
  }
  
  private assessTechnicalDepth(response: string): number {
    const technicalTerms = this.extractTechnicalTerms(response);
    const concepts = this.extractTechnicalConcepts(response);
    
    let depth = 30;
    depth += technicalTerms.length * 5;
    depth += concepts.length * 10;
    
    if (response.includes('architecture') || response.includes('design')) depth += 15;
    if (response.includes('scalability') || response.includes('performance')) depth += 10;
    if (response.includes('best practice') || response.includes('pattern')) depth += 10;
    
    return Math.min(100, depth);
  }
  
  private assessSpecificity(response: string): number {
    let specificity = 30;
    
    // Numbers and metrics
    const numbers = response.match(/\d+/g);
    if (numbers) specificity += Math.min(20, numbers.length * 5);
    
    // Specific examples
    if (response.includes('for example') || response.includes('specifically')) specificity += 15;
    if (response.includes('such as') || response.includes('including')) specificity += 10;
    
    // Proper nouns (technologies, companies, etc.)
    const properNouns = response.match(/[A-Z][a-z]+/g);
    if (properNouns) specificity += Math.min(15, properNouns.length * 2);
    
    return Math.min(100, specificity);
  }
  
  private assessResponseStructure(response: string): number {
    let structure = 40;
    
    // Structure indicators
    if (response.includes('first') || response.includes('second') || response.includes('finally')) structure += 20;
    if (response.includes('however') || response.includes('therefore') || response.includes('moreover')) structure += 15;
    if (response.includes('in conclusion') || response.includes('to summarize')) structure += 10;
    
    // Paragraph-like structure (multiple sentences)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length >= 3) structure += 15;
    if (sentences.length >= 5) structure += 10;
    
    return Math.min(100, structure);
  }
  
  private assessEnthusiasm(response: string, emotionalState: string): number {
    let enthusiasm = 40;
    
    if (emotionalState === 'Joy' || emotionalState === 'Anticipation') enthusiasm += 25;
    if (response.includes('excited') || response.includes('passionate')) enthusiasm += 20;
    if (response.includes('love') || response.includes('enjoy')) enthusiasm += 15;
    if (response.includes('!')) enthusiasm += 10;
    
    return Math.min(100, enthusiasm);
  }
  
  private assessRelevance(response: string, question: string): number {
    const questionWords = question.toLowerCase().split(' ').filter(word => word.length > 3);
    const responseWords = response.toLowerCase().split(' ');
    
    const relevantWords = questionWords.filter(word => responseWords.includes(word));
    const relevanceRatio = relevantWords.length / Math.max(1, questionWords.length);
    
    return Math.round(relevanceRatio * 100);
  }
  
  private extractExamples(response: string): string[] {
    const examples: string[] = [];
    
    const examplePhrases = [
      'for example', 'for instance', 'such as', 'like when', 'in my experience',
      'I once', 'I worked on', 'I developed', 'I implemented'
    ];
    
    examplePhrases.forEach(phrase => {
      if (response.toLowerCase().includes(phrase)) {
        const index = response.toLowerCase().indexOf(phrase);
        const exampleText = response.substring(index, index + 100);
        examples.push(exampleText.trim());
      }
    });
    
    return examples;
  }
  
  private assessTechnicalAccuracy(response: string, question: string): number {
    // This is a simplified assessment - in a real system, this would be more sophisticated
    const technicalTerms = this.extractTechnicalTerms(response);
    const concepts = this.extractTechnicalConcepts(response);
    
    let accuracy = 50;
    
    if (this.isTechnicalQuestion(question)) {
      if (technicalTerms.length > 0) accuracy += 20;
      if (concepts.length > 0) accuracy += 15;
      if (response.includes('best practice') || response.includes('standard')) accuracy += 10;
      if (response.includes('performance') || response.includes('optimization')) accuracy += 5;
    }
    
    return Math.min(100, accuracy);
  }
  
  private assessProblemSolvingApproach(response: string): number {
    let approach = 40;
    
    // Problem-solving indicators
    if (response.includes('analyze') || response.includes('evaluate')) approach += 15;
    if (response.includes('step') || response.includes('process')) approach += 15;
    if (response.includes('consider') || response.includes('factor')) approach += 10;
    if (response.includes('solution') || response.includes('approach')) approach += 10;
    if (response.includes('alternative') || response.includes('option')) approach += 10;
    
    return Math.min(100, approach);
  }
  
  private generateImmediateImprovements(response: string, question: string): string[] {
    const improvements: string[] = [];
    
    if (response.split(' ').length < 25) {
      improvements.push('Expand your answer with more details and examples');
    }
    
    if (response.includes('um') || response.includes('uh')) {
      improvements.push('Practice speaking more fluently without filler words');
    }
    
    if (!response.includes('.') || response.split('.').length < 2) {
      improvements.push('Structure your response in multiple clear sentences');
    }
    
    return improvements;
  }
  
  private generateStructuralImprovements(response: string, question: string): string[] {
    const improvements: string[] = [];
    
    if (!response.includes('first') && !response.includes('second')) {
      improvements.push('Use structured approaches like "First... Second... Finally..."');
    }
    
    if (this.categorizeQuestion(question) === 'Behavioral' && !response.includes('situation')) {
      improvements.push('Use the STAR method: Situation, Task, Action, Result');
    }
    
    if (response.split(/[.!?]+/).length < 3) {
      improvements.push('Break down complex ideas into multiple clear points');
    }
    
    return improvements;
  }
  
  private generateContentImprovements(response: string, question: string): string[] {
    const improvements: string[] = [];
    
    if (!response.includes('example') && !response.includes('instance')) {
      improvements.push('Include specific examples to illustrate your points');
    }
    
    if (this.isTechnicalQuestion(question) && this.extractTechnicalTerms(response).length < 2) {
      improvements.push('Use more specific technical terminology and concepts');
    }
    
    if (!response.includes('result') && !response.includes('outcome')) {
      improvements.push('Discuss the results and impact of your actions');
    }
    
    return improvements;
  }
  
  private generateDeliveryImprovements(response: string, emotionalState: string, stressLevel: number): string[] {
    const improvements: string[] = [];
    
    if (stressLevel > 70) {
      improvements.push('Practice relaxation techniques to manage interview stress');
    }
    
    if (emotionalState === 'Fear' || emotionalState === 'Anxiety') {
      improvements.push('Build confidence through mock interviews and preparation');
    }
    
    if (response.split(' ').length < 30) {
      improvements.push('Take time to think and provide more comprehensive answers');
    }
    
    return improvements;
  }
  
  private identifyContentStrengths(response: string, question: string): string[] {
    const strengths: string[] = [];
    
    if (response.includes('example') || response.includes('instance')) {
      strengths.push('Provided concrete examples');
    }
    
    if (response.includes('result') || response.includes('outcome')) {
      strengths.push('Focused on measurable results');
    }
    
    if (this.isTechnicalQuestion(question) && this.extractTechnicalTerms(response).length > 2) {
      strengths.push('Demonstrated technical knowledge');
    }
    
    return strengths;
  }
  
  private identifyBehavioralStrengths(response: string, emotionalState: string): string[] {
    const strengths: string[] = [];
    
    if (emotionalState === 'Trust' || emotionalState === 'Joy') {
      strengths.push('Maintained positive emotional state');
    }
    
    if (response.includes('team') || response.includes('collaboration')) {
      strengths.push('Emphasized teamwork and collaboration');
    }
    
    if (response.includes('learn') || response.includes('growth')) {
      strengths.push('Showed commitment to learning and growth');
    }
    
    return strengths;
  }
  
  private isTechnicalQuestion(question: string): boolean {
    const technicalKeywords = [
      'technical', 'code', 'programming', 'algorithm', 'database', 'system', 'architecture',
      'design', 'implement', 'develop', 'software', 'application', 'framework', 'library',
      'api', 'performance', 'scalability', 'security', 'testing', 'debugging'
    ];
    
    const lower = question.toLowerCase();
    return technicalKeywords.some(keyword => lower.includes(keyword));
  }
  
  private extractTechnicalConcepts(response: string): string[] {
    const concepts = [
      'object-oriented programming', 'functional programming', 'data structures', 'algorithms',
      'design patterns', 'microservices', 'monolithic architecture', 'rest api', 'graphql',
      'database normalization', 'acid properties', 'cap theorem', 'eventual consistency',
      'load balancing', 'caching', 'cdn', 'horizontal scaling', 'vertical scaling',
      'continuous integration', 'continuous deployment', 'test-driven development',
      'behavior-driven development', 'agile methodology', 'scrum framework'
    ];
    
    const lower = response.toLowerCase();
    return concepts.filter(concept => lower.includes(concept));
  }
  
  private categorizeTechnicalQuestion(question: string): string {
    const lower = question.toLowerCase();
    
    if (lower.includes('algorithm') || lower.includes('data structure')) return 'Algorithms & Data Structures';
    if (lower.includes('system') || lower.includes('architecture')) return 'System Design';
    if (lower.includes('database') || lower.includes('sql')) return 'Database';
    if (lower.includes('api') || lower.includes('service')) return 'API Design';
    if (lower.includes('test') || lower.includes('debug')) return 'Testing & Debugging';
    if (lower.includes('performance') || lower.includes('optimization')) return 'Performance';
    if (lower.includes('security') || lower.includes('authentication')) return 'Security';
    
    return 'General Technical';
  }
  
  private identifyTechnicalStrengths(questionResponses: any[]): string[] {
    const strengths: string[] = [];
    
    const technicalResponses = questionResponses.filter(qr => this.isTechnicalQuestion(qr.question));
    
    if (technicalResponses.length > 0) {
      const avgTechnicalTerms = technicalResponses.reduce((sum, qr) => 
        sum + this.extractTechnicalTerms(qr.response).length, 0) / technicalResponses.length;
      
      if (avgTechnicalTerms > 3) {
        strengths.push('Strong technical vocabulary and terminology usage');
      }
      
      const conceptualResponses = technicalResponses.filter(qr => 
        this.extractTechnicalConcepts(qr.response).length > 0);
      
      if (conceptualResponses.length > technicalResponses.length * 0.5) {
        strengths.push('Good understanding of technical concepts and principles');
      }
    }
    
    return strengths;
  }
  
  private identifyKnowledgeGaps(questionResponses: any[]): string[] {
    const gaps: string[] = [];
    
    const technicalResponses = questionResponses.filter(qr => this.isTechnicalQuestion(qr.question));
    
    technicalResponses.forEach(qr => {
      if (this.extractTechnicalTerms(qr.response).length < 2) {
        const category = this.categorizeTechnicalQuestion(qr.question);
        gaps.push(`Limited technical depth in ${category}`);
      }
    });
    
    return [...new Set(gaps)]; // Remove duplicates
  }
  
  private generateTechnicalLearningRecommendations(questionResponses: any[], scores: any): string[] {
    const recommendations: string[] = [];
    
    if (scores.technicalCorrectness < 70) {
      recommendations.push('Focus on improving technical accuracy through practice and study');
    }
    
    if (scores.conceptualUnderstanding < 70) {
      recommendations.push('Deepen understanding of fundamental computer science concepts');
    }
    
    if (scores.practicalApplication < 70) {
      recommendations.push('Gain more hands-on experience with real-world projects');
    }
    
    const gaps = this.identifyKnowledgeGaps(questionResponses);
    gaps.forEach(gap => {
      recommendations.push(`Study and practice ${gap.toLowerCase()}`);
    });
    
    return recommendations;
  }
  
  // Additional helper methods for comprehensive analysis
  private calculateEmotionalRange(emotionalJourney: any[]): number {
    if (!emotionalJourney || emotionalJourney.length === 0) return 0;
    
    const allEmotions = emotionalJourney.flatMap(segment => Object.values(segment));
    const max = Math.max(...allEmotions as number[]);
    const min = Math.min(...allEmotions as number[]);
    
    return Math.round(max - min);
  }
  
  private getDominantEmotion(segment: any): string {
    const emotions = Object.entries(segment)
      .filter(([key]) => ['joy', 'trust', 'fear', 'surprise', 'sadness', 'anger', 'anticipation', 'disgust'].includes(key))
      .sort(([, a], [, b]) => (b as number) - (a as number));
    
    return emotions[0] ? emotions[0][0].charAt(0).toUpperCase() + emotions[0][0].slice(1) : 'Neutral';
  }
  
  private calculateEmotionalIntensity(segment: any): number {
    const emotions = Object.values(segment) as number[];
    return Math.round(emotions.reduce((sum, val) => sum + val, 0) / emotions.length);
  }
  
  private calculateSegmentStability(segment: any): number {
    const emotions = Object.values(segment) as number[];
    const mean = emotions.reduce((sum, val) => sum + val, 0) / emotions.length;
    const variance = emotions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / emotions.length;
    
    return Math.round(100 - Math.sqrt(variance));
  }
  
  private generateEmotionalInsights(segment: any, index: number): string[] {
    const insights: string[] = [];
    const dominant = this.getDominantEmotion(segment);
    
    if (dominant === 'Joy' || dominant === 'Trust') {
      insights.push('Positive emotional state indicating comfort and confidence');
    }
    
    if (dominant === 'Fear' || dominant === 'Anxiety') {
      insights.push('Elevated stress levels may impact performance');
    }
    
    if (index === 0 && (dominant === 'Fear' || dominant === 'Anxiety')) {
      insights.push('Initial nervousness is normal and often improves throughout interview');
    }
    
    return insights;
  }
  
  private generateEmotionalRecommendations(segment: any): string[] {
    const recommendations: string[] = [];
    const dominant = this.getDominantEmotion(segment);
    
    if (dominant === 'Fear' || dominant === 'Anxiety') {
      recommendations.push('Practice relaxation techniques before interviews');
      recommendations.push('Prepare thoroughly to build confidence');
    }
    
    if (dominant === 'Sadness') {
      recommendations.push('Focus on positive experiences and achievements');
    }
    
    if (dominant === 'Anger') {
      recommendations.push('Work on emotional regulation and stress management');
    }
    
    return recommendations;
  }
  
  private getResponseQualityDescription(response: string, question: string): string {
    const quality = this.assessResponseQuality(response, question);
    
    if (quality >= 80) return 'Excellent - comprehensive and well-structured';
    if (quality >= 65) return 'Good - clear and relevant with room for enhancement';
    if (quality >= 50) return 'Satisfactory - addresses question but could be more detailed';
    return 'Needs improvement - consider expanding with examples and structure';
  }
  
  private createDevelopmentPlan(improvements: string[], audience: string): any[] {
    const plan = improvements.slice(0, 5).map((improvement, index) => ({
      priority: index + 1,
      area: improvement,
      timeframe: index < 2 ? '1-2 weeks' : index < 4 ? '1-2 months' : '3-6 months',
      actions: this.generateActionItems(improvement),
      resources: this.suggestResourcesForImprovement(improvement)
    }));
    
    return plan;
  }
  
  private generateActionItems(improvement: string): string[] {
    const actions: string[] = [];
    
    if (improvement.toLowerCase().includes('communication')) {
      actions.push('Practice speaking clearly and concisely');
      actions.push('Record yourself answering practice questions');
      actions.push('Join a public speaking group');
    } else if (improvement.toLowerCase().includes('technical')) {
      actions.push('Study relevant technical concepts');
      actions.push('Complete coding challenges');
      actions.push('Build practical projects');
    } else if (improvement.toLowerCase().includes('confidence')) {
      actions.push('Practice mock interviews');
      actions.push('Prepare success stories');
      actions.push('Work on positive self-talk');
    } else {
      actions.push('Identify specific areas for improvement');
      actions.push('Create a practice schedule');
      actions.push('Seek feedback from mentors');
    }
    
    return actions;
  }
  
  private suggestResourcesForImprovement(improvement: string): string[] {
    const resources: string[] = [];
    
    if (improvement.toLowerCase().includes('communication')) {
      resources.push('Toastmasters International');
      resources.push('Public speaking courses on Coursera');
      resources.push('Communication skills books');
    } else if (improvement.toLowerCase().includes('technical')) {
      resources.push('LeetCode for coding practice');
      resources.push('System design courses');
      resources.push('Technical documentation and tutorials');
    } else if (improvement.toLowerCase().includes('confidence')) {
      resources.push('Interview preparation books');
      resources.push('Mock interview platforms');
      resources.push('Career coaching services');
    }
    
    return resources;
  }
  
  private generatePracticeRecommendations(improvements: string[], emotionAnalysis: any): string[] {
    const recommendations: string[] = [];
    
    if (emotionAnalysis.stress.overallStress > 60) {
      recommendations.push('Practice stress management techniques like deep breathing');
      recommendations.push('Conduct mock interviews in low-pressure environments');
    }
    
    if (emotionAnalysis.communication.fluency < 60) {
      recommendations.push('Practice speaking aloud daily to improve fluency');
      recommendations.push('Record and review your responses to identify areas for improvement');
    }
    
    improvements.forEach(improvement => {
      if (improvement.toLowerCase().includes('example')) {
        recommendations.push('Prepare 5-10 detailed examples from your experience using the STAR method');
      }
    });
    
    return [...new Set(recommendations)];
  }
  
  private generateTimelineRecommendations(improvements: string[]): any {
    return {
      immediate: improvements.slice(0, 2),
      shortTerm: improvements.slice(2, 4),
      longTerm: improvements.slice(4)
    };
  }
  
  private generateMeasurableGoals(improvements: string[], emotionAnalysis: any): any[] {
    const goals: any[] = [];
    
    if (emotionAnalysis.communication.fluency < 70) {
      goals.push({
        goal: 'Improve speaking fluency',
        metric: 'Reduce filler words to less than 2 per minute',
        timeframe: '4 weeks'
      });
    }
    
    if (emotionAnalysis.stress.overallStress > 60) {
      goals.push({
        goal: 'Reduce interview stress',
        metric: 'Maintain stress level below 50 during practice interviews',
        timeframe: '6 weeks'
      });
    }
    
    improvements.forEach(improvement => {
      if (improvement.toLowerCase().includes('technical')) {
        goals.push({
          goal: 'Enhance technical knowledge',
          metric: 'Complete 20 technical practice questions with 80% accuracy',
          timeframe: '8 weeks'
        });
      }
    });
    
    return goals;
  }
  
  private generateMotivationalInsights(feedback: any, emotionAnalysis: any): string[] {
    const insights: string[] = [];
    
    if (feedback.strengths.length > feedback.improvements.length) {
      insights.push('You have more strengths than areas for improvement - build on what you do well!');
    }
    
    if (emotionAnalysis.overallWellbeing > 60) {
      insights.push('Your positive attitude and emotional stability are valuable assets');
    }
    
    if (emotionAnalysis.psychology.conscientiousness > 70) {
      insights.push('Your attention to detail and reliability will serve you well in your career');
    }
    
    insights.push('Every interview is a learning opportunity - use this feedback to grow stronger');
    
    return insights;
  }
  
  private generatePersonalizedTips(feedback: any, emotionAnalysis: any): string[] {
    const tips: string[] = [];
    
    if (emotionAnalysis.psychology.extraversion < 50) {
      tips.push('As an introvert, prepare talking points in advance to feel more confident');
    }
    
    if (emotionAnalysis.psychology.openness > 70) {
      tips.push('Your creativity and openness to new ideas are strengths - showcase them!');
    }
    
    if (emotionAnalysis.stress.overallStress > 60) {
      tips.push('Practice visualization techniques to imagine successful interview outcomes');
    }
    
    return tips;
  }
  
  private estimateInterviewDuration(transcript: any): number {
    // Estimate based on response lengths and number of questions
    const totalWords = transcript.questionResponses.reduce((sum: number, qr: any) => 
      sum + qr.response.split(' ').length, 0);
    
    // Assume 150 words per minute speaking rate + time for questions
    const responseTime = totalWords / 150;
    const questionTime = transcript.questionResponses.length * 0.5; // 30 seconds per question
    
    return Math.round(responseTime + questionTime);
  }
  
  private generateKeyObservations(qr: any, emotionAnalysis: any, confidenceAnalysis: any, index: number): string[] {
    const observations: string[] = [];
    
    const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
    const stressLevel = this.getStressLevelAtIndex(emotionAnalysis, index);
    const confidenceLevel = this.getConfidenceLevelAtIndex(confidenceAnalysis, index);
    
    if (confidenceLevel > 80) {
      observations.push('High confidence demonstrated');
    }
    
    if (stressLevel < 30) {
      observations.push('Excellent stress management');
    }
    
    if (qr.response.split(' ').length > 100) {
      observations.push('Comprehensive and detailed response');
    }
    
    if (emotionalState === 'Joy' || emotionalState === 'Trust') {
      observations.push('Positive emotional engagement');
    }
    
    return observations;
  }
  
  private identifyTurningPoints(qr: any, emotionAnalysis: any, confidenceAnalysis: any, index: number): string[] {
    const turningPoints: string[] = [];
    
    if (index > 0) {
      const currentStress = this.getStressLevelAtIndex(emotionAnalysis, index);
      const previousStress = this.getStressLevelAtIndex(emotionAnalysis, index - 1);
      
      if (currentStress < previousStress - 20) {
        turningPoints.push('Significant stress reduction - breakthrough moment');
      }
      
      const currentConfidence = this.getConfidenceLevelAtIndex(confidenceAnalysis, index);
      const previousConfidence = this.getConfidenceLevelAtIndex(confidenceAnalysis, index - 1);
      
      if (currentConfidence > previousConfidence + 20) {
        turningPoints.push('Major confidence boost - found their stride');
      }
    }
    
    return turningPoints;
  }
  
  private identifyInterviewPhases(timeline: any[]): any[] {
    const phases = [];
    const third = Math.floor(timeline.length / 3);
    
    phases.push({
      phase: 'Opening Phase',
      questions: timeline.slice(0, third),
      characteristics: 'Initial rapport building and basic questions'
    });
    
    phases.push({
      phase: 'Core Phase',
      questions: timeline.slice(third, third * 2),
      characteristics: 'Main technical and behavioral assessment'
    });
    
    phases.push({
      phase: 'Closing Phase',
      questions: timeline.slice(third * 2),
      characteristics: 'Final evaluation and wrap-up questions'
    });
    
    return phases;
  }
  
  private identifyCriticalMoments(timeline: any[]): any[] {
    return timeline.filter(point => 
      point.turningPoints.length > 0 || 
      point.confidenceLevel > 85 || 
      point.stressLevel < 25
    );
  }
  
  private analyzeProgression(timeline: any[]): any {
    const confidenceTrend = this.calculateTrend(timeline.map(t => t.confidenceLevel));
    const stressTrend = this.calculateTrend(timeline.map(t => t.stressLevel));
    const qualityTrend = this.calculateTrend(timeline.map(t => t.responseQuality));
    
    return {
      confidenceTrend,
      stressTrend,
      qualityTrend,
      overallProgression: this.determineOverallProgression(confidenceTrend, stressTrend, qualityTrend)
    };
  }
  
  private calculateTrend(values: number[]): string {
    if (values.length < 2) return 'stable';
    
    const first = values.slice(0, Math.floor(values.length / 3)).reduce((a, b) => a + b) / Math.floor(values.length / 3);
    const last = values.slice(-Math.floor(values.length / 3)).reduce((a, b) => a + b) / Math.floor(values.length / 3);
    
    const difference = last - first;
    
    if (difference > 10) return 'increasing';
    if (difference < -10) return 'decreasing';
    return 'stable';
  }
  
  private determineOverallProgression(confidenceTrend: string, stressTrend: string, qualityTrend: string): string {
    if (confidenceTrend === 'increasing' && stressTrend === 'decreasing') {
      return 'Excellent progression - growing confidence and reducing stress';
    }
    
    if (qualityTrend === 'increasing') {
      return 'Positive progression - improving response quality';
    }
    
    if (confidenceTrend === 'decreasing' || stressTrend === 'increasing') {
      return 'Challenging progression - may need additional support';
    }
    
    return 'Stable progression - consistent performance throughout';
  }
  
  private analyzePerformanceTrends(timeline: any[]): any {
    return {
      averageConfidence: Math.round(timeline.reduce((sum, t) => sum + t.confidenceLevel, 0) / timeline.length),
      averageStress: Math.round(timeline.reduce((sum, t) => sum + t.stressLevel, 0) / timeline.length),
      averageQuality: Math.round(timeline.reduce((sum, t) => sum + t.responseQuality, 0) / timeline.length),
      peakPerformance: Math.max(...timeline.map(t => t.responseQuality)),
      lowestStress: Math.min(...timeline.map(t => t.stressLevel)),
      highestConfidence: Math.max(...timeline.map(t => t.confidenceLevel))
    };
  }
  
  private suggestMentorshipOpportunities(improvements: string[]): string[] {
    return [
      'Seek mentorship through professional associations',
      'Connect with senior professionals on LinkedIn',
      'Join formal mentorship programs at educational institutions',
      'Participate in industry mentorship initiatives',
      'Consider reverse mentoring opportunities'
    ];
  }
  // Additional helper methods for comprehensive analysis
  private identifyEmotionalTrends(emotionalJourney: any[]): string {
    if (!emotionalJourney || emotionalJourney.length < 2) return 'Insufficient data';
    
    const firstThird = emotionalJourney.slice(0, Math.floor(emotionalJourney.length / 3));
    const lastThird = emotionalJourney.slice(-Math.floor(emotionalJourney.length / 3));
    
    const firstAvg = this.calculateAverageEmotionalIntensity(firstThird);
    const lastAvg = this.calculateAverageEmotionalIntensity(lastThird);
    
    if (lastAvg > firstAvg + 10) return 'Improving emotional state throughout interview';
    if (lastAvg < firstAvg - 10) return 'Declining emotional state during interview';
    return 'Stable emotional state maintained';
  }
  
  private identifyStabilityPatterns(emotionalJourney: any[]): string {
    if (!emotionalJourney || emotionalJourney.length < 2) return 'Insufficient data';
    
    const stabilities = emotionalJourney.map(segment => this.calculateSegmentStability(segment));
    const avgStability = stabilities.reduce((sum, s) => sum + s, 0) / stabilities.length;
    
    if (avgStability > 80) return 'Highly stable emotional patterns';
    if (avgStability > 60) return 'Generally stable with some variation';
    return 'Variable emotional patterns requiring attention';
  }
  
  private identifyRecoveryPatterns(emotionalJourney: any[]): string {
    if (!emotionalJourney || emotionalJourney.length < 3) return 'Insufficient data';
    
    let recoveries = 0;
    for (let i = 2; i < emotionalJourney.length; i++) {
      const current = this.calculateEmotionalIntensity(emotionalJourney[i]);
      const previous = this.calculateEmotionalIntensity(emotionalJourney[i-1]);
      const beforePrevious = this.calculateEmotionalIntensity(emotionalJourney[i-2]);
      
      if (previous < beforePrevious && current > previous) {
        recoveries++;
      }
    }
    
    if (recoveries > emotionalJourney.length * 0.3) return 'Excellent emotional recovery ability';
    if (recoveries > 0) return 'Good emotional recovery demonstrated';
    return 'Limited emotional recovery observed';
  }
  
  private identifyEmotionalPeaks(emotionalJourney: any[]): any[] {
    if (!emotionalJourney) return [];
    
    return emotionalJourney
      .map((segment, index) => ({
        index,
        intensity: this.calculateEmotionalIntensity(segment),
        dominantEmotion: this.getDominantEmotion(segment)
      }))
      .filter(item => item.intensity > 70)
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 3);
  }
  
  private identifyEmotionalLows(emotionalJourney: any[]): any[] {
    if (!emotionalJourney) return [];
    
    return emotionalJourney
      .map((segment, index) => ({
        index,
        intensity: this.calculateEmotionalIntensity(segment),
        dominantEmotion: this.getDominantEmotion(segment)
      }))
      .filter(item => item.intensity < 30)
      .sort((a, b) => a.intensity - b.intensity)
      .slice(0, 3);
  }
  
  private calculateAverageEmotionalIntensity(segments: any[]): number {
    if (!segments || segments.length === 0) return 0;
    
    const intensities = segments.map(segment => this.calculateEmotionalIntensity(segment));
    return intensities.reduce((sum, intensity) => sum + intensity, 0) / intensities.length;
  }
  
  private categorizeStressLevel(level: number): string {
    if (level < 30) return 'Low stress - excellent composure';
    if (level < 50) return 'Moderate stress - manageable levels';
    if (level < 70) return 'Elevated stress - some impact on performance';
    return 'High stress - significant impact likely';
  }
  
  private identifyStressIndicatorsAtSegment(emotionAnalysis: any, index: number): string[] {
    const indicators: string[] = [];
    const stress = emotionAnalysis.stress;
    
    if (stress.hesitation > 60) indicators.push('Hesitation in responses');
    if (stress.anxiety > 60) indicators.push('Elevated anxiety levels');
    if (stress.overwhelm > 60) indicators.push('Signs of feeling overwhelmed');
    if (stress.fillerWords > 5) indicators.push('Increased use of filler words');
    
    return indicators;
  }
  
  private assessStressImpact(level: number, index: number): string {
    if (level < 30) return 'Minimal impact on performance';
    if (level < 50) return 'Slight impact, performance maintained';
    if (level < 70) return 'Moderate impact on response quality';
    return 'Significant impact on performance and clarity';
  }
  
  private identifyStressTriggers(stressProgression: number[]): string {
    if (!stressProgression || stressProgression.length < 2) return 'Unable to identify triggers';
    
    let maxIncrease = 0;
    let triggerPoint = -1;
    
    for (let i = 1; i < stressProgression.length; i++) {
      const increase = stressProgression[i] - stressProgression[i-1];
      if (increase > maxIncrease) {
        maxIncrease = increase;
        triggerPoint = i;
      }
    }
    
    if (maxIncrease > 20) {
      return `Significant stress spike at question ${triggerPoint + 1}`;
    }
    
    return 'No major stress triggers identified';
  }
  
  private identifyStressRecovery(stressProgression: number[]): string {
    if (!stressProgression || stressProgression.length < 2) return 'Unable to assess recovery';
    
    let maxDecrease = 0;
    let recoveryPoint = -1;
    
    for (let i = 1; i < stressProgression.length; i++) {
      const decrease = stressProgression[i-1] - stressProgression[i];
      if (decrease > maxDecrease) {
        maxDecrease = decrease;
        recoveryPoint = i;
      }
    }
    
    if (maxDecrease > 20) {
      return `Strong stress recovery at question ${recoveryPoint + 1}`;
    }
    
    return 'Gradual stress management throughout interview';
  }
  
  private identifyPeakStress(stressProgression: number[]): string {
    if (!stressProgression || stressProgression.length === 0) return 'No stress data available';
    
    const maxStress = Math.max(...stressProgression);
    const maxIndex = stressProgression.indexOf(maxStress);
    
    return `Peak stress level of ${maxStress}/100 at question ${maxIndex + 1}`;
  }
  
  private assessStressResilience(stressProgression: number[]): string {
    if (!stressProgression || stressProgression.length < 2) return 'Unable to assess resilience';
    
    const avgStress = stressProgression.reduce((sum, level) => sum + level, 0) / stressProgression.length;
    const maxStress = Math.max(...stressProgression);
    const finalStress = stressProgression[stressProgression.length - 1];
    
    if (avgStress < 40 && maxStress < 60) return 'Excellent stress resilience';
    if (finalStress < avgStress) return 'Good stress recovery by end of interview';
    if (avgStress < 60) return 'Moderate stress resilience';
    return 'Limited stress resilience - needs development';
  }
  
  private assessStressManagement(stress: any): string {
    const overallStress = stress.overallStress;
    const management = stress.stressManagement || [];
    
    if (overallStress < 30) return 'Excellent natural stress management';
    if (overallStress < 50 && management.length > 0) return 'Good stress management with effective strategies';
    if (overallStress < 70) return 'Moderate stress management - room for improvement';
    return 'Stress management needs significant development';
  }
  
  private analyzeCommunicationPattern(score: number, type: string): string {
    const level = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Satisfactory' : 'Needs Improvement';
    
    switch (type) {
      case 'articulation':
        return `${level} - ${score >= 80 ? 'Very clear and precise expression' : score >= 65 ? 'Generally clear communication' : score >= 50 ? 'Adequate clarity with some unclear moments' : 'Frequent unclear or confusing expressions'}`;
      case 'fluency':
        return `${level} - ${score >= 80 ? 'Smooth, natural speech flow' : score >= 65 ? 'Generally fluent with minor hesitations' : score >= 50 ? 'Some hesitation and filler words' : 'Frequent hesitations and disrupted flow'}`;
      case 'professionalism':
        return `${level} - ${score >= 80 ? 'Highly professional demeanor and language' : score >= 65 ? 'Professional with appropriate tone' : score >= 50 ? 'Generally professional with minor lapses' : 'Unprofessional language or demeanor'}`;
      case 'engagement':
        return `${level} - ${score >= 80 ? 'Highly engaged and enthusiastic' : score >= 65 ? 'Good engagement throughout' : score >= 50 ? 'Moderate engagement with some disinterest' : 'Low engagement and enthusiasm'}`;
      case 'confidence':
        return `${level} - ${score >= 80 ? 'Very confident and self-assured' : score >= 65 ? 'Generally confident presentation' : score >= 50 ? 'Some confidence with occasional uncertainty' : 'Lacks confidence and self-assurance'}`;
      default:
        return `${level} communication pattern`;
    }
  }
  
  private findArticulationExamples(transcript: any): string[] {
    // This would analyze the transcript for articulation examples
    return ['Clear explanation of technical concepts', 'Well-structured responses', 'Precise use of terminology'];
  }
  
  private findFluencyExamples(transcript: any): string[] {
    return ['Smooth transitions between ideas', 'Natural speech rhythm', 'Minimal use of filler words'];
  }
  
  private findProfessionalismExamples(transcript: any): string[] {
    return ['Appropriate business language', 'Respectful tone throughout', 'Professional demeanor maintained'];
  }
  
  private findEngagementExamples(transcript: any): string[] {
    return ['Enthusiastic responses', 'Active participation', 'Detailed explanations showing interest'];
  }
  
  private findConfidenceExamples(transcript: any): string[] {
    return ['Assertive statements', 'Clear position taking', 'Confident in expertise areas'];
  }
  
  private identifyCommunicationTrends(communication: any): string {
    const scores = [
      communication.articulation,
      communication.fluency,
      communication.professionalism,
      communication.engagement,
      communication.confidence
    ];
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (avgScore >= 80) return 'Consistently excellent communication throughout';
    if (avgScore >= 65) return 'Generally strong communication with minor variations';
    if (avgScore >= 50) return 'Moderate communication effectiveness with room for improvement';
    return 'Communication skills need significant development';
  }
  
  private assessOverallInteractionQuality(transcript: any, emotionAnalysis: any): number {
    const engagement = emotionAnalysis.communication.engagement;
    const professionalism = emotionAnalysis.communication.professionalism;
    const emotionalStability = emotionAnalysis.emotionalStability;
    
    return Math.round((engagement + professionalism + emotionalStability) / 3);
  }
  
  private assessRapportLevel(emotionAnalysis: any): number {
    const trust = emotionAnalysis.emotions.trust || 50;
    const joy = emotionAnalysis.emotions.joy || 50;
    const engagement = emotionAnalysis.communication.engagement;
    
    return Math.round((trust + joy + engagement) / 3);
  }
  
  private assessRapportDevelopment(transcript: any, emotionAnalysis: any): string {
    const initialRapport = this.assessRapport('Neutral', emotionAnalysis.stress.overallStress);
    const finalRapport = this.assessRapport(
      this.getEmotionalStateAtIndex(emotionAnalysis, transcript.questionResponses.length - 1),
      this.getStressLevelAtIndex(emotionAnalysis, transcript.questionResponses.length - 1)
    );
    
    if (finalRapport > initialRapport + 20) return 'Excellent rapport development throughout interview';
    if (finalRapport > initialRapport) return 'Positive rapport development';
    if (finalRapport < initialRapport - 10) return 'Rapport declined during interview';
    return 'Stable rapport maintained';
  }
  
  private identifyRapportIndicators(transcript: any, emotionAnalysis: any): string[] {
    const indicators: string[] = [];
    
    if (emotionAnalysis.emotions.trust > 70) indicators.push('High trust levels demonstrated');
    if (emotionAnalysis.emotions.joy > 60) indicators.push('Positive emotional engagement');
    if (emotionAnalysis.communication.engagement > 75) indicators.push('Strong active participation');
    if (emotionAnalysis.stress.overallStress < 40) indicators.push('Comfortable and relaxed demeanor');
    
    return indicators;
  }
  
  private assessEngagementConsistency(transcript: any, emotionAnalysis: any): string {
    // Analyze engagement levels across different parts of the interview
    const engagementLevels = transcript.questionResponses.map((_: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      return this.assessEngagement(transcript.questionResponses[index].response, emotionalState);
    });
    
    const variance = this.calculateVariance(engagementLevels);
    
    if (variance < 100) return 'Highly consistent engagement throughout';
    if (variance < 300) return 'Generally consistent with minor variations';
    return 'Variable engagement levels - some questions more engaging than others';
  }
  
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
  
  private identifyEngagementPeaks(transcript: any, emotionAnalysis: any): any[] {
    const peaks: any[] = [];
    
    transcript.questionResponses.forEach((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const engagement = this.assessEngagement(qr.response, emotionalState);
      
      if (engagement > 80) {
        peaks.push({
          questionNumber: index + 1,
          question: qr.question.substring(0, 100) + '...',
          engagement: engagement,
          reason: this.identifyEngagementReason(qr.response, emotionalState)
        });
      }
    });
    
    return peaks;
  }
  
  private identifyEngagementDips(transcript: any, emotionAnalysis: any): any[] {
    const dips: any[] = [];
    
    transcript.questionResponses.forEach((qr: any, index: number) => {
      const emotionalState = this.getEmotionalStateAtIndex(emotionAnalysis, index);
      const engagement = this.assessEngagement(qr.response, emotionalState);
      
      if (engagement < 40) {
        dips.push({
          questionNumber: index + 1,
          question: qr.question.substring(0, 100) + '...',
          engagement: engagement,
          reason: this.identifyDisengagementReason(qr.response, emotionalState)
        });
      }
    });
    
    return dips;
  }
  
  private identifyEngagementReason(response: string, emotionalState: string): string {
    if (response.length > 150) return 'Detailed, comprehensive response';
    if (emotionalState === 'Joy' || emotionalState === 'Anticipation') return 'Positive emotional state';
    if (response.includes('excited') || response.includes('passionate')) return 'Expressed enthusiasm';
    return 'Strong interest in topic';
  }
  
  private identifyDisengagementReason(response: string, emotionalState: string): string {
    if (response.length < 50) return 'Brief, minimal response';
    if (emotionalState === 'Sadness' || emotionalState === 'Fear') return 'Negative emotional state';
    if (response.includes('I guess') || response.includes('maybe')) return 'Uncertain or hesitant response';
    return 'Low interest or energy';
  }
  
  private assessQuestionHandling(transcript: any): string {
    const responses = transcript.questionResponses;
    const avgLength = responses.reduce((sum: number, qr: any) => sum + qr.response.split(' ').length, 0) / responses.length;
    const relevantResponses = responses.filter((qr: any) => this.assessRelevance(qr.response, qr.question) > 70).length;
    const relevanceRatio = relevantResponses / responses.length;
    
    if (avgLength > 75 && relevanceRatio > 0.8) return 'Excellent question handling with comprehensive, relevant responses';
    if (avgLength > 50 && relevanceRatio > 0.7) return 'Good question handling with adequate detail and relevance';
    if (relevanceRatio > 0.6) return 'Satisfactory question handling with room for more detail';
    return 'Question handling needs improvement - responses lack detail or relevance';
  }
  
  private assessAdaptability(transcript: any, emotionAnalysis: any): string {
    // Analyze how well the candidate adapted to different question types and difficulty levels
    const questionTypes = transcript.questionResponses.map((qr: any) => this.categorizeQuestion(qr.question));
    const uniqueTypes = [...new Set(questionTypes)];
    
    if (uniqueTypes.length > 3) {
      const avgQuality = transcript.questionResponses.reduce((sum: number, qr: any) => 
        sum + this.assessResponseQuality(qr.response, qr.question), 0) / transcript.questionResponses.length;
      
      if (avgQuality > 75) return 'Excellent adaptability across different question types';
      if (avgQuality > 60) return 'Good adaptability with consistent performance';
      return 'Moderate adaptability - performance varies by question type';
    }
    
    return 'Limited variety in questions to assess adaptability';
  }
  
  private assessClarificationSeeking(transcript: any): string {
    const clarificationCount = transcript.questionResponses.filter((qr: any) => 
      qr.response.includes('clarify') || 
      qr.response.includes('understand correctly') || 
      qr.response.includes('you mean')
    ).length;
    
    if (clarificationCount > 0) return `Good - sought clarification ${clarificationCount} times when needed`;
    return 'No clarification sought - may indicate assumption-making or hesitation to ask';
  }
  
  private assessConversationNaturalness(transcript: any): string {
    const naturalIndicators = transcript.questionResponses.filter((qr: any) => 
      qr.response.includes('as I mentioned') || 
      qr.response.includes('building on') || 
      qr.response.includes('similarly')
    ).length;
    
    if (naturalIndicators > 2) return 'Very natural conversation flow with good connections';
    if (naturalIndicators > 0) return 'Some natural conversation elements present';
    return 'Somewhat formal - could benefit from more conversational flow';
  }
  
  private assessTransitions(transcript: any): string {
    const transitionWords = ['however', 'therefore', 'additionally', 'furthermore', 'in contrast', 'similarly'];
    const transitionCount = transcript.questionResponses.reduce((count: number, qr: any) => {
      return count + transitionWords.filter(word => qr.response.toLowerCase().includes(word)).length;
    }, 0);
    
    if (transitionCount > 5) return 'Excellent use of transitions for smooth flow';
    if (transitionCount > 2) return 'Good transitions between ideas';
    if (transitionCount > 0) return 'Some transitions used';
    return 'Limited transitions - responses could flow better';
  }
  
  private assessConversationMomentum(transcript: any, emotionAnalysis: any): string {
    const responseLengths = transcript.questionResponses.map((qr: any) => qr.response.split(' ').length);
    const avgLength = responseLengths.reduce((sum: number, len: number) => sum + len, 0) / responseLengths.length;
    const finalThirdAvg = responseLengths.slice(-Math.floor(responseLengths.length / 3))
      .reduce((sum: number, len: number) => sum + len, 0) / Math.floor(responseLengths.length / 3);
    
    if (finalThirdAvg > avgLength * 1.2) return 'Strong momentum - responses became more detailed and engaged';
    if (finalThirdAvg > avgLength * 0.8) return 'Maintained momentum throughout interview';
    return 'Momentum declined - later responses were shorter or less engaged';
  }
  
  private determineWorkStyle(psychology: any): string {
    const { openness, conscientiousness, extraversion, agreeableness } = psychology;
    
    if (conscientiousness > 70 && openness > 70) return 'Innovative and organized - balances creativity with structure';
    if (conscientiousness > 70) return 'Detail-oriented and systematic - prefers structured approaches';
    if (openness > 70) return 'Creative and flexible - enjoys exploring new ideas and methods';
    if (extraversion > 70 && agreeableness > 70) return 'Collaborative and outgoing - thrives in team environments';
    if (extraversion < 40) return 'Independent and focused - works well with minimal supervision';
    return 'Balanced work style - adaptable to various environments and approaches';
  }
  
  private identifyCopingMechanisms(stress: any): string[] {
    const mechanisms: string[] = [];
    
    if (stress.overallStress < 40) mechanisms.push('Natural stress resilience');
    if (stress.hesitation < 30) mechanisms.push('Confident decision-making under pressure');
    if (stress.anxiety < 40) mechanisms.push('Effective anxiety management');
    if (stress.fillerWords < 3) mechanisms.push('Maintains composure in speech');
    
    return mechanisms.length > 0 ? mechanisms : ['Stress management needs development'];
  }
  
  private assessRecoveryAbility(stressProgression: number[]): string {
    if (!stressProgression || stressProgression.length < 3) return 'Insufficient data';
    
    let recoveryInstances = 0;
    for (let i = 2; i < stressProgression.length; i++) {
      if (stressProgression[i-1] > stressProgression[i-2] && stressProgression[i] < stressProgression[i-1]) {
        recoveryInstances++;
      }
    }
    
    if (recoveryInstances > stressProgression.length * 0.3) return 'Excellent stress recovery ability';
    if (recoveryInstances > 0) return 'Good stress recovery demonstrated';
    return 'Limited stress recovery observed';
  }
  
  private assessQuestionAdaptation(emotionAnalysis: any): string {
    const communicationEffectiveness = emotionAnalysis.communicationEffectiveness;
    const emotionalStability = emotionAnalysis.emotionalStability;
    
    if (communicationEffectiveness > 75 && emotionalStability > 70) {
      return 'Excellent adaptation - maintained effectiveness across question types';
    }
    if (communicationEffectiveness > 60) {
      return 'Good adaptation with consistent communication quality';
    }
    return 'Moderate adaptation - effectiveness varied by question type';
  }
  
  private assessStressAdaptation(emotionAnalysis: any): string {
    const stressLevel = emotionAnalysis.stress.overallStress;
    const emotionalStability = emotionAnalysis.emotionalStability;
    
    if (stressLevel < 40 && emotionalStability > 70) {
      return 'Excellent stress adaptation - remained calm and composed';
    }
    if (stressLevel < 60) {
      return 'Good stress adaptation with manageable stress levels';
    }
    return 'Stress adaptation needs improvement - high stress impacted performance';
  }
  
  private assessEnvironmentalAdaptation(emotionAnalysis: any): string {
    const professionalism = emotionAnalysis.communication.professionalism;
    const engagement = emotionAnalysis.communication.engagement;
    
    if (professionalism > 75 && engagement > 70) {
      return 'Excellent environmental adaptation - professional and engaged';
    }
    if (professionalism > 60) {
      return 'Good environmental adaptation with appropriate professional behavior';
    }
    return 'Environmental adaptation needs improvement';
  }
  
  private analyzeResponseCategory(questionResponses: any[], category: string): any {
    const categoryResponses = questionResponses.filter(qr => 
      this.categorizeQuestion(qr.question).toLowerCase().includes(category)
    );
    
    if (categoryResponses.length === 0) {
      return { count: 0, avgScore: 0, analysis: `No ${category} questions asked` };
    }
    
    const avgScore = categoryResponses.reduce((sum, qr) => sum + qr.score, 0) / categoryResponses.length;
    const avgLength = categoryResponses.reduce((sum, qr) => sum + qr.response.length, 0) / categoryResponses.length;
    
    return {
      count: categoryResponses.length,
      avgScore: Math.round(avgScore),
      avgLength: Math.round(avgLength),
      analysis: this.getCategoryAnalysis(category, avgScore, avgLength)
    };
  }
  
  private getCategoryAnalysis(category: string, avgScore: number, avgLength: number): string {
    const scoreLevel = avgScore >= 80 ? 'Excellent' : avgScore >= 65 ? 'Good' : avgScore >= 50 ? 'Satisfactory' : 'Needs Improvement';
    const lengthLevel = avgLength > 500 ? 'Very detailed' : avgLength > 300 ? 'Detailed' : avgLength > 150 ? 'Adequate' : 'Brief';
    
    return `${scoreLevel} performance in ${category} questions with ${lengthLevel.toLowerCase()} responses`;
  }
  
  private calculateAverageClarity(questionResponses: any[]): number {
    const clarityScores = questionResponses.map(qr => this.assessResponseClarity(qr.response));
    return Math.round(clarityScores.reduce((sum, score) => sum + score, 0) / clarityScores.length);
  }
  
  private calculateAverageCompleteness(questionResponses: any[]): number {
    const completenessScores = questionResponses.map(qr => this.assessResponseCompleteness(qr.response, qr.question));
    return Math.round(completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length);
  }
  
  private calculateAverageRelevance(questionResponses: any[]): number {
    const relevanceScores = questionResponses.map(qr => this.assessRelevance(qr.response, qr.question));
    return Math.round(relevanceScores.reduce((sum, score) => sum + score, 0) / relevanceScores.length);
  }
  
  private calculateAverageSpecificity(questionResponses: any[]): number {
    const specificityScores = questionResponses.map(qr => this.assessSpecificity(qr.response));
    return Math.round(specificityScores.reduce((sum, score) => sum + score, 0) / specificityScores.length);
  }
  
  private calculateAverageStructure(questionResponses: any[]): number {
    const structureScores = questionResponses.map(qr => this.assessResponseStructure(qr.response));
    return Math.round(structureScores.reduce((sum, score) => sum + score, 0) / structureScores.length);
  }
  
  private identifyImprovementPatterns(questionResponses: any[]): string[] {
    const patterns: string[] = [];
    
    const lowScoreQuestions = questionResponses.filter(qr => qr.score < 60);
    if (lowScoreQuestions.length > questionResponses.length * 0.3) {
      patterns.push('Consistent pattern of lower scores - focus on overall preparation');
    }
    
    const briefResponses = questionResponses.filter(qr => qr.response.split(' ').length < 30);
    if (briefResponses.length > questionResponses.length * 0.4) {
      patterns.push('Tendency toward brief responses - practice providing more detail');
    }
    
    const technicalQuestions = questionResponses.filter(qr => this.isTechnicalQuestion(qr.question));
    const technicalAvg = technicalQuestions.reduce((sum, qr) => sum + qr.score, 0) / Math.max(1, technicalQuestions.length);
    if (technicalAvg < 60) {
      patterns.push('Technical questions scored lower - focus on technical preparation');
    }
    
    return patterns;
  }
  
  private identifyStrengthPatterns(questionResponses: any[]): string[] {
    const patterns: string[] = [];
    
    const highScoreQuestions = questionResponses.filter(qr => qr.score >= 80);
    if (highScoreQuestions.length > questionResponses.length * 0.3) {
      patterns.push('Strong pattern of high-quality responses');
    }
    
    const detailedResponses = questionResponses.filter(qr => qr.response.split(' ').length > 100);
    if (detailedResponses.length > questionResponses.length * 0.4) {
      patterns.push('Consistently provides detailed, comprehensive responses');
    }
    
    const behavioralQuestions = questionResponses.filter(qr => 
      this.categorizeQuestion(qr.question).toLowerCase().includes('behavioral')
    );
    const behavioralAvg = behavioralQuestions.reduce((sum, qr) => sum + qr.score, 0) / Math.max(1, behavioralQuestions.length);
    if (behavioralAvg >= 75) {
      patterns.push('Excellent performance on behavioral questions');
    }
    
    return patterns;
  }
  
  // Missing helper methods
  private assessPracticalRelevance(response: string): number {
    let relevance = 50;
    
    if (response.includes('real-world') || response.includes('production')) relevance += 20;
    if (response.includes('project') || response.includes('experience')) relevance += 15;
    if (response.includes('implementation') || response.includes('deployed')) relevance += 10;
    if (response.includes('business') || response.includes('client')) relevance += 10;
    
    return Math.min(100, relevance);
  }
  
  private identifyTechnicalImprovements(response: string, question: string): string[] {
    const improvements: string[] = [];
    
    if (this.extractTechnicalTerms(response).length < 2) {
      improvements.push('Use more specific technical terminology');
    }
    
    if (!response.includes('example') && this.isTechnicalQuestion(question)) {
      improvements.push('Provide concrete technical examples');
    }
    
    if (response.split(' ').length < 50 && this.isTechnicalQuestion(question)) {
      improvements.push('Expand technical explanations with more detail');
    }
    
    if (!response.includes('best practice') && !response.includes('standard')) {
      improvements.push('Reference industry best practices and standards');
    }
    
    return improvements;
  }
}