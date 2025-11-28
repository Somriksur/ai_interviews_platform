import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/actions/auth.action";

/**
 * Custom Fine-Tuned Model for Question Generation
 * 
 * Uses: somriksur/HireFlow-Qwen (Custom fine-tuned Qwen2.5-1.5B model)
 * Trained on 5,270 interview questions across 56 job roles
 * 
 * NO FALLBACK - Only uses the custom trained model
 */

// Hugging Face Model Configuration
const HF_MODEL = process.env.HUGGINGFACE_CUSTOM_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
const HF_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL; // For custom deployed endpoints

interface QuestionGenerationParams {
    role: string;
    level: string;
    techstack: string[];
    type: string;
    amount: number;
}

async function generateQuestionsWithHF(params: QuestionGenerationParams): Promise<string[]> {
    const { role, level, techstack, type, amount } = params;
    
    // ONLY USE PROXY - NO FALLBACK
    if (!HF_ENDPOINT) {
        throw new Error("HUGGINGFACE_ENDPOINT_URL not configured. Proxy is required!");
    }
    
    // Ultra-simple prompt for small model
    const techList = techstack.slice(0, amount);
    
    const prompt = `<|im_start|>system
You are an expert technical interviewer.<|im_end|>
<|im_start|>user
Generate ${amount} ${type} questions for ${level} ${role}: ${techList.join(", ")}<|im_end|>
<|im_start|>assistant
[`;

    // Use more tokens to ensure complete generation
    const maxTokens = Math.max(amount * 60, 400); // 60 tokens per question, minimum 400

    try {
        console.log("🌐 Using YOUR CUSTOM MODEL: somriksur/HireFlow-Qwen-Fast (0.5B)");
        console.log("📡 Via proxy:", HF_ENDPOINT);
            
            const response = await fetch(`${HF_ENDPOINT}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: maxTokens
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Proxy Error:", errorText);
                throw new Error(`Proxy failed: ${response.status}`);
            }

            const data = await response.json();
            console.log("✅ Response from YOUR CUSTOM MODEL");

            // Extract generated text
            let generatedText = "";
            if (Array.isArray(data) && data[0]?.generated_text) {
                generatedText = data[0].generated_text;
            } else if (data.generated_text) {
                generatedText = data.generated_text;
            } else {
                throw new Error("Unexpected response format");
            }

            console.log("📝 Generated:", generatedText.substring(0, 300));

            let extractedQuestions: string[] = [];
            
            // Try to parse as JSON (handle both simple arrays and nested structures)
            try {
                const jsonMatch = generatedText.match(/\[[\s\S]*?\]/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    
                    if (Array.isArray(parsed)) {
                        // Handle simple string array: ["q1", "q2"]
                        if (parsed.every(item => typeof item === 'string')) {
                            extractedQuestions = parsed.filter(q => q.length > 15);
                            console.log(`✅ Parsed ${extractedQuestions.length} questions from simple JSON array`);
                        }
                        // Handle nested structures: [{questions: ["q1"]}, {question: "q2"}]
                        else {
                            for (const item of parsed) {
                                if (typeof item === 'object') {
                                    // Extract from "questions" array
                                    if (Array.isArray(item.questions)) {
                                        extractedQuestions.push(...item.questions.filter((q: any) => typeof q === 'string' && q.length > 15));
                                    }
                                    // Extract from "question" string
                                    if (typeof item.question === 'string' && item.question.length > 15) {
                                        extractedQuestions.push(item.question);
                                    }
                                }
                            }
                            console.log(`✅ Parsed ${extractedQuestions.length} questions from nested JSON`);
                        }
                    }
                }
            } catch (e) {
                console.log("Not valid JSON format, trying regex extraction...");
            }
            
            // If JSON parsing failed, extract questions using regex patterns
            if (extractedQuestions.length === 0) {
                console.log("Extracting questions with regex...");
                
                // Pattern 1: "question": "text"
                const questionPattern = /"question":\s*"([^"]+)"/g;
                let match;
                while ((match = questionPattern.exec(generatedText)) !== null) {
                    if (match[1] && match[1].length > 15) {
                        extractedQuestions.push(match[1]);
                    }
                }
                
                // Pattern 2: Simple quoted strings that look like questions
                if (extractedQuestions.length === 0) {
                    const quotedPattern = /"([^"]{20,}[?])"/g;
                    while ((match = quotedPattern.exec(generatedText)) !== null) {
                        if (match[1]) {
                            extractedQuestions.push(match[1]);
                        }
                    }
                }
                
                if (extractedQuestions.length > 0) {
                    console.log(`✅ Extracted ${extractedQuestions.length} questions using regex`);
                }
            }
            
            // If JSON parsing failed, try numbered list format
            if (extractedQuestions.length === 0) {
                console.log("Trying numbered list format...");
                const lines = generatedText.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    
                    // Match lines starting with numbers like "1.", "2.", "3." or "[1]." etc.
                    const match = trimmed.match(/^[\[\d+\]\.]+\s*(.+)/);
                    if (match && match[1]) {
                        let question = match[1].trim();
                        
                        // Remove extra dots and prefixes
                        question = question.replace(/^[\.\s]+/, '').trim();
                        question = question.replace(/^\[.*?\]\s*/g, '').trim();
                        
                        // Only add if it looks like a real question
                        if (question.length > 15 && question.includes(' ')) {
                            extractedQuestions.push(question);
                        }
                    }
                }
            }
            
            // If still no questions, try finding lines with question marks
            if (extractedQuestions.length === 0) {
                console.log("Trying question mark detection...");
                const lines = generatedText.split('\n');
                
                for (const line of lines) {
                    const trimmed = line.trim();
                    
                    if (trimmed.includes('?') && trimmed.length > 15) {
                        // Remove any leading numbers, bullets, and prefixes
                        let cleaned = trimmed.replace(/^[\d\-\*\.]+\s*/, '').trim();
                        cleaned = cleaned.replace(/^\[.*?\]\s*/g, '').trim();
                        
                        if (cleaned.length > 15 && cleaned.includes(' ')) {
                            extractedQuestions.push(cleaned);
                        }
                    }
                }
            }

            if (extractedQuestions.length === 0) {
                throw new Error("Could not extract any questions from model response. Please try again.");
            }

            const questions = extractedQuestions.slice(0, amount);

            console.log(`✅ Generated ${questions.length} questions from YOUR CUSTOM MODEL: somriksur/HireFlow-Qwen-Fast`);
            return questions;

    } catch (error) {
        console.error("HF API Error:", error);
        throw error;
    }
}

// NO FALLBACK - Only use custom model

export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const user = await getCurrentUser();
        if (!user || user.role !== "recruiter") {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { role, level, techstack, type, amount } = body;

        // Validate input
        if (!role || !level || !techstack || !type || !amount) {
            return NextResponse.json(
                { success: false, error: "Missing required fields" },
                { status: 400 }
            );
        }

        const params: QuestionGenerationParams = {
            role,
            level,
            techstack: Array.isArray(techstack) ? techstack : techstack.split(",").map((t: string) => t.trim()),
            type,
            amount: parseInt(amount.toString()),
        };

        console.log("📝 Generating questions with CUSTOM MODEL:", params);

        // ONLY use custom model - NO FALLBACK
        const questions = await generateQuestionsWithHF(params);

        return NextResponse.json({
            success: true,
            questions,
            source: "custom-model-proxy",
            model: "somriksur/HireFlow-Qwen-Fast",
        });

    } catch (error) {
        console.error("Error generating questions:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : "Failed to generate questions" 
            },
            { status: 500 }
        );
    }
}
