import { NextRequest, NextResponse } from "next/server";
import { generateDynamicTechStack } from "@/lib/services/tech-stack.service";

/**
 * POST /api/ai/inference-only
 * Use ONLY Hugging Face Inference API - no Space, no fallbacks
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, techstack, amount, useDynamicTechStack = true } = body;

    // Generate dynamic tech stack
    let finalTechStack: string[] = [];
    if (useDynamicTechStack || !techstack || (Array.isArray(techstack) && techstack.length === 0)) {
      const dynamicTechs = generateDynamicTechStack(role, level, Math.min(amount, 5));
      finalTechStack = dynamicTechs;
    } else {
      finalTechStack = Array.isArray(techstack) ? techstack : [techstack];
    }

    const QWEN_MODEL_ID = process.env.QWEN_MODEL_ID || "somriksur/HireFlow-Qwen-Improved";
    const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

    if (!HF_API_KEY) {
      return NextResponse.json({
        error: "HUGGINGFACE_API_KEY not configured. Add your Hugging Face API key to use your custom model.",
        instructions: [
          "1. Get API key from: https://huggingface.co/settings/tokens",
          "2. Add HUGGINGFACE_API_KEY to your .env.local",
          "3. Your custom model will work with Inference API"
        ]
      }, { status: 500 });
    }

    console.log("🤖 Using ONLY your custom model via Inference API:", QWEN_MODEL_ID);

    const techStackStr = finalTechStack.join(", ");
    const prompt = `Generate ${amount} interview questions for a ${level} ${role} position.

Focus on: ${techStackStr}
Type: ${type}
Level: ${level}

Generate exactly ${amount} numbered questions:`;

    console.log("📝 Calling Inference API...");

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
            max_new_tokens: 800,
            temperature: 0.7,
            do_sample: true,
            return_full_text: false
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 503) {
        return NextResponse.json({
          error: "Your custom model is loading on Hugging Face servers. Please wait 1-2 minutes and try again.",
          modelStatus: "loading",
          retryAfter: 120
        }, { status: 503 });
      }
      
      return NextResponse.json({
        error: "Failed to call your custom model via Inference API",
        details: errorText,
        status: response.status
      }, { status: response.status });
    }

    const result = await response.json();
    console.log("✅ Inference API response received");

    let generatedText = '';
    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0].generated_text || result[0].text || '';
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else if (typeof result === 'string') {
      generatedText = result;
    }

    if (!generatedText) {
      return NextResponse.json({
        error: "Your custom model did not generate any text. The model might be overloaded.",
        rawResponse: result,
        suggestion: "Try again in a few minutes or upgrade your Space for more reliable access."
      }, { status: 500 });
    }

    console.log("🤖 Generated text from your custom model:", generatedText.substring(0, 300));

    // Parse questions from your model's output
    const questions = parseQuestions(generatedText, amount);

    if (questions.length === 0) {
      return NextResponse.json({
        error: "Failed to parse questions from your custom model output",
        generatedText: generatedText.substring(0, 500),
        suggestion: "Your model generated text but it couldn't be parsed into questions."
      }, { status: 500 });
    }

    console.log(`✅ Successfully generated ${questions.length} questions from your custom model`);

    return NextResponse.json({
      questions,
      metadata: {
        model: QWEN_MODEL_ID,
        method: "Hugging Face Inference API",
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
    console.error("❌ Inference API error:", error);
    return NextResponse.json({
      error: "Failed to generate questions from your custom model",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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
      
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      if (question.length > 10) {
        questions.push(question);
      }
    }
  }
  
  // If not enough numbered questions, try other patterns
  if (questions.length < expectedAmount) {
    const questionParts = text.split('?').map(part => part.trim()).filter(part => part.length > 15);
    
    for (const part of questionParts) {
      if (questions.length >= expectedAmount) break;
      
      const cleanPart = part
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[-\*\•]\s*/, '')
        .replace(/^Question\s*\d+:?\s*/i, '')
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