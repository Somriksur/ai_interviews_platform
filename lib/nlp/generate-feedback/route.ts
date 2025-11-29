import { NextResponse } from "next/server";
import { evaluateAnswerWithGemini } from "@/lib/gemini/evaluate-answer";

// Hybrid feedback generation: Gemini AI for correctness + NLP for communication
export async function POST(req: Request) {
    try {
        const { interview, transcript } = await req.json();

        console.log("NLP API called with:", {
            role: interview?.role,
            questionsCount: interview?.questions?.length,
            transcriptCount: transcript?.length
        });

        if (!interview || !transcript) {
            console.error("Missing interview or transcript");
            return NextResponse.json(
                { success: false, error: "Interview and transcript required" },
                { status: 400 }
            );
        }

        // Generate feedback using pure NLP
        console.log("Starting NLP feedback generation...");
        const feedback = await generateNLPFeedback(interview, transcript);
        console.log("NLP feedback generated successfully");

        return NextResponse.json({
            success: true,
            feedback
        });
    } catch (error) {
        console.error("Error generating NLP feedback:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate feedback";
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

export async function generateNLPFeedback(interview: any, transcript: any[]) {
    // Extract candidate answers
    const candidateAnswers = transcript.filter(t => t.role === "user");
    const questions = interview.questions || [];
    
    // Analyze each Q&A pair with question context (using Gemini + NLP)
    const qaAnalyses = [];
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const answer = candidateAnswers[i]?.content || "";
        
        if (answer.trim().length > 0) {
            const analysis = await analyzeQAPair(
                question, 
                answer, 
                interview.techstack,
                interview.role,
                interview.level
            );
            qaAnalyses.push({
                ...analysis,
                question,
                answer,
                questionNumber: i + 1
            });
        }
    }

    // Calculate overall metrics
    const overallMetrics = calculateOverallMetrics(qaAnalyses);
    
    // Generate detailed category scores with role-specific evaluation
    const categoryScores = generateCategoryScores(
        qaAnalyses, 
        overallMetrics,
        interview.role,
        interview.level,
        interview.techstack
    );
    
    // Generate comprehensive strengths with specific examples
    const strengths = identifyStrengthsDetailed(
        qaAnalyses, 
        overallMetrics,
        interview.role,
        interview.techstack
    );
    
    // Generate detailed improvements with actionable recommendations
    const improvements = identifyImprovementsDetailed(
        qaAnalyses, 
        overallMetrics,
        interview.role,
        interview.level,
        interview.techstack
    );
    
    // Generate question-by-question breakdown
    const questionBreakdown = generateQuestionBreakdown(qaAnalyses);
    
    // Generate role-specific technical assessment
    const technicalAssessment = generateTechnicalAssessment(
        qaAnalyses,
        overallMetrics,
        interview.role,
        interview.techstack
    );
    
    // Generate comprehensive final assessment
    const finalAssessment = generateComprehensiveFinalAssessment(
        qaAnalyses,
        overallMetrics,
        interview,
        candidateAnswers.length,
        technicalAssessment
    );
    
    // Calculate total score
    const totalScore = calculateTotalScore(categoryScores);
    
    // Generate hiring recommendation
    const recommendation = generateHiringRecommendation(
        totalScore,
        categoryScores,
        interview.level,
        overallMetrics
    );
    
    return {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement: improvements,
        finalAssessment,
        technicalAssessment,
        questionBreakdown,
        recommendation,
        interviewMetadata: {
            role: interview.role,
            level: interview.level,
            techStack: interview.techstack,
            questionsAsked: questions.length,
            questionsAnswered: candidateAnswers.length,
            completionRate: Math.round((candidateAnswers.length / questions.length) * 100)
        }
    };
}

// Analyze individual Q&A pair (ENHANCED with Gemini AI + NLP)
async function analyzeQAPair(
    question: string, 
    answer: string, 
    techStack: string[],
    role?: string,
    level?: string
) {
    // Get AI evaluation for correctness
    const aiEvaluation = await evaluateAnswerWithGemini(
        question,
        answer,
        role || 'Software Engineer',
        level || 'Mid-level',
        techStack
    );
    
    const metrics = {
        // AI-evaluated correctness scores
        aiCorrectnessScore: aiEvaluation.correctnessScore,
        aiRelevanceScore: aiEvaluation.relevanceScore,
        aiTechnicalAccuracyScore: aiEvaluation.technicalAccuracyScore,
        aiCompletenessScore: aiEvaluation.completenessScore,
        aiOverallScore: aiEvaluation.overallScore,
        aiIsCorrect: aiEvaluation.isCorrect,
        aiFeedback: aiEvaluation.feedback,
        aiKeyPointsCovered: aiEvaluation.keyPointsCovered,
        aiKeyPointsMissed: aiEvaluation.keyPointsMissed,
        
        // NLP-evaluated communication metrics
        // Basic metrics
        wordCount: countWords(answer),
        sentenceCount: countSentences(answer),
        avgWordsPerSentence: 0,
        uniqueWordCount: countUniqueWords(answer),
        lexicalDiversity: 0,
        
        // Quality metrics
        fillerWordCount: countFillerWords(answer),
        technicalTerms: extractTechnicalTerms(answer, techStack),
        questionKeywords: extractQuestionKeywords(question),
        answerKeywords: extractAnswerKeywords(answer),
        
        // Advanced metrics
        sentimentScore: analyzeSentiment(answer),
        confidenceIndicators: detectConfidenceIndicators(answer),
        structureScore: analyzeStructure(answer),
        exampleCount: countExamples(answer),
        
        // Scores
        relevanceScore: 0,
        technicalDepthScore: 0,
        clarityScore: 0,
        completenessScore: 0
    };
    
    metrics.avgWordsPerSentence = metrics.wordCount / Math.max(metrics.sentenceCount, 1);
    metrics.lexicalDiversity = metrics.uniqueWordCount / Math.max(metrics.wordCount, 1);
    
    // NLP-based communication scores (for sentiment, clarity, confidence)
    metrics.clarityScore = calculateClarityEnhanced(
        metrics.avgWordsPerSentence,
        metrics.fillerWordCount,
        metrics.wordCount,
        metrics.structureScore,
        metrics.lexicalDiversity
    );
    
    // Use AI scores for correctness-based metrics
    metrics.relevanceScore = aiEvaluation.relevanceScore;
    metrics.technicalDepthScore = aiEvaluation.technicalAccuracyScore;
    metrics.completenessScore = aiEvaluation.completenessScore;
    
    return metrics;
}

// NEW: Count unique words
function countUniqueWords(text: string): number {
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
    return new Set(words).size;
}

// NEW: Analyze sentiment (positive/negative tone)
function analyzeSentiment(text: string): number {
    const positiveWords = ['good', 'great', 'excellent', 'effective', 'efficient', 'optimal', 'best',
                           'improve', 'enhance', 'benefit', 'advantage', 'success', 'achieve', 'solve'];
    const negativeWords = ['bad', 'poor', 'difficult', 'problem', 'issue', 'fail', 'error', 'wrong',
                           'hard', 'challenge', 'struggle', 'confuse', 'unclear', 'uncertain'];
    
    const lowerText = text.toLowerCase();
    let score = 50; // Neutral
    
    positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 3;
    });
    
    negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 2;
    });
    
    return Math.max(0, Math.min(100, score));
}

// NEW: Detect confidence indicators
function detectConfidenceIndicators(text: string): { positive: number; negative: number } {
    const confident = ['definitely', 'certainly', 'clearly', 'obviously', 'always', 'ensure',
                       'confident', 'sure', 'know', 'understand', 'experience', 'familiar'];
    const uncertain = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'probably', 'think',
                       'guess', 'assume', 'not sure', 'uncertain', 'unsure', 'confused'];
    
    const lowerText = text.toLowerCase();
    let positive = 0, negative = 0;
    
    confident.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) positive += matches.length;
    });
    
    uncertain.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) negative += matches.length;
    });
    
    return { positive, negative };
}

// NEW: Analyze answer structure
function analyzeStructure(text: string): number {
    let score = 50;
    
    // Check for structured elements
    const hasIntro = /^(first|to start|initially|basically|essentially|in general)/i.test(text);
    const hasConclusion = /(therefore|thus|in conclusion|overall|finally|in summary)/i.test(text);
    const hasExamples = /(for example|for instance|such as|like|e\.g\.|i\.e\.)/i.test(text);
    const hasSteps = /(first|second|third|then|next|finally|step)/i.test(text);
    const hasComparison = /(compared to|versus|vs|better than|worse than|similar to)/i.test(text);
    
    if (hasIntro) score += 10;
    if (hasConclusion) score += 10;
    if (hasExamples) score += 15;
    if (hasSteps) score += 10;
    if (hasComparison) score += 5;
    
    return Math.min(100, score);
}

// NEW: Count examples in answer
function countExamples(text: string): number {
    const exampleIndicators = [
        /for example/gi,
        /for instance/gi,
        /such as/gi,
        /like\s+\w+/gi,
        /e\.g\./gi,
        /i\.e\./gi
    ];
    
    let count = 0;
    exampleIndicators.forEach(regex => {
        const matches = text.match(regex);
        if (matches) count += matches.length;
    });
    
    return count;
}


// Helper: Count words
function countWords(text: string): number {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

// Helper: Count sentences
function countSentences(text: string): number {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

// Helper: Count filler words
function countFillerWords(text: string): number {
    const fillers = [
        'um', 'uh', 'like', 'you know', 'basically', 'actually',
        'literally', 'sort of', 'kind of', 'i mean', 'well',
        'so', 'right', 'okay', 'yeah', 'just'
    ];
    
    const lowerText = text.toLowerCase();
    let count = 0;
    
    fillers.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) count += matches.length;
    });
    
    return count;
}

// Helper: Extract technical terms (ENHANCED with 200+ terms)
function extractTechnicalTerms(text: string, techStack: string[]): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];
    
    // Comprehensive technical terms database
    const technicalTerms = {
        // Frontend
        frontend: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'gatsby', 'redux', 'mobx', 'zustand',
                   'component', 'jsx', 'tsx', 'virtual dom', 'hooks', 'state', 'props', 'context', 'ref',
                   'lifecycle', 'render', 'reconciliation', 'fiber', 'suspense', 'portal', 'fragment',
                   'css', 'sass', 'less', 'styled-components', 'tailwind', 'bootstrap', 'material-ui',
                   'webpack', 'vite', 'rollup', 'parcel', 'babel', 'typescript', 'javascript', 'es6',
                   'dom', 'event', 'listener', 'handler', 'callback', 'closure', 'promise', 'async', 'await'],
        
        // Backend
        backend: ['node.js', 'express', 'fastify', 'koa', 'nest.js', 'django', 'flask', 'fastapi', 'spring',
                  'laravel', 'rails', 'asp.net', 'go', 'rust', 'java', 'python', 'php', 'ruby', 'c#',
                  'api', 'rest', 'graphql', 'grpc', 'websocket', 'http', 'https', 'tcp', 'udp',
                  'middleware', 'router', 'controller', 'service', 'repository', 'orm', 'sequelize',
                  'prisma', 'typeorm', 'mongoose', 'sqlalchemy', 'hibernate', 'entity framework'],
        
        // Database
        database: ['sql', 'nosql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'dynamodb',
                   'elasticsearch', 'neo4j', 'sqlite', 'oracle', 'mariadb', 'couchdb', 'firebase',
                   'query', 'index', 'schema', 'migration', 'transaction', 'acid', 'join', 'aggregate',
                   'normalization', 'denormalization', 'sharding', 'replication', 'partitioning',
                   'primary key', 'foreign key', 'constraint', 'trigger', 'stored procedure', 'view'],
        
        // DevOps & Cloud
        devops: ['docker', 'kubernetes', 'k8s', 'jenkins', 'gitlab', 'github actions', 'circleci',
                 'aws', 'azure', 'gcp', 'ec2', 's3', 'lambda', 'cloudformation', 'terraform', 'ansible',
                 'ci/cd', 'pipeline', 'deployment', 'container', 'orchestration', 'microservices',
                 'load balancer', 'cdn', 'nginx', 'apache', 'reverse proxy', 'ssl', 'tls', 'dns',
                 'monitoring', 'logging', 'prometheus', 'grafana', 'elk', 'datadog', 'new relic'],
        
        // Testing
        testing: ['jest', 'mocha', 'chai', 'jasmine', 'cypress', 'selenium', 'playwright', 'puppeteer',
                  'unit test', 'integration test', 'e2e', 'tdd', 'bdd', 'mock', 'stub', 'spy',
                  'coverage', 'assertion', 'test suite', 'test case', 'fixture', 'snapshot'],
        
        // Architecture & Patterns
        architecture: ['mvc', 'mvvm', 'clean architecture', 'hexagonal', 'onion', 'cqrs', 'event sourcing',
                       'microservices', 'monolith', 'serverless', 'soa', 'ddd', 'solid', 'dry', 'kiss',
                       'singleton', 'factory', 'observer', 'strategy', 'decorator', 'adapter', 'facade'],
        
        // Data Structures & Algorithms
        algorithms: ['array', 'linked list', 'stack', 'queue', 'tree', 'graph', 'hash table', 'heap',
                     'binary search', 'sorting', 'recursion', 'dynamic programming', 'greedy', 'backtracking',
                     'big o', 'time complexity', 'space complexity', 'optimization', 'algorithm'],
        
        // Security
        security: ['authentication', 'authorization', 'jwt', 'oauth', 'saml', 'encryption', 'hashing',
                   'bcrypt', 'salt', 'csrf', 'xss', 'sql injection', 'cors', 'https', 'ssl', 'tls',
                   'firewall', 'vpn', 'penetration testing', 'vulnerability', 'security audit'],
        
        // Mobile
        mobile: ['react native', 'flutter', 'swift', 'kotlin', 'ios', 'android', 'xamarin', 'ionic',
                 'mobile app', 'native', 'hybrid', 'pwa', 'responsive', 'touch', 'gesture'],
        
        // AI/ML
        aiml: ['machine learning', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 'scikit-learn',
               'nlp', 'computer vision', 'model', 'training', 'inference', 'dataset', 'feature', 'label'],
        
        // General Programming
        general: ['function', 'method', 'class', 'object', 'variable', 'constant', 'parameter', 'argument',
                  'return', 'loop', 'condition', 'if', 'else', 'switch', 'try', 'catch', 'throw',
                  'interface', 'type', 'generic', 'inheritance', 'polymorphism', 'encapsulation',
                  'abstraction', 'module', 'package', 'library', 'framework', 'dependency', 'import',
                  'export', 'scope', 'hoisting', 'prototype', 'this', 'bind', 'call', 'apply']
    };
    
    // Flatten all terms
    const allCommonTerms = Object.values(technicalTerms).flat();
    const allTerms = [...techStack.map(t => t.toLowerCase()), ...allCommonTerms];
    
    // Use word boundaries for better matching
    allTerms.forEach(term => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText)) {
            found.push(term);
        }
    });
    
    return [...new Set(found)];
}

// Helper: Extract question keywords
function extractQuestionKeywords(question: string): string[] {
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which',
                       'is', 'are', 'was', 'were', 'be', 'been', 'being',
                       'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                       'to', 'for', 'of', 'with', 'by', 'from', 'as'];
    
    const words = question.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));
    
    return [...new Set(words)];
}

// Helper: Extract answer keywords
function extractAnswerKeywords(answer: string): string[] {
    const stopWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which',
                       'is', 'are', 'was', 'were', 'be', 'been', 'being',
                       'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at',
                       'to', 'for', 'of', 'with', 'by', 'from', 'as',
                       'this', 'that', 'these', 'those', 'it', 'its'];
    
    const words = answer.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.includes(w));
    
    return [...new Set(words)];
}


// Calculate relevance score (ENHANCED with semantic matching)
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _calculateRelevanceEnhanced(
    questionKeywords: string[],
    answerKeywords: string[],
    question: string,
    answer: string
): number {
    // Very short answers get low relevance
    if (answer.length < 10) return 5;
    if (questionKeywords.length === 0) return 50;
    
    let matchCount = 0;
    let partialMatchCount = 0;
    
    // Exact and partial keyword matching
    questionKeywords.forEach(qk => {
        const exactMatch = answerKeywords.some(ak => ak === qk);
        const partialMatch = answerKeywords.some(ak => ak.includes(qk) || qk.includes(ak));
        
        if (exactMatch) matchCount += 1;
        else if (partialMatch) partialMatchCount += 0.5;
    });
    
    // Calculate base relevance (stricter)
    const totalMatches = matchCount + partialMatchCount;
    let relevance = (totalMatches / questionKeywords.length) * 60;
    
    // Bonus for direct question addressing
    const questionType = detectQuestionType(question);
    if (addressesQuestionType(answer, questionType)) {
        relevance += 15;
    }
    
    // Bonus for answer length (shows engagement)
    if (answer.length > 150) relevance += 15;
    else if (answer.length > 100) relevance += 10;
    else if (answer.length > 50) relevance += 5;
    else if (answer.length < 30) relevance -= 10;
    
    return Math.max(0, Math.min(100, Math.round(relevance)));
}

// NEW: Detect question type
function detectQuestionType(question: string): string {
    const lowerQ = question.toLowerCase();
    if (lowerQ.startsWith('how')) return 'how';
    if (lowerQ.startsWith('what')) return 'what';
    if (lowerQ.startsWith('why')) return 'why';
    if (lowerQ.startsWith('when')) return 'when';
    if (lowerQ.startsWith('describe')) return 'describe';
    if (lowerQ.startsWith('explain')) return 'explain';
    if (lowerQ.startsWith('tell')) return 'tell';
    return 'general';
}

// NEW: Check if answer addresses question type
function addressesQuestionType(answer: string, questionType: string): boolean {
    switch (questionType) {
        case 'how':
            return /\b(by|using|through|via|with|implement|create|build)\b/i.test(answer);
        case 'why':
            return /\b(because|since|due to|reason|cause|benefit|advantage)\b/i.test(answer);
        case 'what':
            return /\b(is|are|means|refers to|definition|concept)\b/i.test(answer);
        case 'describe':
        case 'explain':
            return answer.length > 50; // Descriptive answers are longer
        default:
            return true;
    }
}

// Calculate technical depth (ENHANCED)
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _calculateTechnicalDepthEnhanced(
    technicalTerms: string[],
    techStack: string[],
    wordCount: number,
    exampleCount: number
): number {
    // NO base score for empty answers
    if (wordCount < 5) return 0;
    
    let score = 10; // Reduced base score
    
    // Technical term count (more terms = deeper knowledge)
    const termScore = Math.min(technicalTerms.length * 4, 35);
    score += termScore;
    
    // Tech stack coverage (mentions specific technologies)
    const stackCoverage = technicalTerms.filter(term =>
        techStack.some(tech => tech.toLowerCase().includes(term) || term.includes(tech.toLowerCase()))
    ).length;
    const stackScore = (stackCoverage / Math.max(techStack.length, 1)) * 20;
    score += stackScore;
    
    // Answer depth (longer answers show more detail)
    if (wordCount > 120) score += 15;
    else if (wordCount > 80) score += 12;
    else if (wordCount > 50) score += 8;
    else if (wordCount > 30) score += 4;
    
    // Examples bonus (shows practical knowledge)
    score += Math.min(exampleCount * 5, 10);
    
    return Math.min(Math.round(score), 100);
}

// Calculate clarity score (ENHANCED)
function calculateClarityEnhanced(
    avgWordsPerSentence: number,
    fillerWordCount: number,
    wordCount: number,
    structureScore: number,
    lexicalDiversity: number
): number {
    // NO base score for empty answers
    if (wordCount < 5) return 0;
    
    let score = 10; // Much stricter base score
    
    // Sentence length (ideal: 15-25 words)
    if (avgWordsPerSentence >= 15 && avgWordsPerSentence <= 25) {
        score += 15;
    } else if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 30) {
        score += 8;
    } else if (avgWordsPerSentence < 8 || avgWordsPerSentence > 40) {
        score -= 15;
    }
    
    // Filler words penalty (more sophisticated)
    const fillerPercentage = (fillerWordCount / Math.max(wordCount, 1)) * 100;
    if (fillerPercentage === 0) score += 15;
    else if (fillerPercentage < 2) score += 10;
    else if (fillerPercentage < 5) score += 5;
    else if (fillerPercentage > 10) score -= 20;
    else if (fillerPercentage > 7) score -= 10;
    
    // Answer length (optimal range)
    if (wordCount >= 50 && wordCount <= 150) score += 12;
    else if (wordCount >= 30 && wordCount <= 200) score += 6;
    else if (wordCount < 20) score -= 15;
    else if (wordCount > 250) score -= 5; // Too verbose
    
    // Structure bonus
    score += (structureScore - 50) * 0.2;
    
    // Lexical diversity (vocabulary richness)
    if (lexicalDiversity > 0.7) score += 10;
    else if (lexicalDiversity > 0.5) score += 5;
    else if (lexicalDiversity < 0.3) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Calculate completeness score (ENHANCED)
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _calculateCompletenessEnhanced(
    wordCount: number,
    technicalTermCount: number,
    relevanceScore: number,
    exampleCount: number,
    structureScore: number
): number {
    // NO base score for empty/very short answers
    if (wordCount < 5) return 0;
    
    let score = 5; // Much stricter base score
    
    // Word count (comprehensive answers need sufficient length)
    if (wordCount > 100) score += 20;
    else if (wordCount > 70) score += 16;
    else if (wordCount > 50) score += 12;
    else if (wordCount > 30) score += 8;
    else if (wordCount < 20) score -= 15;
    
    // Technical terms (depth of technical detail)
    score += Math.min(technicalTermCount * 2.5, 20);
    
    // Relevance (complete answers address the question)
    score += (relevanceScore - 70) * 0.25;
    
    // Examples (complete answers include examples)
    score += Math.min(exampleCount * 6, 15);
    
    // Structure (well-structured answers are more complete)
    score += (structureScore - 50) * 0.15;
    
    return Math.max(0, Math.min(100, Math.round(score)));
}


// Calculate overall metrics from all Q&A analyses
function calculateOverallMetrics(analyses: any[]) {
    if (analyses.length === 0) {
        return {
            avgRelevance: 0,
            avgTechnicalDepth: 0,
            avgClarity: 0,
            avgCompleteness: 0,
            avgCorrectness: 0,
            avgAIOverall: 0,
            totalFillerWords: 0,
            totalTechnicalTerms: 0,
            avgWordCount: 0,
            answeredCount: 0,
            correctAnswersCount: 0
        };
    }
    
    const sum = analyses.reduce((acc, a) => ({
        relevance: acc.relevance + a.relevanceScore,
        technicalDepth: acc.technicalDepth + a.technicalDepthScore,
        clarity: acc.clarity + a.clarityScore,
        completeness: acc.completeness + a.completenessScore,
        correctness: acc.correctness + (a.aiCorrectnessScore || 0),
        aiOverall: acc.aiOverall + (a.aiOverallScore || 0),
        fillerWords: acc.fillerWords + a.fillerWordCount,
        technicalTerms: acc.technicalTerms + a.technicalTerms.length,
        wordCount: acc.wordCount + a.wordCount,
        correctAnswers: acc.correctAnswers + (a.aiIsCorrect ? 1 : 0)
    }), {
        relevance: 0,
        technicalDepth: 0,
        clarity: 0,
        completeness: 0,
        correctness: 0,
        aiOverall: 0,
        fillerWords: 0,
        technicalTerms: 0,
        wordCount: 0,
        correctAnswers: 0
    });
    
    const count = analyses.length;
    
    return {
        avgRelevance: Math.round(sum.relevance / count),
        avgTechnicalDepth: Math.round(sum.technicalDepth / count),
        avgClarity: Math.round(sum.clarity / count),
        avgCompleteness: Math.round(sum.completeness / count),
        avgCorrectness: Math.round(sum.correctness / count),
        avgAIOverall: Math.round(sum.aiOverall / count),
        totalFillerWords: sum.fillerWords,
        totalTechnicalTerms: sum.technicalTerms,
        avgWordCount: Math.round(sum.wordCount / count),
        answeredCount: count,
        correctAnswersCount: sum.correctAnswers
    };
}

// Generate category scores (ENHANCED with AI correctness + NLP communication)
function generateCategoryScores(
    _analyses: any[], 
    metrics: any,
    role?: string,
    level?: string,
    techStack?: string[]
) {
    // Technical Knowledge = AI Technical Accuracy (most important)
    const technicalScore = metrics.avgTechnicalDepth;
    
    // Answer Correctness = AI Correctness Score (new category)
    const correctnessScore = metrics.avgCorrectness || 0;
    
    // Communication = NLP Clarity (sentiment, filler words, structure)
    const communicationScore = metrics.avgClarity;
    
    // Problem Solving = AI Completeness + Relevance
    const problemSolvingScore = Math.round((metrics.avgCompleteness + metrics.avgRelevance) / 2);
    
    return [
        {
            name: "Answer Correctness",
            score: correctnessScore,
            comment: generateCorrectnessComment(metrics)
        },
        {
            name: "Technical Knowledge",
            score: technicalScore,
            comment: generateTechnicalComment(metrics, role, techStack)
        },
        {
            name: "Communication Skills",
            score: communicationScore,
            comment: generateCommunicationComment(metrics)
        },
        {
            name: "Problem Solving",
            score: problemSolvingScore,
            comment: generateProblemSolvingComment(metrics)
        },
        {
            name: "Confidence & Professionalism",
            score: calculateConfidenceScore(metrics),
            comment: generateConfidenceComment(metrics)
        },
        {
            name: "Role Suitability",
            score: calculateRoleSuitability(metrics, level),
            comment: generateRoleSuitabilityComment(metrics, role, level)
        }
    ];
}

// NEW: Generate correctness comment
function generateCorrectnessComment(metrics: any): string {
    const correctness = metrics.avgCorrectness || 0;
    const correctCount = metrics.correctAnswersCount || 0;
    const totalCount = metrics.answeredCount || 0;
    
    if (correctness >= 80) {
        return `Excellent accuracy! ${correctCount}/${totalCount} answers were fundamentally correct. Demonstrated strong understanding of concepts with accurate, well-reasoned responses.`;
    } else if (correctness >= 65) {
        return `Good accuracy overall. ${correctCount}/${totalCount} answers were correct. Some minor inaccuracies or incomplete explanations, but solid foundational understanding.`;
    } else if (correctness >= 50) {
        return `Moderate accuracy. ${correctCount}/${totalCount} answers were correct. Several answers had significant gaps or misconceptions. Review core concepts thoroughly.`;
    } else if (correctness >= 30) {
        return `Low accuracy. Only ${correctCount}/${totalCount} answers were correct. Many answers showed fundamental misunderstandings or were off-topic. Requires substantial study.`;
    } else {
        return `Very poor accuracy. ${correctCount}/${totalCount} answers were correct. Most answers were wrong, irrelevant, or showed lack of understanding. Not ready for this role.`;
    }
}

// NEW: Calculate role suitability score
function calculateRoleSuitability(metrics: any, level?: string): number {
    // Start from 0, must earn suitability score
    let score = 0;
    
    // Base score only if minimum competency shown
    if (metrics.avgTechnicalDepth >= 40 && metrics.avgClarity >= 40) {
        score = 30;
    } else if (metrics.avgTechnicalDepth >= 25 || metrics.avgClarity >= 25) {
        score = 15;
    }
    
    // Level-specific expectations
    if (level === 'Senior') {
        // Senior roles need high technical depth and clarity
        if (metrics.avgTechnicalDepth >= 80) score += 30;
        else if (metrics.avgTechnicalDepth >= 70) score += 20;
        else if (metrics.avgTechnicalDepth >= 60) score += 10;
        else score -= 15;
        
        if (metrics.avgClarity >= 75) score += 20;
        else if (metrics.avgClarity >= 65) score += 10;
        else score -= 10;
        
        if (metrics.avgCompleteness >= 75) score += 15;
        else if (metrics.avgCompleteness >= 65) score += 8;
        
        if (metrics.totalTechnicalTerms >= 15) score += 5;
    } else if (level === 'Junior') {
        // Junior roles focus on potential and communication
        if (metrics.avgClarity >= 70) score += 20;
        else if (metrics.avgClarity >= 60) score += 15;
        else if (metrics.avgClarity >= 50) score += 8;
        
        if (metrics.avgTechnicalDepth >= 60) score += 20;
        else if (metrics.avgTechnicalDepth >= 45) score += 15;
        else if (metrics.avgTechnicalDepth >= 30) score += 8;
        
        if (metrics.totalFillerWords <= 3) score += 15;
        else if (metrics.totalFillerWords <= 5) score += 8;
        
        if (metrics.avgWordCount >= 40) score += 10;
    } else {
        // Mid-level balanced assessment
        if (metrics.avgTechnicalDepth >= 70) score += 25;
        else if (metrics.avgTechnicalDepth >= 60) score += 18;
        else if (metrics.avgTechnicalDepth >= 50) score += 10;
        else score -= 10;
        
        if (metrics.avgClarity >= 70) score += 20;
        else if (metrics.avgClarity >= 60) score += 15;
        else if (metrics.avgClarity >= 50) score += 8;
        
        if (metrics.avgCompleteness >= 70) score += 15;
        else if (metrics.avgCompleteness >= 60) score += 10;
        else if (metrics.avgCompleteness >= 50) score += 5;
        
        if (metrics.totalTechnicalTerms >= 10) score += 5;
    }
    
    return Math.max(0, Math.min(100, score));
}

// NEW: Generate role suitability comment
function generateRoleSuitabilityComment(metrics: any, role?: string, level?: string): string {
    const suitability = calculateRoleSuitability(metrics, level);
    const roleTitle = level ? `${level} ${role}` : role || 'the position';
    
    if (suitability >= 75) {
        return `Excellent fit for ${roleTitle}. Demonstrates the technical expertise, communication skills, and professional maturity expected at this level.`;
    } else if (suitability >= 60) {
        return `Good potential for ${roleTitle}. Shows core competencies with room to grow into the role through mentorship and experience.`;
    } else if (suitability >= 50) {
        return `Marginal fit for ${roleTitle}. May be better suited for a different level or role. Consider alternative positions or additional training.`;
    } else {
        return `Not currently suitable for ${roleTitle}. Significant gaps in required competencies. Recommend gaining more experience before applying.`;
    }
}

// Generate technical knowledge comment (ENHANCED with role context)
function generateTechnicalComment(metrics: any, role?: string, techStack?: string[]): string {
    const depth = metrics.avgTechnicalDepth;
    const terms = metrics.totalTechnicalTerms;
    const roleContext = role || 'the position';
    const mainTech = techStack?.[0] || 'required technologies';
    
    if (depth >= 80) {
        return `Excellent technical knowledge for ${roleContext}. Used ${terms} technical terms effectively, demonstrating deep understanding of ${mainTech} and related concepts. Answers showed strong grasp of best practices and advanced topics.`;
    } else if (depth >= 65) {
        return `Good technical understanding for ${roleContext}. Mentioned ${terms} technical concepts related to ${mainTech}. Could provide more detailed explanations and discuss advanced patterns in some areas.`;
    } else if (depth >= 50) {
        return `Adequate technical knowledge for ${roleContext}. Used ${terms} technical terms. Would benefit from deeper exploration of ${mainTech} fundamentals and more in-depth explanations with practical examples.`;
    } else {
        return `Limited technical depth for ${roleContext}. Only ${terms} technical terms identified. Needs to demonstrate stronger understanding of ${mainTech} core concepts, best practices, and common use cases.`;
    }
}

// Generate communication comment
function generateCommunicationComment(metrics: any): string {
    const clarity = metrics.avgClarity;
    const fillers = metrics.totalFillerWords;
    const avgWords = metrics.avgWordCount;
    
    if (clarity >= 80) {
        return `Clear and articulate communication. ${fillers === 0 ? 'No filler words detected.' : `Minimal filler words (${fillers}).`} Well-structured responses averaging ${avgWords} words.`;
    } else if (clarity >= 65) {
        return `Good communication skills. ${fillers > 0 ? `Some filler words detected (${fillers}).` : 'Clear expression.'} Responses averaged ${avgWords} words. Could improve sentence structure.`;
    } else if (clarity >= 50) {
        return `Fair communication. ${fillers} filler words detected. Responses averaged ${avgWords} words. Work on clarity and reducing hesitation.`;
    } else {
        return `Communication needs improvement. ${fillers} filler words detected. Brief responses (avg ${avgWords} words). Focus on clear, structured answers.`;
    }
}


// Generate problem solving comment
function generateProblemSolvingComment(metrics: any): string {
    const completeness = metrics.avgCompleteness;
    const relevance = metrics.avgRelevance;
    
    if (completeness >= 80) {
        return `Strong problem-solving approach. Answers were comprehensive and directly addressed questions (${relevance}% relevance). Demonstrated logical thinking.`;
    } else if (completeness >= 65) {
        return `Good problem-solving skills shown. Most answers were complete (${relevance}% relevance). Could provide more detailed solutions in some cases.`;
    } else if (completeness >= 50) {
        return `Adequate problem-solving demonstrated. Answers had ${relevance}% relevance to questions. Would benefit from more thorough explanations.`;
    } else {
        return `Problem-solving needs development. Answers were brief with ${relevance}% relevance. Focus on providing complete, detailed solutions.`;
    }
}

// Calculate confidence score
function calculateConfidenceScore(metrics: any): number {
    // NO base score for no answers
    if (metrics.answeredCount === 0) return 0;
    
    // Start from 0, earn points through performance
    let score = 0;
    
    // Base score only if answers are substantial
    if (metrics.avgWordCount >= 30) score += 30;
    else if (metrics.avgWordCount >= 20) score += 20;
    else if (metrics.avgWordCount >= 10) score += 10;
    
    // Low filler words = high confidence
    const fillerRatio = metrics.totalFillerWords / Math.max(metrics.answeredCount, 1);
    if (fillerRatio === 0) score += 25;
    else if (fillerRatio < 1) score += 20;
    else if (fillerRatio < 2) score += 10;
    else if (fillerRatio > 5) score -= 15;
    
    // Good word count = confidence
    if (metrics.avgWordCount > 80) score += 20;
    else if (metrics.avgWordCount > 60) score += 15;
    else if (metrics.avgWordCount < 20) score -= 20;
    
    // Technical depth shows confidence
    if (metrics.avgTechnicalDepth > 60) score += 15;
    else if (metrics.avgTechnicalDepth < 30) score -= 10;
    
    // Clarity shows confidence
    if (metrics.avgClarity > 60) score += 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

// Generate confidence comment
function generateConfidenceComment(metrics: any): string {
    const score = calculateConfidenceScore(metrics);
    const fillers = metrics.totalFillerWords;
    
    if (score >= 80) {
        return `High confidence and professionalism displayed. ${fillers === 0 ? 'No hesitation markers.' : `Minimal hesitation (${fillers} filler words).`} Engaged well with questions.`;
    } else if (score >= 65) {
        return `Good professional demeanor. ${fillers > 0 ? `Some hesitation noted (${fillers} filler words).` : 'Confident responses.'} Maintained composure throughout.`;
    } else if (score >= 50) {
        return `Adequate professionalism. ${fillers} filler words suggest some uncertainty. Work on building confidence in responses.`;
    } else {
        return `Confidence needs improvement. ${fillers} filler words detected. Practice answering with more certainty and less hesitation.`;
    }
}

// Identify strengths
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _identifyStrengths(_analyses: any[], metrics: any): string[] {
    const strengths: string[] = [];
    
    if (metrics.avgTechnicalDepth >= 70) {
        strengths.push("Strong technical knowledge and understanding of concepts");
    }
    
    if (metrics.avgClarity >= 75) {
        strengths.push("Clear and articulate communication");
    }
    
    if (metrics.totalFillerWords <= 3) {
        strengths.push("Confident delivery with minimal hesitation");
    }
    
    if (metrics.avgRelevance >= 80) {
        strengths.push("Answers directly addressed the questions asked");
    }
    
    if (metrics.avgWordCount >= 60) {
        strengths.push("Provided detailed and thorough responses");
    }
    
    if (metrics.totalTechnicalTerms >= 10) {
        strengths.push("Good use of technical terminology");
    }
    
    if (strengths.length === 0) {
        strengths.push("Completed the interview");
        strengths.push("Engaged with the questions");
    }
    
    return strengths.slice(0, 5); // Max 5 strengths
}

// Identify areas for improvement
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _identifyImprovements(_analyses: any[], metrics: any): string[] {
    const improvements: string[] = [];
    
    if (metrics.avgTechnicalDepth < 60) {
        improvements.push("Deepen technical knowledge and provide more detailed explanations");
    }
    
    if (metrics.avgClarity < 65) {
        improvements.push("Improve sentence structure and clarity of expression");
    }
    
    if (metrics.totalFillerWords > 5) {
        improvements.push("Reduce filler words to sound more confident and professional");
    }
    
    if (metrics.avgRelevance < 70) {
        improvements.push("Focus more directly on answering the specific question asked");
    }
    
    if (metrics.avgWordCount < 40) {
        improvements.push("Provide more comprehensive answers with examples and details");
    }
    
    if (metrics.totalTechnicalTerms < 5) {
        improvements.push("Use more technical terminology to demonstrate expertise");
    }
    
    if (metrics.avgCompleteness < 60) {
        improvements.push("Ensure answers fully address all aspects of the question");
    }
    
    if (improvements.length === 0) {
        improvements.push("Continue practicing interview skills");
        improvements.push("Stay updated with latest technologies");
    }
    
    return improvements.slice(0, 5); // Max 5 improvements
}

// Generate final assessment
// @ts-expect-error - Unused helper function kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _generateFinalAssessment(
    _analyses: any[],
    metrics: any,
    interview: any,
    answeredCount: number
): string {
    const totalQuestions = interview.questions?.length || 0;
    const completionRate = (answeredCount / Math.max(totalQuestions, 1)) * 100;
    
    let assessment = "";
    
    // Completion status
    if (answeredCount === 0) {
        return "The candidate did not provide any responses during the interview. Unable to assess technical skills or qualifications.";
    } else if (answeredCount < totalQuestions) {
        assessment += `The candidate answered ${answeredCount} out of ${totalQuestions} questions (${Math.round(completionRate)}% completion). `;
    } else {
        assessment += `The candidate completed all ${totalQuestions} questions. `;
    }
    
    // Overall performance
    const avgScore = Math.round(
        (metrics.avgTechnicalDepth + metrics.avgClarity + 
         metrics.avgCompleteness + calculateConfidenceScore(metrics)) / 4
    );
    
    if (avgScore >= 80) {
        assessment += "Demonstrated excellent performance across all evaluation criteria. ";
    } else if (avgScore >= 70) {
        assessment += "Showed strong performance with good technical knowledge and communication skills. ";
    } else if (avgScore >= 60) {
        assessment += "Displayed adequate performance with room for improvement in some areas. ";
    } else if (avgScore >= 50) {
        assessment += "Showed basic understanding but needs significant improvement in technical depth and communication. ";
    } else {
        assessment += "Performance was below expectations. Requires substantial development in technical knowledge and interview skills. ";
    }
    
    // Technical assessment
    if (metrics.avgTechnicalDepth >= 70) {
        assessment += `Strong technical knowledge was evident with ${metrics.totalTechnicalTerms} technical concepts discussed. `;
    } else if (metrics.avgTechnicalDepth >= 50) {
        assessment += `Moderate technical understanding shown with ${metrics.totalTechnicalTerms} technical terms used. `;
    } else {
        assessment += `Limited technical depth observed with only ${metrics.totalTechnicalTerms} technical concepts mentioned. `;
    }
    
    // Communication assessment
    if (metrics.totalFillerWords === 0) {
        assessment += "Communication was clear and confident with no hesitation markers. ";
    } else if (metrics.totalFillerWords <= 3) {
        assessment += "Communication was generally clear with minimal hesitation. ";
    } else {
        assessment += `Communication could be improved - ${metrics.totalFillerWords} filler words detected. `;
    }
    
    // Recommendation
    if (avgScore >= 75) {
        assessment += "Recommended for next round of interviews.";
    } else if (avgScore >= 60) {
        assessment += "Consider for next round with focus on identified improvement areas.";
    } else {
        assessment += "Recommend additional preparation before proceeding to next round.";
    }
    
    return assessment;
}

// Calculate total score
function calculateTotalScore(categoryScores: any[]): number {
    const sum = categoryScores.reduce((acc, cat) => acc + cat.score, 0);
    return Math.round(sum / categoryScores.length);
}


// ============================================================================
// COMPREHENSIVE PROFESSIONAL FEEDBACK GENERATION
// ============================================================================

// Generate detailed strengths with specific examples
function identifyStrengthsDetailed(
    qaAnalyses: any[],
    metrics: any,
    role: string,
    techStack: string[]
): string[] {
    const strengths: string[] = [];
    
    // Technical Knowledge Strengths
    if (metrics.avgTechnicalDepth >= 75) {
        const topTerms = getTopTechnicalTerms(qaAnalyses, 3);
        strengths.push(
            `Excellent technical knowledge of ${role} concepts. Demonstrated strong understanding of ${topTerms.join(', ')} with ${metrics.totalTechnicalTerms} technical terms used across answers.`
        );
    } else if (metrics.avgTechnicalDepth >= 60) {
        strengths.push(
            `Good grasp of ${role} fundamentals. Used ${metrics.totalTechnicalTerms} technical concepts appropriately, showing solid foundation in ${techStack.slice(0, 2).join(' and ')}.`
        );
    }
    
    // Communication Strengths
    if (metrics.avgClarity >= 80) {
        strengths.push(
            `Outstanding communication skills. Responses were clear, well-structured, and articulate with ${metrics.totalFillerWords === 0 ? 'no hesitation' : 'minimal hesitation'} (${metrics.totalFillerWords} filler words). Average response length of ${metrics.avgWordCount} words shows thorough explanations.`
        );
    } else if (metrics.avgClarity >= 65) {
        strengths.push(
            `Strong communication abilities. Expressed ideas clearly with good sentence structure. Maintained professional tone throughout the interview.`
        );
    }
    
    // Problem-Solving Strengths
    if (metrics.avgCompleteness >= 75) {
        strengths.push(
            `Excellent problem-solving approach. Provided comprehensive answers that directly addressed questions with ${metrics.avgRelevance}% relevance. Demonstrated logical thinking and analytical skills.`
        );
    } else if (metrics.avgCompleteness >= 60) {
        strengths.push(
            `Good problem-solving skills. Answers were relevant (${metrics.avgRelevance}% match) and showed systematic thinking process.`
        );
    }
    
    // Confidence & Professionalism
    const confidenceScore = calculateConfidenceScore(metrics);
    if (confidenceScore >= 75) {
        strengths.push(
            `High confidence and professional demeanor. ${metrics.totalFillerWords <= 2 ? 'Spoke with certainty and conviction' : 'Maintained composure'} throughout the interview. Engaged well with all questions.`
        );
    }
    
    // Specific Technical Strengths
    const bestAnswers = qaAnalyses
        .filter(qa => qa.technicalDepthScore >= 70)
        .slice(0, 2);
    
    if (bestAnswers.length > 0) {
        const topics = bestAnswers.map(qa => 
            extractMainTopic(qa.question)
        ).filter(t => t).join(' and ');
        
        if (topics) {
            strengths.push(
                `Particularly strong in ${topics}. Demonstrated deep understanding with detailed, technical responses.`
            );
        }
    }
    
    // Practical Knowledge
    const totalExamples = qaAnalyses.reduce((sum, qa) => sum + (qa.exampleCount || 0), 0);
    if (totalExamples >= 3) {
        strengths.push(
            `Strong practical knowledge. Provided ${totalExamples} real-world examples, showing hands-on experience and ability to apply concepts.`
        );
    }
    
    // Ensure at least 3 strengths
    if (strengths.length < 3) {
        if (metrics.answeredCount === qaAnalyses.length) {
            strengths.push(`Completed all interview questions, showing commitment and engagement.`);
        }
        if (metrics.avgWordCount >= 50) {
            strengths.push(`Provided detailed responses, demonstrating thoroughness.`);
        }
        if (strengths.length < 3) {
            strengths.push(`Maintained professional attitude throughout the interview.`);
        }
    }
    
    return strengths.slice(0, 6); // Max 6 detailed strengths
}

// Generate detailed improvements with actionable recommendations
function identifyImprovementsDetailed(
    qaAnalyses: any[],
    metrics: any,
    role: string,
    level: string,
    techStack: string[]
): string[] {
    const improvements: string[] = [];
    
    // Technical Depth Improvements
    if (metrics.avgTechnicalDepth < 60) {
        const missingTerms = techStack.slice(0, 2).join(' and ');
        improvements.push(
            `Strengthen technical knowledge in ${role} domain. Focus on deepening understanding of ${missingTerms}. Only ${metrics.totalTechnicalTerms} technical concepts were mentioned - aim to demonstrate more comprehensive knowledge with specific examples and use cases.`
        );
    } else if (metrics.avgTechnicalDepth < 70) {
        improvements.push(
            `Enhance technical depth by providing more detailed explanations. Include specific implementation details, best practices, and real-world scenarios when discussing ${techStack[0]} concepts.`
        );
    }
    
    // Communication Improvements
    if (metrics.avgClarity < 65) {
        improvements.push(
            `Improve communication clarity and structure. ${metrics.totalFillerWords > 5 ? `Reduce filler words (${metrics.totalFillerWords} detected) by practicing responses and speaking with more confidence.` : 'Work on organizing thoughts before responding.'} Aim for clear, concise sentences averaging 15-25 words.`
        );
    } else if (metrics.totalFillerWords > 8) {
        improvements.push(
            `Reduce hesitation markers. ${metrics.totalFillerWords} filler words detected (um, uh, like, etc.). Practice answering technical questions to build confidence and fluency.`
        );
    }
    
    // Answer Completeness
    if (metrics.avgCompleteness < 60) {
        improvements.push(
            `Provide more comprehensive answers. Current responses averaged ${metrics.avgWordCount} words. Expand answers to include: (1) Direct answer, (2) Technical explanation, (3) Real-world example, (4) Best practices or considerations.`
        );
    } else if (metrics.avgWordCount < 40) {
        improvements.push(
            `Elaborate more on answers. Brief responses (avg ${metrics.avgWordCount} words) may not fully demonstrate knowledge. Provide examples and explain reasoning behind technical decisions.`
        );
    }
    
    // Relevance Improvements
    if (metrics.avgRelevance < 70) {
        improvements.push(
            `Focus more directly on the question asked. Current relevance is ${metrics.avgRelevance}%. Listen carefully to the question, identify key points, and structure your answer to address each aspect specifically.`
        );
    }
    
    // Practical Examples
    const totalExamples = qaAnalyses.reduce((sum, qa) => sum + (qa.exampleCount || 0), 0);
    if (totalExamples < 2) {
        improvements.push(
            `Include more practical examples and real-world scenarios. ${totalExamples === 0 ? 'No examples were provided' : 'Only one example was given'}. Demonstrating hands-on experience strengthens technical credibility.`
        );
    }
    
    // Level-Specific Improvements
    if (level === 'Senior' && metrics.avgTechnicalDepth < 75) {
        improvements.push(
            `For a Senior ${role} position, demonstrate deeper architectural thinking, leadership experience, and advanced problem-solving. Discuss system design, scalability, and mentoring experiences.`
        );
    } else if (level === 'Junior' && metrics.avgClarity < 60) {
        improvements.push(
            `Build confidence in technical communication. Practice explaining concepts clearly and concisely. It's okay to take a moment to organize thoughts before responding.`
        );
    }
    
    // Weak Areas
    const weakAnswers = qaAnalyses
        .filter(qa => qa.technicalDepthScore < 50)
        .slice(0, 2);
    
    if (weakAnswers.length > 0) {
        const topics = weakAnswers.map(qa => 
            extractMainTopic(qa.question)
        ).filter(t => t).join(' and ');
        
        if (topics) {
            improvements.push(
                `Review and strengthen knowledge in ${topics}. These areas showed limited technical depth. Study core concepts, best practices, and common use cases.`
            );
        }
    }
    
    // Ensure at least 3 improvements
    if (improvements.length < 3) {
        improvements.push(`Continue practicing interview skills and technical communication.`);
        improvements.push(`Stay updated with latest ${techStack[0]} developments and best practices.`);
        if (improvements.length < 3) {
            improvements.push(`Build a portfolio of projects to demonstrate practical experience.`);
        }
    }
    
    return improvements.slice(0, 6); // Max 6 detailed improvements
}

// Generate question-by-question breakdown
function generateQuestionBreakdown(qaAnalyses: any[]): any[] {
    return qaAnalyses.map(qa => ({
        questionNumber: qa.questionNumber,
        question: qa.question.substring(0, 100) + (qa.question.length > 100 ? '...' : ''),
        scores: {
            relevance: qa.relevanceScore,
            technicalDepth: qa.technicalDepthScore,
            clarity: qa.clarityScore,
            completeness: qa.completenessScore
        },
        wordCount: qa.wordCount,
        technicalTermsUsed: qa.technicalTerms.length,
        hasExamples: qa.exampleCount > 0,
        overallPerformance: calculateQuestionPerformance(qa)
    }));
}

// Calculate performance for individual question
function calculateQuestionPerformance(qa: any): string {
    const avgScore = (qa.relevanceScore + qa.technicalDepthScore + qa.clarityScore + qa.completenessScore) / 4;
    
    if (avgScore >= 80) return 'Excellent';
    if (avgScore >= 70) return 'Good';
    if (avgScore >= 60) return 'Satisfactory';
    if (avgScore >= 50) return 'Needs Improvement';
    return 'Poor';
}

// Generate technical assessment aligned with role
function generateTechnicalAssessment(
    qaAnalyses: any[],
    metrics: any,
    role: string,
    techStack: string[]
): string {
    let assessment = `\n**Technical Assessment for ${role} Position**\n\n`;
    
    // Tech Stack Coverage
    const mentionedStack = techStack.filter(tech => 
        qaAnalyses.some(qa => 
            qa.technicalTerms.some((term: string) => 
                term.toLowerCase().includes(tech.toLowerCase()) || 
                tech.toLowerCase().includes(term.toLowerCase())
            )
        )
    );
    
    assessment += `**Technology Stack Coverage:** ${mentionedStack.length}/${techStack.length} technologies discussed\n`;
    assessment += `- Covered: ${mentionedStack.join(', ') || 'None'}\n`;
    if (mentionedStack.length < techStack.length) {
        const missing = techStack.filter(t => !mentionedStack.includes(t));
        assessment += `- Not covered: ${missing.join(', ')}\n`;
    }
    assessment += `\n`;
    
    // Technical Depth Analysis
    assessment += `**Technical Depth:** ${metrics.avgTechnicalDepth}/100\n`;
    if (metrics.avgTechnicalDepth >= 75) {
        assessment += `Demonstrated strong technical expertise with comprehensive understanding of core concepts. Used ${metrics.totalTechnicalTerms} technical terms effectively.\n`;
    } else if (metrics.avgTechnicalDepth >= 60) {
        assessment += `Showed good technical foundation with ${metrics.totalTechnicalTerms} technical concepts mentioned. Could benefit from deeper exploration of advanced topics.\n`;
    } else {
        assessment += `Limited technical depth observed. Only ${metrics.totalTechnicalTerms} technical terms identified. Needs to demonstrate stronger grasp of fundamental concepts.\n`;
    }
    assessment += `\n`;
    
    // Problem-Solving Ability
    assessment += `**Problem-Solving & Analytical Skills:** ${metrics.avgCompleteness}/100\n`;
    if (metrics.avgCompleteness >= 70) {
        assessment += `Strong analytical approach. Answers were comprehensive and well-reasoned.\n`;
    } else if (metrics.avgCompleteness >= 55) {
        assessment += `Adequate problem-solving demonstrated. Could provide more detailed solutions.\n`;
    } else {
        assessment += `Problem-solving skills need development. Answers lacked depth and completeness.\n`;
    }
    assessment += `\n`;
    
    // Practical Experience
    const totalExamples = qaAnalyses.reduce((sum, qa) => sum + (qa.exampleCount || 0), 0);
    assessment += `**Practical Experience:** ${totalExamples > 0 ? 'Demonstrated' : 'Not Demonstrated'}\n`;
    if (totalExamples >= 3) {
        assessment += `Provided ${totalExamples} real-world examples, indicating hands-on experience.\n`;
    } else if (totalExamples > 0) {
        assessment += `Mentioned ${totalExamples} example(s). Should provide more practical scenarios.\n`;
    } else {
        assessment += `No practical examples provided. Unable to assess hands-on experience.\n`;
    }
    
    return assessment;
}

// Generate comprehensive final assessment
function generateComprehensiveFinalAssessment(
    _qaAnalyses: any[],
    metrics: any,
    interview: any,
    answeredCount: number,
    technicalAssessment: string
): string {
    const totalQuestions = interview.questions?.length || 0;
    const completionRate = (answeredCount / Math.max(totalQuestions, 1)) * 100;
    const role = interview.role || 'the position';
    const level = interview.level || '';
    
    let assessment = `**COMPREHENSIVE INTERVIEW EVALUATION REPORT**\n\n`;
    assessment += `**Position:** ${level} ${role}\n`;
    assessment += `**Technology Stack:** ${interview.techstack?.join(', ') || 'Not specified'}\n`;
    assessment += `**Interview Completion:** ${answeredCount}/${totalQuestions} questions (${Math.round(completionRate)}%)\n\n`;
    
    assessment += `---\n\n`;
    
    // Executive Summary
    const avgScore = Math.round(
        (metrics.avgTechnicalDepth + metrics.avgClarity + 
         metrics.avgCompleteness + calculateConfidenceScore(metrics)) / 4
    );
    
    assessment += `**EXECUTIVE SUMMARY**\n\n`;
    
    if (answeredCount === 0) {
        assessment += `The candidate did not provide any responses during the interview. Unable to assess technical skills, communication abilities, or suitability for the ${role} position.\n\n`;
        assessment += `**Recommendation:** Cannot proceed without interview responses.\n`;
        return assessment;
    }
    
    if (answeredCount < totalQuestions) {
        assessment += `The candidate completed ${Math.round(completionRate)}% of the interview. `;
    } else {
        assessment += `The candidate completed the full interview. `;
    }
    
    // Overall Performance
    if (avgScore >= 80) {
        assessment += `Demonstrated **excellent performance** across all evaluation criteria with an overall score of ${avgScore}/100. `;
    } else if (avgScore >= 70) {
        assessment += `Showed **strong performance** with good technical knowledge and communication skills, scoring ${avgScore}/100 overall. `;
    } else if (avgScore >= 60) {
        assessment += `Displayed **adequate performance** with room for improvement, achieving ${avgScore}/100. `;
    } else if (avgScore >= 50) {
        assessment += `Showed **basic understanding** but needs significant improvement, scoring ${avgScore}/100. `;
    } else {
        assessment += `Performance was **below expectations** with a score of ${avgScore}/100. Requires substantial development. `;
    }
    
    assessment += `\n\n---\n\n`;
    
    // Technical Assessment Section
    assessment += technicalAssessment;
    assessment += `\n---\n\n`;
    
    // Communication Assessment
    assessment += `**COMMUNICATION & PRESENTATION**\n\n`;
    assessment += `**Clarity Score:** ${metrics.avgClarity}/100\n`;
    assessment += `**Average Response Length:** ${metrics.avgWordCount} words\n`;
    assessment += `**Filler Words:** ${metrics.totalFillerWords}\n\n`;
    
    if (metrics.avgClarity >= 75) {
        assessment += `Communication was clear, professional, and well-structured. `;
    } else if (metrics.avgClarity >= 60) {
        assessment += `Communication was generally clear with some areas for improvement. `;
    } else {
        assessment += `Communication needs significant improvement. `;
    }
    
    if (metrics.totalFillerWords === 0) {
        assessment += `No hesitation markers detected, indicating high confidence.\n`;
    } else if (metrics.totalFillerWords <= 3) {
        assessment += `Minimal hesitation with only ${metrics.totalFillerWords} filler words.\n`;
    } else {
        assessment += `${metrics.totalFillerWords} filler words detected, suggesting some uncertainty or lack of preparation.\n`;
    }
    
    assessment += `\n---\n\n`;
    
    // Final Recommendation
    assessment += `**FINAL ASSESSMENT**\n\n`;
    
    if (avgScore >= 75) {
        assessment += `The candidate demonstrates strong qualifications for the ${level} ${role} position. Technical knowledge is solid, communication is effective, and problem-solving abilities are evident. **Recommended for next round** of interviews or technical assessment.\n`;
    } else if (avgScore >= 65) {
        assessment += `The candidate shows promise for the ${level} ${role} position with good foundational knowledge. **Consider for next round** with focus on identified improvement areas. May benefit from additional technical screening.\n`;
    } else if (avgScore >= 55) {
        assessment += `The candidate has basic qualifications but significant gaps exist. **Proceed with caution.** Recommend additional evaluation or consider for a more junior role with mentorship.\n`;
    } else {
        assessment += `The candidate does not currently meet the requirements for the ${level} ${role} position. **Not recommended** for next round. Suggest the candidate gain more experience and reapply in the future.\n`;
    }
    
    return assessment;
}

// Generate hiring recommendation
function generateHiringRecommendation(
    totalScore: number,
    _categoryScores: any[],
    level: string,
    _metrics: any
): {
    decision: string;
    confidence: string;
    reasoning: string;
    nextSteps: string[];
} {
    let decision = '';
    let confidence = '';
    let reasoning = '';
    const nextSteps: string[] = [];
    
    // Determine decision
    if (totalScore >= 80) {
        decision = 'Strong Hire';
        confidence = 'High';
        reasoning = `Candidate exceeded expectations with ${totalScore}/100 overall score. Demonstrated strong technical knowledge, excellent communication, and solid problem-solving abilities. All key competencies met or exceeded requirements.`;
        nextSteps.push('Schedule technical deep-dive interview');
        nextSteps.push('Conduct team fit assessment');
        nextSteps.push('Prepare offer discussion');
    } else if (totalScore >= 70) {
        decision = 'Hire';
        confidence = 'Medium-High';
        reasoning = `Candidate performed well with ${totalScore}/100 score. Shows good technical foundation and communication skills. Minor gaps can be addressed through onboarding and mentorship.`;
        nextSteps.push('Conduct follow-up technical interview');
        nextSteps.push('Assess cultural fit');
        nextSteps.push('Check references');
    } else if (totalScore >= 60) {
        decision = 'Maybe';
        confidence = 'Medium';
        reasoning = `Candidate shows potential with ${totalScore}/100 score but has notable gaps. Technical knowledge is adequate but needs strengthening. Consider for junior role or with extended probation period.`;
        nextSteps.push('Additional technical assessment required');
        nextSteps.push('Evaluate for alternative role levels');
        nextSteps.push('Discuss growth plan if hired');
    } else if (totalScore >= 50) {
        decision = 'Weak Hire';
        confidence = 'Low';
        reasoning = `Candidate scored ${totalScore}/100, below expectations. Significant gaps in technical knowledge and communication. High risk hire requiring substantial training investment.`;
        nextSteps.push('Consider rejection');
        nextSteps.push('If proceeding, require extensive technical training plan');
        nextSteps.push('Assign senior mentor if hired');
    } else {
        decision = 'No Hire';
        confidence = 'High';
        reasoning = `Candidate scored ${totalScore}/100, well below requirements. Does not meet minimum qualifications for ${level} position. Recommend gaining more experience before reapplying.`;
        nextSteps.push('Send rejection with constructive feedback');
        nextSteps.push('Suggest areas for improvement');
        nextSteps.push('Encourage reapplication after 6-12 months');
    }
    
    return { decision, confidence, reasoning, nextSteps };
}

// Helper: Extract main topic from question
function extractMainTopic(question: string): string {
    const lowerQ = question.toLowerCase();
    
    // Common technical topics
    const topics = [
        'state management', 'component', 'api', 'database', 'testing',
        'performance', 'security', 'authentication', 'deployment', 'architecture',
        'optimization', 'caching', 'scaling', 'design pattern', 'algorithm',
        'data structure', 'async', 'promise', 'hook', 'lifecycle'
    ];
    
    for (const topic of topics) {
        if (lowerQ.includes(topic)) {
            return topic;
        }
    }
    
    // Extract first significant noun phrase
    const words = question.split(' ').filter(w => w.length > 4);
    return words[0] || 'technical concepts';
}

// Helper: Get top technical terms used
function getTopTechnicalTerms(qaAnalyses: any[], count: number): string[] {
    const termFrequency: { [key: string]: number } = {};
    
    qaAnalyses.forEach(qa => {
        qa.technicalTerms.forEach((term: string) => {
            termFrequency[term] = (termFrequency[term] || 0) + 1;
        });
    });
    
    return Object.entries(termFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, count)
        .map(([term]) => term);
}
