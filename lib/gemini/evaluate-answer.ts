/**
 * Groq AI Answer Evaluation (FAST & FREE!)
 * Uses Groq's Llama 3.1 70B model for answer correctness evaluation
 * Note: File named "gemini" for backward compatibility, but uses Groq API
 */

export interface AnswerEvaluation {
    correctnessScore: number; // 0-100: How correct is the answer?
    relevanceScore: number; // 0-100: How relevant to the question?
    technicalAccuracyScore: number; // 0-100: Technical accuracy
    completenessScore: number; // 0-100: Did they cover all aspects?
    overallScore: number; // 0-100: Overall answer quality
    feedback: string; // Detailed feedback on the answer
    isCorrect: boolean; // Is the answer fundamentally correct?
    keyPointsCovered: string[]; // Key points mentioned
    keyPointsMissed: string[]; // Important points not mentioned
}

export async function evaluateAnswerWithGroq(
    question: string,
    answer: string,
    role: string,
    level: string,
    techStack: string[]
): Promise<AnswerEvaluation> {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
        console.warn('⚠️ Groq API key not configured, using fallback evaluation');
        return fallbackEvaluation(question, answer);
    }

    try {
        const prompt = `You are an expert technical interviewer evaluating a candidate's answer for a ${level} ${role} position.

**Question Asked:**
${question}

**Candidate's Answer:**
${answer}

**Role Context:** ${level} ${role}
**Tech Stack:** ${techStack.join(', ')}

**Your Task:**
Evaluate this answer as a strict technical interviewer would. Consider:
1. **Correctness**: Is the answer factually correct? Are there any errors or misconceptions?
2. **Relevance**: Does the answer directly address what was asked?
3. **Technical Accuracy**: Are technical concepts explained correctly?
4. **Completeness**: Does it cover the key aspects of the question?
5. **Depth**: Is the explanation appropriate for a ${level} level candidate?

**IMPORTANT RULES:**
- If the answer is completely wrong or irrelevant, give 0-20 scores
- If the answer is partially correct but has major gaps, give 30-50 scores
- If the answer is mostly correct with minor issues, give 60-80 scores
- Only give 80-100 for excellent, comprehensive, accurate answers
- If the answer is just a few words or doesn't address the question, give very low scores (0-15)
- Empty or nonsensical answers should get 0

Respond in this EXACT JSON format (no markdown, no code blocks):
{
  "correctnessScore": <number 0-100>,
  "relevanceScore": <number 0-100>,
  "technicalAccuracyScore": <number 0-100>,
  "completenessScore": <number 0-100>,
  "overallScore": <number 0-100>,
  "feedback": "<detailed feedback string>",
  "isCorrect": <true or false>,
  "keyPointsCovered": ["<point1>", "<point2>"],
  "keyPointsMissed": ["<point1>", "<point2>"]
}`;

        const response = await fetch(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.1-70b-versatile', // Fast and accurate
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an expert technical interviewer. Respond only with valid JSON, no markdown formatting.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1000,
                    response_format: { type: 'json_object' }
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API error:', response.status, errorText);
            return fallbackEvaluation(question, answer);
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            console.error('No text generated from Groq');
            return fallbackEvaluation(question, answer);
        }

        // Parse JSON response (handle markdown code blocks if present)
        let jsonText = generatedText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const evaluation = JSON.parse(jsonText) as AnswerEvaluation;
        
        // Validate scores are in range
        evaluation.correctnessScore = Math.max(0, Math.min(100, evaluation.correctnessScore));
        evaluation.relevanceScore = Math.max(0, Math.min(100, evaluation.relevanceScore));
        evaluation.technicalAccuracyScore = Math.max(0, Math.min(100, evaluation.technicalAccuracyScore));
        evaluation.completenessScore = Math.max(0, Math.min(100, evaluation.completenessScore));
        evaluation.overallScore = Math.max(0, Math.min(100, evaluation.overallScore));

        return evaluation;

    } catch (error) {
        console.error('Error evaluating answer with Groq:', error);
        return fallbackEvaluation(question, answer);
    }
}

// Legacy function name for backward compatibility
export const evaluateAnswerWithGemini = evaluateAnswerWithGroq;

// Fallback evaluation when Gemini is not available
function fallbackEvaluation(_question: string, answer: string): AnswerEvaluation {
    const wordCount = answer.trim().split(/\s+/).length;
    
    // Very basic evaluation
    let score = 0;
    if (wordCount >= 50) score = 50;
    else if (wordCount >= 30) score = 35;
    else if (wordCount >= 15) score = 20;
    else if (wordCount >= 5) score = 10;
    
    return {
        correctnessScore: score,
        relevanceScore: score,
        technicalAccuracyScore: score,
        completenessScore: score,
        overallScore: score,
        feedback: 'Answer evaluation requires Groq API configuration.',
        isCorrect: wordCount >= 30,
        keyPointsCovered: [],
        keyPointsMissed: ['Unable to evaluate without AI']
    };
}
