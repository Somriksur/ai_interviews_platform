/**
 * UPGRADED Resume NLP Parsing and Scoring Service
 * Context-aware extraction with proficiency detection and domain classification
 */

import { SemanticEmbeddingsService } from '../nlp/semantic-embeddings.service';

export interface SkillWithProficiency {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number; // 0-100
  context?: string; // Where it was mentioned
}

export interface ProjectWithComplexity {
  name: string;
  description: string;
  complexityScore: number; // 0-100
  technologies: string[];
  domain?: string;
}

export interface ResumeParseResult {
  skills: SkillWithProficiency[];
  skillsByDomain: Map<string, string[]>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  projects: ProjectWithComplexity[];
  experienceLevel: "fresher" | "junior" | "mid" | "senior";
  domain: string; // "Frontend", "Backend", "Fullstack", "AI/ML", "Data", etc.
  projectComplexityScore: number; // 0-100
  resumeScore: number;
  confidence: number; // 0-100
  explanation: {
    skillsReasoning: string;
    domainReasoning: string;
    scoreBreakdown: {
      skillsScore: number;
      projectsScore: number;
      experienceScore: number;
    };
  };
}

// Initialize semantic service
const semanticService = new SemanticEmbeddingsService();

// Proficiency indicators
const PROFICIENCY_INDICATORS = {
  expert: ['expert', 'mastered', 'extensive experience', 'deep knowledge', 'architect', 'lead', '5+ years', '6+ years', '7+ years'],
  advanced: ['advanced', 'proficient', 'strong', 'experienced', '3+ years', '4+ years', 'senior'],
  intermediate: ['intermediate', 'working knowledge', 'familiar', 'comfortable', '1-2 years', '2-3 years'],
  beginner: ['beginner', 'basic', 'learning', 'exposure', 'coursework', 'academic project']
};

// Complexity indicators for projects
const COMPLEXITY_INDICATORS = {
  high: ['scalable', 'distributed', 'microservices', 'production', 'deployed', 'users', 'architecture', 'optimized', 'real-time'],
  medium: ['full-stack', 'integrated', 'api', 'database', 'authentication', 'responsive', 'crud'],
  low: ['simple', 'basic', 'static', 'prototype', 'demo', 'tutorial']
};

// Comprehensive skill keywords database
const SKILL_KEYWORDS = {
  programming: [
    "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", 
    "rust", "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "shell", 
    "bash", "powershell", "dart", "elixir", "haskell", "lua", "objective-c"
  ],
  web: [
    "html", "css", "react", "angular", "vue", "node", "express", "django", 
    "flask", "spring", "asp.net", "laravel", "rails", "nextjs", "gatsby", 
    "svelte", "nuxt", "fastapi", "nestjs", "redux", "graphql", "rest api",
    "webpack", "vite", "tailwind", "bootstrap", "sass", "less"
  ],
  database: [
    "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", 
    "cassandra", "oracle", "sqlite", "dynamodb", "firebase", "firestore",
    "mariadb", "neo4j", "couchdb", "influxdb"
  ],
  cloud: [
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", 
    "gitlab", "github", "terraform", "ansible", "ci/cd", "devops", "heroku",
    "vercel", "netlify", "cloudflare", "digitalocean"
  ],
  ml: [
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "pandas", "numpy", "data analysis", "nlp", "computer vision", "ai",
    "keras", "opencv", "matplotlib", "seaborn", "jupyter", "neural networks"
  ],
  mobile: [
    "android", "ios", "react native", "flutter", "xamarin", "ionic",
    "swift", "kotlin", "java", "objective-c"
  ],
  tools: [
    "git", "github", "gitlab", "bitbucket", "jira", "confluence", "slack",
    "trello", "asana", "figma", "sketch", "adobe xd", "postman", "insomnia"
  ],
  methodologies: [
    "agile", "scrum", "kanban", "tdd", "bdd", "ci/cd", "microservices",
    "rest", "soap", "oop", "functional programming", "design patterns"
  ],
  testing: [
    "jest", "mocha", "chai", "pytest", "junit", "selenium", "cypress",
    "testing library", "unit testing", "integration testing", "e2e testing"
  ]
};

// Education keywords
const EDUCATION_KEYWORDS = {
  degrees: [
    "b.tech", "btech", "bachelor", "b.e", "be", "bsc", "b.sc", "ba", "b.a",
    "m.tech", "mtech", "master", "m.e", "me", "msc", "m.sc", "ma", "m.a",
    "phd", "ph.d", "doctorate", "mba", "bba", "bca", "mca"
  ],
  fields: [
    "computer science", "information technology", "software engineering",
    "electronics", "electrical", "mechanical", "civil", "chemical",
    "data science", "artificial intelligence", "cybersecurity"
  ]
};

// Project indicators
const PROJECT_INDICATORS = [
  "project", "developed", "built", "created", "designed", "implemented",
  "deployed", "launched", "published", "contributed", "collaborated"
];

// Experience indicators
const EXPERIENCE_INDICATORS = {
  fresher: ["fresher", "graduate", "student", "intern", "trainee"],
  junior: ["junior", "1 year", "2 year", "associate", "entry level"],
  mid: ["3 year", "4 year", "5 year", "mid level", "intermediate"],
  senior: ["senior", "lead", "principal", "architect", "6 year", "7 year", "8 year", "expert"]
};

/**
 * Extract skills with proficiency levels using context analysis
 */
function extractSkillsWithProficiency(text: string): SkillWithProficiency[] {
  const lowerText = text.toLowerCase();
  const sentences = text.split(/[.!?\n]+/);
  const skillsWithProficiency: SkillWithProficiency[] = [];
  const foundSkills = new Set<string>();

  // Extract skills with context
  Object.values(SKILL_KEYWORDS).flat().forEach(skill => {
    if (lowerText.includes(skill) && !foundSkills.has(skill)) {
      foundSkills.add(skill);
      
      // Find context sentence
      const contextSentence = sentences.find(s => 
        s.toLowerCase().includes(skill)
      ) || '';
      
      // Determine proficiency level
      const level = determineProficiencyLevel(contextSentence, skill);
      
      // Calculate confidence based on context richness
      const confidence = calculateSkillConfidence(contextSentence, skill);
      
      // Format skill name
      const formattedName = skill
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      skillsWithProficiency.push({
        name: formattedName,
        level,
        confidence,
        context: contextSentence.trim().substring(0, 100)
      });
    }
  });

  return skillsWithProficiency;
}

/**
 * Determine proficiency level from context
 */
function determineProficiencyLevel(context: string, skill: string): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  const lowerContext = context.toLowerCase();
  
  // Check for explicit proficiency indicators
  for (const [level, indicators] of Object.entries(PROFICIENCY_INDICATORS)) {
    if (indicators.some(indicator => lowerContext.includes(indicator))) {
      return level as 'beginner' | 'intermediate' | 'advanced' | 'expert';
    }
  }
  
  // Infer from context clues
  const hasProjectMention = /project|built|developed|created|implemented/.test(lowerContext);
  const hasProductionMention = /production|deployed|live|users/.test(lowerContext);
  const hasYearsExperience = /\d+\s*(year|yr)/.test(lowerContext);
  
  if (hasProductionMention || hasYearsExperience) {
    return 'advanced';
  } else if (hasProjectMention) {
    return 'intermediate';
  } else {
    return 'beginner';
  }
}

/**
 * Calculate confidence score for skill extraction
 */
function calculateSkillConfidence(context: string, skill: string): number {
  let confidence = 50; // Base confidence
  
  const lowerContext = context.toLowerCase();
  
  // Increase confidence if skill is mentioned with details
  if (context.length > 50) confidence += 20;
  if (/\d+/.test(context)) confidence += 10; // Has numbers (years, metrics)
  if (/project|experience|work/.test(lowerContext)) confidence += 15;
  if (lowerContext.split(skill).length > 2) confidence += 5; // Multiple mentions
  
  return Math.min(100, confidence);
}

/**
 * Extract skills from resume text
 */
function extractSkills(text: string): string[] {
  const lowerText = text.toLowerCase();
  const foundSkills = new Set<string>();

  // Check all skill categories
  Object.values(SKILL_KEYWORDS).flat().forEach(skill => {
    if (lowerText.includes(skill)) {
      // Capitalize properly
      const formatted = skill
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      foundSkills.add(formatted);
    }
  });

  return Array.from(foundSkills);
}

/**
 * Extract education information
 */
function extractEducation(text: string): Array<{ degree: string; institution: string; year?: string }> {
  const lowerText = text.toLowerCase();
  const education: Array<{ degree: string; institution: string; year?: string }> = [];

  // Find degree mentions
  EDUCATION_KEYWORDS.degrees.forEach(degree => {
    if (lowerText.includes(degree)) {
      // Try to find institution name (simplified)
      const degreeIndex = lowerText.indexOf(degree);
      const contextStart = Math.max(0, degreeIndex - 50);
      const contextEnd = Math.min(lowerText.length, degreeIndex + 100);
      const context = text.substring(contextStart, contextEnd);

      // Extract year if present (YYYY format)
      const yearMatch = context.match(/\b(19|20)\d{2}\b/);
      const year = yearMatch ? yearMatch[0] : undefined;

      // Try to find institution (look for "university", "college", "institute")
      const institutionMatch = context.match(/(university|college|institute|school)[^\n]*/i);
      const institution = institutionMatch ? institutionMatch[0].trim() : "Not specified";

      education.push({
        degree: degree.toUpperCase(),
        institution,
        year
      });
    }
  });

  return education.length > 0 ? education : [{ degree: "Not specified", institution: "Not specified" }];
}

/**
 * Extract projects with complexity scoring
 */
function extractProjectsWithComplexity(text: string): ProjectWithComplexity[] {
  const lowerText = text.toLowerCase();
  const projects: ProjectWithComplexity[] = [];
  const sentences = text.split(/[.!?\n]+/);

  // Find project sections
  const projectSections: string[] = [];
  let inProjectSection = false;
  let currentSection = '';

  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    
    if (PROJECT_INDICATORS.some(indicator => lowerSentence.includes(indicator))) {
      if (currentSection) {
        projectSections.push(currentSection);
      }
      currentSection = sentence;
      inProjectSection = true;
    } else if (inProjectSection && sentence.trim().length > 20) {
      currentSection += ' ' + sentence;
    } else if (sentence.trim().length < 10) {
      if (currentSection) {
        projectSections.push(currentSection);
        currentSection = '';
      }
      inProjectSection = false;
    }
  });

  if (currentSection) {
    projectSections.push(currentSection);
  }

  // Process each project section
  projectSections.forEach((section, index) => {
    const technologies = extractTechnologiesFromText(section);
    const complexityScore = calculateProjectComplexity(section);
    const domain = inferProjectDomain(technologies);
    
    // Extract project name (first few words or use generic name)
    const words = section.trim().split(/\s+/);
    const projectName = words.slice(0, 5).join(' ').replace(/[^\w\s]/g, '') || `Project ${index + 1}`;
    
    projects.push({
      name: projectName.substring(0, 50),
      description: section.substring(0, 200),
      complexityScore,
      technologies,
      domain
    });
  });

  // If no projects found, estimate from indicators
  if (projects.length === 0) {
    let projectCount = 0;
    PROJECT_INDICATORS.forEach(indicator => {
      const regex = new RegExp(indicator, 'gi');
      const matches = text.match(regex);
      if (matches) {
        projectCount += matches.length;
      }
    });

    const estimatedProjects = Math.min(Math.floor(projectCount / 2), 5);
    for (let i = 0; i < estimatedProjects; i++) {
      projects.push({
        name: `Project ${i + 1}`,
        description: "Extracted from resume",
        complexityScore: 50,
        technologies: [],
        domain: 'General'
      });
    }
  }

  return projects;
}

/**
 * Calculate project complexity score
 */
function calculateProjectComplexity(projectText: string): number {
  const lowerText = projectText.toLowerCase();
  let complexityScore = 30; // Base score

  // Check complexity indicators
  COMPLEXITY_INDICATORS.high.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      complexityScore += 10;
    }
  });

  COMPLEXITY_INDICATORS.medium.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      complexityScore += 5;
    }
  });

  COMPLEXITY_INDICATORS.low.forEach(indicator => {
    if (lowerText.includes(indicator)) {
      complexityScore -= 5;
    }
  });

  // Bonus for metrics and numbers
  const hasMetrics = /\d+\s*(users|requests|data|performance|speed|time)/.test(lowerText);
  if (hasMetrics) complexityScore += 15;

  // Bonus for team collaboration
  if (/team|collaborate|lead/.test(lowerText)) complexityScore += 10;

  return Math.max(0, Math.min(100, complexityScore));
}

/**
 * Extract technologies from project text
 */
function extractTechnologiesFromText(text: string): string[] {
  const technologies: string[] = [];
  const lowerText = text.toLowerCase();

  Object.values(SKILL_KEYWORDS).flat().forEach(skill => {
    if (lowerText.includes(skill)) {
      const formatted = skill
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      technologies.push(formatted);
    }
  });

  return [...new Set(technologies)].slice(0, 10); // Limit to 10 technologies
}

/**
 * Infer project domain from technologies
 */
function inferProjectDomain(technologies: string[]): string {
  const lowerTechs = technologies.map(t => t.toLowerCase()).join(' ');

  if (/react|angular|vue|frontend|html|css/.test(lowerTechs)) return 'Frontend';
  if (/node|express|django|flask|backend|api/.test(lowerTechs)) return 'Backend';
  if (/machine learning|tensorflow|pytorch|ai|ml|nlp/.test(lowerTechs)) return 'AI/ML';
  if (/data|analytics|pandas|numpy|visualization/.test(lowerTechs)) return 'Data Science';
  if (/android|ios|mobile|flutter|react native/.test(lowerTechs)) return 'Mobile';
  if (/cloud|aws|azure|docker|kubernetes/.test(lowerTechs)) return 'Cloud/DevOps';

  return 'General';
}

/**
 * Extract projects from resume
 */
function extractProjects(text: string): Array<{ name: string; description: string }> {
  const lowerText = text.toLowerCase();
  const projects: Array<{ name: string; description: string }> = [];

  // Count project indicators
  let projectCount = 0;
  PROJECT_INDICATORS.forEach(indicator => {
    const regex = new RegExp(indicator, 'gi');
    const matches = text.match(regex);
    if (matches) {
      projectCount += matches.length;
    }
  });

  // Create placeholder projects based on indicators found
  const estimatedProjects = Math.min(Math.floor(projectCount / 2), 10);
  for (let i = 0; i < estimatedProjects; i++) {
    projects.push({
      name: `Project ${i + 1}`,
      description: "Extracted from resume"
    });
  }

  return projects;
}

/**
 * Determine experience level
 */
function determineExperienceLevel(text: string): "fresher" | "junior" | "mid" | "senior" {
  const lowerText = text.toLowerCase();

  // Check for experience indicators
  for (const [level, indicators] of Object.entries(EXPERIENCE_INDICATORS)) {
    for (const indicator of indicators) {
      if (lowerText.includes(indicator)) {
        return level as "fresher" | "junior" | "mid" | "senior";
      }
    }
  }

  // Default to fresher if no indicators found
  return "fresher";
}

/**
 * Calculate resume score (0-100)
 * Formula: (skills * 5) + (projects * 10) + (experience weight)
 */
function calculateResumeScore(
  skillsCount: number,
  projectsCount: number,
  experienceLevel: string
): number {
  const experienceWeights = {
    fresher: 10,
    junior: 20,
    mid: 30,
    senior: 40
  };

  const skillScore = Math.min(skillsCount * 5, 40); // Max 40 points for skills
  const projectScore = Math.min(projectsCount * 10, 30); // Max 30 points for projects
  const experienceScore = experienceWeights[experienceLevel as keyof typeof experienceWeights] || 10;

  const totalScore = skillScore + projectScore + experienceScore;
  
  // Normalize to 0-100 scale
  return Math.min(Math.round(totalScore), 100);
}

/**
 * Classify resume domain based on skills and projects
 */
function classifyDomain(skills: SkillWithProficiency[], projects: ProjectWithComplexity[]): string {
  const skillNames = skills.map(s => s.name.toLowerCase()).join(' ');
  const projectDomains = projects.map(p => p.domain || '');

  // Count domain occurrences
  const domainCounts = new Map<string, number>();

  // From projects
  projectDomains.forEach(domain => {
    if (domain) {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 2); // Projects weighted more
    }
  });

  // From skills
  const domainKeywords = {
    'Frontend': ['react', 'angular', 'vue', 'html', 'css', 'javascript', 'frontend'],
    'Backend': ['node', 'express', 'django', 'flask', 'spring', 'backend', 'api', 'server'],
    'AI/ML': ['machine learning', 'tensorflow', 'pytorch', 'ai', 'ml', 'nlp', 'deep learning'],
    'Data Science': ['data', 'analytics', 'pandas', 'numpy', 'visualization', 'statistics'],
    'Mobile': ['android', 'ios', 'mobile', 'flutter', 'react native', 'swift', 'kotlin'],
    'Cloud/DevOps': ['aws', 'azure', 'docker', 'kubernetes', 'devops', 'cloud', 'terraform'],
    'Fullstack': ['fullstack', 'full-stack', 'full stack']
  };

  Object.entries(domainKeywords).forEach(([domain, keywords]) => {
    const matchCount = keywords.filter(keyword => skillNames.includes(keyword)).length;
    if (matchCount > 0) {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + matchCount);
    }
  });

  // Check for fullstack (both frontend and backend)
  const hasFrontend = domainCounts.get('Frontend') || 0;
  const hasBackend = domainCounts.get('Backend') || 0;
  if (hasFrontend > 0 && hasBackend > 0) {
    return 'Fullstack';
  }

  // Find dominant domain
  let maxCount = 0;
  let dominantDomain = 'General';

  domainCounts.forEach((count, domain) => {
    if (count > maxCount) {
      maxCount = count;
      dominantDomain = domain;
    }
  });

  return dominantDomain;
}

/**
 * Calculate overall project complexity score
 */
function calculateOverallProjectComplexity(projects: ProjectWithComplexity[]): number {
  if (projects.length === 0) return 0;

  const totalComplexity = projects.reduce((sum, p) => sum + p.complexityScore, 0);
  const avgComplexity = totalComplexity / projects.length;

  // Bonus for having multiple complex projects
  const complexProjects = projects.filter(p => p.complexityScore >= 70).length;
  const bonus = complexProjects * 5;

  return Math.min(100, Math.round(avgComplexity + bonus));
}

/**
 * Generate explanation for resume scoring
 */
function generateExplanation(
  skills: SkillWithProficiency[],
  projects: ProjectWithComplexity[],
  domain: string,
  experienceLevel: string,
  scoreBreakdown: { skillsScore: number; projectsScore: number; experienceScore: number }
): {
  skillsReasoning: string;
  domainReasoning: string;
  scoreBreakdown: { skillsScore: number; projectsScore: number; experienceScore: number };
} {
  // Skills reasoning
  const advancedSkills = skills.filter(s => s.level === 'advanced' || s.level === 'expert').length;
  const totalSkills = skills.length;
  
  let skillsReasoning = `Found ${totalSkills} skills`;
  if (advancedSkills > 0) {
    skillsReasoning += ` with ${advancedSkills} at advanced/expert level`;
  }
  skillsReasoning += `. Score: ${scoreBreakdown.skillsScore}/40`;

  // Domain reasoning
  const domainSkills = skills.filter(s => {
    const lowerName = s.name.toLowerCase();
    return domain.toLowerCase().split('/').some(d => lowerName.includes(d.toLowerCase()));
  }).length;

  let domainReasoning = `Classified as ${domain} based on `;
  if (domainSkills > 0) {
    domainReasoning += `${domainSkills} domain-relevant skills`;
  }
  if (projects.length > 0) {
    domainReasoning += ` and ${projects.length} project(s)`;
  }

  return {
    skillsReasoning,
    domainReasoning,
    scoreBreakdown
  };
}

/**
 * Main function: Parse and score resume with advanced NLP
 */
export function parseAndScoreResume(text: string): ResumeParseResult {
  if (!text || text.trim().length === 0) {
    return {
      skills: [],
      skillsByDomain: new Map(),
      education: [],
      projects: [],
      experienceLevel: "fresher",
      domain: "General",
      projectComplexityScore: 0,
      resumeScore: 0,
      confidence: 0,
      explanation: {
        skillsReasoning: "No resume text provided",
        domainReasoning: "Unable to classify domain",
        scoreBreakdown: { skillsScore: 0, projectsScore: 0, experienceScore: 0 }
      }
    };
  }

  // Extract with proficiency
  const skills = extractSkillsWithProficiency(text);
  
  // Group skills by domain using semantic service
  const skillNames = skills.map(s => s.name);
  const skillsByDomain = semanticService.groupSimilarSkills(skillNames);
  
  // Extract education
  const education = extractEducation(text);
  
  // Extract projects with complexity
  const projects = extractProjectsWithComplexity(text);
  
  // Determine experience level
  const experienceLevel = determineExperienceLevel(text);
  
  // Classify domain
  const domain = classifyDomain(skills, projects);
  
  // Calculate project complexity
  const projectComplexityScore = calculateOverallProjectComplexity(projects);
  
  // Calculate resume score with breakdown
  const skillsScore = Math.min(skills.length * 4, 40); // Max 40 points
  const projectsScore = Math.min(projects.length * 6 + projectComplexityScore * 0.3, 30); // Max 30 points
  const experienceWeights = { fresher: 10, junior: 20, mid: 25, senior: 30 };
  const experienceScore = experienceWeights[experienceLevel];
  
  const resumeScore = Math.min(100, Math.round(skillsScore + projectsScore + experienceScore));
  
  // Calculate confidence
  const avgSkillConfidence = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.confidence, 0) / skills.length
    : 50;
  const textLengthFactor = Math.min(text.length / 1000, 1) * 20; // Up to 20 points for text length
  const confidence = Math.round(Math.min(100, avgSkillConfidence * 0.7 + textLengthFactor + 10));
  
  // Generate explanation
  const explanation = generateExplanation(skills, projects, domain, experienceLevel, {
    skillsScore: Math.round(skillsScore),
    projectsScore: Math.round(projectsScore),
    experienceScore
  });

  return {
    skills,
    skillsByDomain,
    education,
    projects,
    experienceLevel,
    domain,
    projectComplexityScore: Math.round(projectComplexityScore),
    resumeScore,
    confidence,
    explanation
  };
}

