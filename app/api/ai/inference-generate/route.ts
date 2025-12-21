import { NextRequest, NextResponse } from "next/server";
import { generateDynamicTechStack } from "@/lib/services/tech-stack.service";

/**
 * POST /api/ai/inference-generate
 * Generate questions using Hugging Face Inference API directly (more reliable than Space)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, techstack, amount, useDynamicTechStack = true } = body;

    // Validate required fields
    if (!role || !level || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: role, level, type, amount" },
        { status: 400 }
      );
    }

    // Generate dynamic tech stack if needed
    let finalTechStack: string[] = [];
    
    if (useDynamicTechStack || !techstack || (Array.isArray(techstack) && techstack.length === 0)) {
      const dynamicTechs = generateDynamicTechStack(role, level, Math.min(amount, 5));
      finalTechStack = dynamicTechs;
      console.log("✨ Generated dynamic tech stack:", finalTechStack);
    } else {
      finalTechStack = Array.isArray(techstack) ? techstack : [techstack];
    }

    const QWEN_MODEL_ID = process.env.QWEN_MODEL_ID || "somriksur/HireFlow-Qwen-Improved";
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!HF_API_KEY) {
      return NextResponse.json(
        { error: "HUGGINGFACE_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("🤖 Using Inference API for model:", QWEN_MODEL_ID);

    // Create optimized prompt for your model
    const techStackStr = finalTechStack.join(", ");
    const prompt = `Generate ${amount} interview questions for a ${level} ${role} position.

FOCUS ON: ${techStackStr}

Requirements:
- Experience Level: ${level}
- Interview Type: ${type}
- Technologies: ${techStackStr}
- Generate exactly ${amount} questions
- Number each question (1., 2., 3., etc.)
- End each question with ?

Generate ${amount} ${type} interview questions:`;

    console.log("📝 Calling Inference API...");

    // Call Hugging Face Inference API
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${QWEN_MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Inference API error:", errorText);
      
      // Check if model is loading
      if (response.status === 503) {
        return NextResponse.json({
          error: "Model is currently loading. Please wait a few minutes and try again.",
          suggestion: "Your custom model is being loaded by Hugging Face. This can take 1-2 minutes for the first request.",
          retryAfter: 120
        }, { status: 503 });
      }
      
      return NextResponse.json({
        error: "Failed to call Inference API",
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log("✅ Inference API response received");

    // Handle different response formats
    let generatedText = '';
    
    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0].generated_text || result[0].text || '';
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else if (typeof result === 'string') {
      generatedText = result;
    }

    if (!generatedText) {
      console.error("❌ No generated text from Inference API:", result);
      return NextResponse.json({
        error: "Model did not generate any text",
        rawResponse: result
      }, { status: 500 });
    }

    console.log("🤖 Generated text:", generatedText.substring(0, 300) + "...");

    // Parse questions from generated text
    const questions = parseQuestions(generatedText, amount);

    if (questions.length === 0) {
      return NextResponse.json({
        error: "Failed to parse questions from model output",
        generatedText: generatedText.substring(0, 500)
      }, { status: 500 });
    }

    console.log(`✅ Successfully generated ${questions.length} questions`);

    return NextResponse.json({
      questions,
      metadata: {
        model: QWEN_MODEL_ID,
        method: "Inference API",
        generatedAt: new Date().toISOString(),
        techStack: finalTechStack,
        isDynamicTechStack: useDynamicTechStack || !techstack,
        role,
        level,
        type,
        generatedText: generatedText.substring(0, 300) + "..."
      }
    });

  } catch (error) {
    console.error("❌ Inference generation error:", error);
    return NextResponse.json({
      error: "Failed to generate questions",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Parse questions from model output
 */
function parseQuestions(text: string, expectedAmount: number): string[] {
  const questions: string[] = [];
  
  // Split by lines and look for numbered questions
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    if (questions.length >= expectedAmount) break;
    
    // Look for numbered questions (1., 2., etc.)
    const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)/);
    if (numberedMatch) {
      let question = numberedMatch[1].trim();
      
      // Ensure question ends with ?
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      // Check if it's a valid question
      if (question.length > 10) {
        questions.push(question);
        console.log(`   ✅ Parsed question ${questions.length}: ${question.substring(0, 60)}...`);
      }
    }
  }
  
  // If we didn't get enough from numbered format, try other patterns
  if (questions.length < expectedAmount) {
    const questionParts = text.split('?').map(part => part.trim()).filter(part => part.length > 10);
    
    for (const part of questionParts) {
      if (questions.length >= expectedAmount) break;
      
      const cleanPart = part
        .replace(/^\d+[\.\)]\s*/, '') // Remove numbering
        .replace(/^[-\*\•]\s*/, '') // Remove bullets
        .trim();
      
      if (cleanPart.length > 10) {
        const question = cleanPart + '?';
        if (!questions.includes(question)) {
          questions.push(question);
        }
      }
    }
  }
  
  return questions.slice(0, expectedAmount);
}