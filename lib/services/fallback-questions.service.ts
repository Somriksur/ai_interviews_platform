/**
 * Fallback Questions Service
 * 
 * Provides intelligent question selection from 5270 training questions
 * when HuggingFace Space is unavailable
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface TrainingQuestion {
  instruction: string;
  output: string;
}

interface FallbackQuestionRequest {
  role: string;
  level: string;
  type: string;
  amount: number;
}

/**
 * Load and filter questions from training_data.jsonl
 */
export async function getFallbackQuestions(
  request: FallbackQuestionRequest
): Promise<string[]> {
  const { role, level, type, amount } = request;

  try {
    // Load training data
    const trainingData = await loadTrainingData();

    // Filter questions based on request
    const filteredQuestions = filterQuestions(trainingData, role, level, type);

    // Select the best questions
    const selectedQuestions = selectQuestions(filteredQuestions, amount);

    return selectedQuestions;
  } catch (error) {
    console.error('❌ Question generation failed:', error);
    // Return generic questions as last resort
    return generateGenericQuestions(role, level, amount);
  }
}

/**
 * Load training data from JSONL file
 */
async function loadTrainingData(): Promise<TrainingQuestion[]> {
  const filePath = path.join(process.cwd(), 'training_data.jsonl');
  const trainingData: TrainingQuestion[] = [];

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) {
      try {
        const item = JSON.parse(line);
        trainingData.push(item);
      } catch (e) {
        // Skip invalid lines
        continue;
      }
    }
  }

  return trainingData;
}

/**
 * Filter questions based on role, level, and type
 */
function filterQuestions(
  trainingData: TrainingQuestion[],
  role: string,
  level: string,
  type: string
): TrainingQuestion[] {
  // Extract key technologies from role
  const roleTechnologies = extractTechnologies(role);

  // Normalize level
  const normalizedLevel = normalizeLevel(level);

  // Filter by level and technology
  const filtered = trainingData.filter(item => {
    const instruction = item.instruction.toLowerCase();

    // Check if level matches
    const levelMatch = instruction.includes(normalizedLevel);

    // Check if any technology matches
    const techMatch = roleTechnologies.some(tech =>
      instruction.includes(tech.toLowerCase())
    );

    // For technical interviews, prefer technical questions
    // For behavioral, we'll handle separately
    if (type.toLowerCase() === 'behavioral') {
      return instruction.includes('behavioral') || 
             instruction.includes('soft skill') ||
             instruction.includes('leadership');
    }

    return levelMatch && techMatch;
  });

  return filtered;
}

/**
 * Extract technologies from role string
 */
function extractTechnologies(role: string): string[] {
  const roleLower = role.toLowerCase();
  const technologies: string[] = [];

  // Technology keywords mapping
  const techKeywords: Record<string, string[]> = {
    'python': ['python', 'django', 'flask'],
    'javascript': ['javascript', 'js', 'node', 'react', 'vue', 'angular'],
    'java': ['java', 'spring', 'spring boot'],
    'typescript': ['typescript', 'ts'],
    'react': ['react', 'react.js', 'reactjs'],
    'node': ['node', 'node.js', 'nodejs', 'express'],
    'frontend': ['react', 'vue', 'angular', 'javascript', 'typescript'],
    'backend': ['python', 'java', 'node', 'express', 'django', 'spring'],
    'fullstack': ['javascript', 'typescript', 'react', 'node', 'python'],
    'full stack': ['javascript', 'typescript', 'react', 'node', 'python'],
    'devops': ['docker', 'kubernetes', 'aws', 'devops'],
    'data': ['python', 'sql', 'mongodb'],
    'mobile': ['react native', 'javascript', 'typescript']
  };

  // Check for each technology
  for (const [key, keywords] of Object.entries(techKeywords)) {
    if (keywords.some(keyword => roleLower.includes(keyword))) {
      technologies.push(key);
    }
  }

  // If no specific tech found, use generic based on role type
  if (technologies.length === 0) {
    if (roleLower.includes('engineer') || roleLower.includes('developer')) {
      technologies.push('javascript', 'python');
    } else {
      technologies.push('javascript'); // Default fallback
    }
  }

  return technologies;
}

/**
 * Normalize level to match training data format
 */
function normalizeLevel(level: string): string {
  const levelLower = level.toLowerCase();

  if (levelLower.includes('junior') || levelLower.includes('1-3')) {
    return 'junior';
  } else if (levelLower.includes('mid') || levelLower.includes('3-5')) {
    return 'mid';
  } else if (levelLower.includes('senior') || levelLower.includes('5+') || levelLower.includes('lead')) {
    return 'senior';
  }

  return 'mid'; // Default to mid-level
}

/**
 * Select best questions from filtered set
 */
function selectQuestions(
  filteredQuestions: TrainingQuestion[],
  amount: number
): string[] {
  if (filteredQuestions.length === 0) {
    return [];
  }

  // Shuffle to get variety
  const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);

  // Take the first match that has enough questions
  for (const item of shuffled) {
    const questions = parseQuestionsFromOutput(item.output);
    if (questions.length >= amount) {
      return questions.slice(0, amount);
    }
  }

  // If no single item has enough, combine multiple
  const allQuestions: string[] = [];
  for (const item of shuffled) {
    if (allQuestions.length >= amount) break;
    const questions = parseQuestionsFromOutput(item.output);
    allQuestions.push(...questions);
  }

  return allQuestions.slice(0, amount);
}

/**
 * Parse questions from training data output
 */
function parseQuestionsFromOutput(output: string): string[] {
  const questions: string[] = [];
  const lines = output.split('\n').map(line => line.trim()).filter(line => line);

  for (const line of lines) {
    // Match numbered questions (1., 2., 3., etc.)
    const match = line.match(/^\d+\.\s*(.+)/);
    if (match) {
      let question = match[1].trim();

      // Ensure question ends with ?
      if (!question.endsWith('?')) {
        question += '?';
      }

      // Validate question quality
      if (question.length > 15 && question.length < 300) {
        questions.push(question);
      }
    }
  }

  return questions;
}

/**
 * Generate generic questions as last resort
 */
function generateGenericQuestions(role: string, level: string, amount: number): string[] {
  const questions: string[] = [];

  const templates = [
    `What experience do you have with ${role} technologies?`,
    `How would you approach a complex problem in ${role} development?`,
    `Describe a challenging project you worked on as a ${level} developer?`,
    `What are the key skills needed for a ${role} position?`,
    `How do you stay updated with ${role} best practices?`,
    `Explain your development process for ${role} projects?`,
    `What tools and frameworks do you use for ${role} development?`,
    `How do you handle debugging and troubleshooting in ${role}?`,
    `Describe your experience with version control and collaboration?`,
    `What are your strengths as a ${level} ${role}?`
  ];

  for (let i = 0; i < Math.min(amount, templates.length); i++) {
    questions.push(templates[i]);
  }

  return questions;
}
