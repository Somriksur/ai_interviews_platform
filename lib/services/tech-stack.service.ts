/**
 * Dynamic Tech Stack Service
 * Extracts and manages available tech stacks from the application
 */

export interface TechStack {
  id: string;
  name: string;
  category: string;
  icon: string;
  popularity: number; // 1-10 scale
  isFramework: boolean;
  relatedTechs: string[];
}

export interface JobRole {
  id: string;
  title: string;
  category: string;
  primaryTechs: string[];
  secondaryTechs: string[];
  experienceLevels: string[];
}

/**
 * Comprehensive tech stack database derived from your app
 */
export const TECH_STACKS: TechStack[] = [
  // Frontend Frameworks & Libraries
  { id: 'react', name: 'React', category: 'Frontend', icon: '⚛️', popularity: 10, isFramework: true, relatedTechs: ['javascript', 'typescript', 'jsx'] },
  { id: 'nextjs', name: 'Next.js', category: 'Frontend', icon: '▲', popularity: 9, isFramework: true, relatedTechs: ['react', 'typescript', 'vercel'] },
  { id: 'vue', name: 'Vue.js', category: 'Frontend', icon: '💚', popularity: 8, isFramework: true, relatedTechs: ['javascript', 'typescript'] },
  { id: 'angular', name: 'Angular', category: 'Frontend', icon: '🅰️', popularity: 8, isFramework: true, relatedTechs: ['typescript', 'rxjs'] },
  { id: 'svelte', name: 'Svelte', category: 'Frontend', icon: '🧡', popularity: 7, isFramework: true, relatedTechs: ['javascript', 'typescript'] },
  
  // Backend Frameworks
  { id: 'nodejs', name: 'Node.js', category: 'Backend', icon: '🟢', popularity: 10, isFramework: true, relatedTechs: ['javascript', 'typescript', 'npm'] },
  { id: 'express', name: 'Express.js', category: 'Backend', icon: '🚂', popularity: 9, isFramework: true, relatedTechs: ['nodejs', 'javascript'] },
  { id: 'nestjs', name: 'NestJS', category: 'Backend', icon: '🐱', popularity: 8, isFramework: true, relatedTechs: ['nodejs', 'typescript', 'decorators'] },
  { id: 'fastapi', name: 'FastAPI', category: 'Backend', icon: '⚡', popularity: 8, isFramework: true, relatedTechs: ['python', 'pydantic'] },
  { id: 'django', name: 'Django', category: 'Backend', icon: '🎸', popularity: 8, isFramework: true, relatedTechs: ['python', 'orm'] },
  { id: 'flask', name: 'Flask', category: 'Backend', icon: '🌶️', popularity: 7, isFramework: true, relatedTechs: ['python'] },
  { id: 'spring', name: 'Spring Boot', category: 'Backend', icon: '🍃', popularity: 9, isFramework: true, relatedTechs: ['java', 'maven'] },
  { id: 'dotnet', name: '.NET Core', category: 'Backend', icon: '🔷', popularity: 8, isFramework: true, relatedTechs: ['csharp', 'nuget'] },
  
  // Programming Languages
  { id: 'javascript', name: 'JavaScript', category: 'Language', icon: '🟨', popularity: 10, isFramework: false, relatedTechs: ['nodejs', 'react', 'vue'] },
  { id: 'typescript', name: 'TypeScript', category: 'Language', icon: '🔷', popularity: 9, isFramework: false, relatedTechs: ['javascript', 'react', 'angular'] },
  { id: 'python', name: 'Python', category: 'Language', icon: '🐍', popularity: 10, isFramework: false, relatedTechs: ['django', 'flask', 'fastapi'] },
  { id: 'java', name: 'Java', category: 'Language', icon: '☕', popularity: 9, isFramework: false, relatedTechs: ['spring', 'maven', 'gradle'] },
  { id: 'csharp', name: 'C#', category: 'Language', icon: '🔷', popularity: 8, isFramework: false, relatedTechs: ['dotnet', 'azure'] },
  { id: 'go', name: 'Go', category: 'Language', icon: '🐹', popularity: 8, isFramework: false, relatedTechs: ['docker', 'kubernetes'] },
  { id: 'rust', name: 'Rust', category: 'Language', icon: '🦀', popularity: 7, isFramework: false, relatedTechs: ['webassembly'] },
  { id: 'php', name: 'PHP', category: 'Language', icon: '🐘', popularity: 7, isFramework: false, relatedTechs: ['laravel', 'symfony'] },
  { id: 'ruby', name: 'Ruby', category: 'Language', icon: '💎', popularity: 6, isFramework: false, relatedTechs: ['rails'] },
  { id: 'swift', name: 'Swift', category: 'Language', icon: '🦅', popularity: 7, isFramework: false, relatedTechs: ['ios', 'xcode'] },
  { id: 'kotlin', name: 'Kotlin', category: 'Language', icon: '🟣', popularity: 7, isFramework: false, relatedTechs: ['android', 'java'] },
  { id: 'dart', name: 'Dart', category: 'Language', icon: '🎯', popularity: 6, isFramework: false, relatedTechs: ['flutter'] },
  
  // Databases
  { id: 'mongodb', name: 'MongoDB', category: 'Database', icon: '🍃', popularity: 9, isFramework: false, relatedTechs: ['nodejs', 'mongoose'] },
  { id: 'postgresql', name: 'PostgreSQL', category: 'Database', icon: '🐘', popularity: 9, isFramework: false, relatedTechs: ['sql', 'prisma'] },
  { id: 'mysql', name: 'MySQL', category: 'Database', icon: '🐬', popularity: 8, isFramework: false, relatedTechs: ['sql', 'php'] },
  { id: 'redis', name: 'Redis', category: 'Database', icon: '🔴', popularity: 8, isFramework: false, relatedTechs: ['caching', 'nodejs'] },
  { id: 'firebase', name: 'Firebase', category: 'Database', icon: '🔥', popularity: 8, isFramework: false, relatedTechs: ['nosql', 'realtime'] },
  { id: 'sqlite', name: 'SQLite', category: 'Database', icon: '💾', popularity: 7, isFramework: false, relatedTechs: ['sql', 'embedded'] },
  
  // Cloud & DevOps
  { id: 'aws', name: 'AWS', category: 'Cloud', icon: '☁️', popularity: 10, isFramework: false, relatedTechs: ['ec2', 's3', 'lambda'] },
  { id: 'azure', name: 'Azure', category: 'Cloud', icon: '🔷', popularity: 8, isFramework: false, relatedTechs: ['dotnet', 'csharp'] },
  { id: 'gcp', name: 'Google Cloud', category: 'Cloud', icon: '🌤️', popularity: 8, isFramework: false, relatedTechs: ['kubernetes', 'terraform'] },
  { id: 'docker', name: 'Docker', category: 'DevOps', icon: '🐳', popularity: 9, isFramework: false, relatedTechs: ['kubernetes', 'containers'] },
  { id: 'kubernetes', name: 'Kubernetes', category: 'DevOps', icon: '⚓', popularity: 8, isFramework: false, relatedTechs: ['docker', 'orchestration'] },
  { id: 'terraform', name: 'Terraform', category: 'DevOps', icon: '🏗️', popularity: 8, isFramework: false, relatedTechs: ['iac', 'aws'] },
  
  // Mobile Development
  { id: 'react-native', name: 'React Native', category: 'Mobile', icon: '📱', popularity: 8, isFramework: true, relatedTechs: ['react', 'javascript'] },
  { id: 'flutter', name: 'Flutter', category: 'Mobile', icon: '🦋', popularity: 8, isFramework: true, relatedTechs: ['dart', 'mobile'] },
  { id: 'ios', name: 'iOS Development', category: 'Mobile', icon: '📱', popularity: 7, isFramework: false, relatedTechs: ['swift', 'xcode'] },
  { id: 'android', name: 'Android Development', category: 'Mobile', icon: '🤖', popularity: 8, isFramework: false, relatedTechs: ['kotlin', 'java'] },
  
  // Testing & Tools
  { id: 'jest', name: 'Jest', category: 'Testing', icon: '🃏', popularity: 9, isFramework: true, relatedTechs: ['javascript', 'testing'] },
  { id: 'cypress', name: 'Cypress', category: 'Testing', icon: '🌲', popularity: 8, isFramework: true, relatedTechs: ['e2e', 'testing'] },
  { id: 'selenium', name: 'Selenium', category: 'Testing', icon: '🔍', popularity: 7, isFramework: true, relatedTechs: ['automation', 'testing'] },
  { id: 'git', name: 'Git', category: 'Tools', icon: '📚', popularity: 10, isFramework: false, relatedTechs: ['github', 'version-control'] },
  { id: 'webpack', name: 'Webpack', category: 'Tools', icon: '📦', popularity: 8, isFramework: false, relatedTechs: ['bundling', 'javascript'] },
  { id: 'vite', name: 'Vite', category: 'Tools', icon: '⚡', popularity: 8, isFramework: false, relatedTechs: ['bundling', 'vue'] },
  
  // Styling & UI
  { id: 'tailwindcss', name: 'Tailwind CSS', category: 'Styling', icon: '🎨', popularity: 9, isFramework: true, relatedTechs: ['css', 'utility-first'] },
  { id: 'bootstrap', name: 'Bootstrap', category: 'Styling', icon: '🅱️', popularity: 7, isFramework: true, relatedTechs: ['css', 'responsive'] },
  { id: 'sass', name: 'Sass/SCSS', category: 'Styling', icon: '🎨', popularity: 8, isFramework: false, relatedTechs: ['css', 'preprocessing'] },
  { id: 'css', name: 'CSS', category: 'Styling', icon: '🎨', popularity: 10, isFramework: false, relatedTechs: ['html', 'styling'] },
  { id: 'html', name: 'HTML', category: 'Markup', icon: '🌐', popularity: 10, isFramework: false, relatedTechs: ['css', 'javascript'] },
];

/**
 * Job roles with their typical tech stacks
 */
export const JOB_ROLES: JobRole[] = [
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'Development',
    primaryTechs: ['javascript', 'typescript', 'react', 'css', 'html'],
    secondaryTechs: ['nextjs', 'tailwindcss', 'webpack', 'git', 'jest'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    category: 'Development',
    primaryTechs: ['nodejs', 'python', 'java', 'express', 'mongodb'],
    secondaryTechs: ['postgresql', 'redis', 'docker', 'aws', 'git'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'fullstack-developer',
    title: 'Full Stack Developer',
    category: 'Development',
    primaryTechs: ['javascript', 'typescript', 'react', 'nodejs', 'mongodb'],
    secondaryTechs: ['nextjs', 'express', 'postgresql', 'docker', 'aws'],
    experienceLevels: ['Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    category: 'Infrastructure',
    primaryTechs: ['docker', 'kubernetes', 'aws', 'terraform', 'git'],
    secondaryTechs: ['python', 'bash', 'jenkins', 'monitoring', 'linux'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'mobile-developer',
    title: 'Mobile Developer',
    category: 'Development',
    primaryTechs: ['react-native', 'flutter', 'swift', 'kotlin'],
    secondaryTechs: ['javascript', 'dart', 'ios', 'android', 'firebase'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    category: 'Data',
    primaryTechs: ['python', 'sql', 'pandas', 'numpy', 'scikit-learn'],
    secondaryTechs: ['jupyter', 'tensorflow', 'pytorch', 'aws', 'docker'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'ml-engineer',
    title: 'ML Engineer',
    category: 'Data',
    primaryTechs: ['python', 'tensorflow', 'pytorch', 'docker', 'kubernetes'],
    secondaryTechs: ['aws', 'gcp', 'mlflow', 'airflow', 'sql'],
    experienceLevels: ['Mid-level', 'Senior', 'Lead']
  },
  {
    id: 'qa-engineer',
    title: 'QA Engineer',
    category: 'Testing',
    primaryTechs: ['selenium', 'cypress', 'jest', 'javascript', 'python'],
    secondaryTechs: ['postman', 'jira', 'git', 'docker', 'ci-cd'],
    experienceLevels: ['Junior', 'Mid-level', 'Senior', 'Lead']
  }
];

/**
 * Get tech stacks by category
 */
export function getTechStacksByCategory(): Record<string, TechStack[]> {
  const categories: Record<string, TechStack[]> = {};
  
  TECH_STACKS.forEach(tech => {
    if (!categories[tech.category]) {
      categories[tech.category] = [];
    }
    categories[tech.category].push(tech);
  });
  
  // Sort by popularity within each category
  Object.keys(categories).forEach(category => {
    categories[category].sort((a, b) => b.popularity - a.popularity);
  });
  
  return categories;
}

/**
 * Get tech stacks for a specific job role
 */
export function getTechStacksForRole(roleId: string): TechStack[] {
  const role = JOB_ROLES.find(r => r.id === roleId);
  if (!role) return [];
  
  const allTechIds = [...role.primaryTechs, ...role.secondaryTechs];
  return TECH_STACKS.filter(tech => allTechIds.includes(tech.id));
}

/**
 * Get random tech stacks for dynamic question generation
 */
export function getRandomTechStacks(count: number = 3, category?: string): TechStack[] {
  let availableTechs = TECH_STACKS;
  
  if (category) {
    availableTechs = TECH_STACKS.filter(tech => tech.category === category);
  }
  
  // Weighted random selection based on popularity
  const weightedTechs = availableTechs.flatMap(tech => 
    Array(tech.popularity).fill(tech)
  );
  
  const selected: TechStack[] = [];
  const usedIds = new Set<string>();
  
  while (selected.length < count && selected.length < availableTechs.length) {
    const randomTech = weightedTechs[Math.floor(Math.random() * weightedTechs.length)];
    if (!usedIds.has(randomTech.id)) {
      selected.push(randomTech);
      usedIds.add(randomTech.id);
    }
  }
  
  return selected;
}

/**
 * Get trending tech stacks (high popularity)
 */
export function getTrendingTechStacks(limit: number = 10): TechStack[] {
  return TECH_STACKS
    .filter(tech => tech.popularity >= 8)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}

/**
 * Search tech stacks by name or category
 */
export function searchTechStacks(query: string): TechStack[] {
  const lowerQuery = query.toLowerCase();
  return TECH_STACKS.filter(tech => 
    tech.name.toLowerCase().includes(lowerQuery) ||
    tech.category.toLowerCase().includes(lowerQuery) ||
    tech.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get complementary tech stacks for a given tech
 */
export function getComplementaryTechs(techId: string): TechStack[] {
  const tech = TECH_STACKS.find(t => t.id === techId);
  if (!tech) return [];
  
  const relatedIds = tech.relatedTechs;
  return TECH_STACKS.filter(t => relatedIds.includes(t.id));
}

/**
 * Generate dynamic tech stack combination for interviews
 */
export function generateDynamicTechStack(
  role?: string,
  level?: string,
  count: number = 5
): string[] {
  // If role is specified, get role-specific techs
  if (role) {
    const roleData = JOB_ROLES.find(r => 
      r.title.toLowerCase().includes(role.toLowerCase()) ||
      r.id.includes(role.toLowerCase())
    );
    
    if (roleData) {
      const roleTechs = getTechStacksForRole(roleData.id);
      
      // Adjust selection based on experience level
      let techCount = count;
      if (level) {
        const lowerLevel = level.toLowerCase();
        if (lowerLevel.includes('junior') || lowerLevel.includes('entry')) {
          techCount = Math.min(count, 3); // Fewer techs for juniors
        } else if (lowerLevel.includes('senior') || lowerLevel.includes('lead')) {
          techCount = Math.min(count, 8); // More techs for seniors
        }
      }
      
      const selected = roleTechs
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, techCount);
      return selected.map(tech => tech.name);
    }
  }
  
  // Otherwise, get trending/popular techs
  const selected = getRandomTechStacks(count);
  
  return selected.map(tech => tech.name);
}