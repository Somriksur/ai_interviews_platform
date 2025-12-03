import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/generate-questions
 * Generate interview questions using custom Qwen model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, techstack, amount } = body;

    // Validate required fields
    if (!role || !level || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: role, level, type, amount" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 1 || amount > 20) {
      return NextResponse.json(
        { error: "Amount must be between 1 and 20" },
        { status: 400 }
      );
    }

    const HUGGINGFACE_ENDPOINT_URL = process.env.HUGGINGFACE_ENDPOINT_URL;
    const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    const QWEN_MODEL_ID = process.env.QWEN_MODEL_ID || "somriksur/HireFlow-Qwen-Fast";

    // Check if using local proxy or HuggingFace API
    const useLocalProxy = HUGGINGFACE_ENDPOINT_URL && HUGGINGFACE_ENDPOINT_URL.includes('localhost');
    
    if (!useLocalProxy && !HUGGINGFACE_API_KEY) {
      console.error("HUGGINGFACE_API_KEY not found and no local proxy configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    // Prepare the prompt for Qwen model
    const techStackStr = Array.isArray(techstack) ? techstack.join(", ") : "";
    const prompt = `You are an expert technical interviewer. Generate exactly ${amount} interview questions for a ${level} level ${role} position.

Job Details:
- Role: ${role}
- Level: ${level}
- Interview Type: ${type}
- Tech Stack: ${techStackStr}

IMPORTANT INSTRUCTIONS:
- Generate EXACTLY ${amount} questions, no more, no less
- Each question MUST end with a question mark (?)
- Number each question clearly (1., 2., 3., etc.)
- Each question on a separate line
- Questions should be relevant to ${level} level and ${techStackStr}
- Mix technical and behavioral questions
- Make questions specific and clear
- Avoid yes/no questions
- DO NOT include placeholder text or examples

Generate ${amount} interview questions now:`;

    console.log("🤖 Calling Qwen model for question generation...");
    console.log("📝 Prompt:", prompt.substring(0, 200) + "...");

    // Determine endpoint URL
    let apiUrl: string;
    let headers: Record<string, string>;

    if (useLocalProxy && HUGGINGFACE_ENDPOINT_URL) {
      // Use local proxy (no auth needed)
      apiUrl = `${HUGGINGFACE_ENDPOINT_URL}/generate`;
      headers = {
        "Content-Type": "application/json",
      };
      console.log("🔧 Using local proxy:", apiUrl);
    } else {
      // Use HuggingFace Inference API
      apiUrl = `https://api-inference.huggingface.co/models/${QWEN_MODEL_ID}`;
      headers = {
        "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      };
      console.log("☁️ Using HuggingFace API:", apiUrl);
    }

    // Call the API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Qwen model API error:", response.status, errorText);
      
      if (useLocalProxy) {
        return NextResponse.json(
          { 
            error: "Local Qwen proxy is not running. Please start the proxy server at http://localhost:8000",
            details: "Run: python gradio-proxy-v2.py"
          },
          { status: 503 }
        );
      }
      
      if (response.status === 503) {
        return NextResponse.json(
          { error: "Qwen model is loading. Please try again in a few minutes." },
          { status: 503 }
        );
      }
      
      if (response.status === 404) {
        return NextResponse.json(
          { 
            error: "Qwen model not found. Please check your QWEN_MODEL_ID configuration.",
            modelId: QWEN_MODEL_ID
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to generate questions with Qwen model. Please try again." },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log("✅ Qwen model response received");

    // Extract generated text
    let generatedText = "";
    if (Array.isArray(result) && result.length > 0) {
      generatedText = result[0].generated_text || "";
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else {
      console.error("❌ Unexpected response format:", result);
      return NextResponse.json(
        { error: "Invalid response from AI model" },
        { status: 500 }
      );
    }

    // Parse questions from generated text
    const questions = parseQuestions(generatedText, amount);

    if (questions.length === 0) {
      console.error("❌ No questions parsed from response:", generatedText);
      return NextResponse.json(
        { error: "Failed to parse questions from AI response" },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${questions.length} questions successfully`);

    return NextResponse.json({
      questions,
      metadata: {
        model: QWEN_MODEL_ID,
        generatedAt: new Date().toISOString(),
        prompt: prompt.substring(0, 200) + "...", // First 200 chars for debugging
      },
    });
  } catch (error) {
    console.error("❌ Error in generate-questions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parse questions from generated text
 * Handles various formats and cleans up the output
 */
function parseQuestions(text: string, expectedAmount: number): string[] {
  console.log("🔍 Parsing questions from text:", text.substring(0, 500));
  
  const questions: string[] = [];
  
  // Placeholder patterns to filter out
  const placeholderPatterns = [
    /\[question text here\]/i,
    /\[.*?\]/,
    /example/i,
    /placeholder/i,
  ];
  
  // Helper to check if text is a placeholder
  const isPlaceholder = (text: string): boolean => {
    return placeholderPatterns.some(pattern => pattern.test(text));
  };
  
  // First, try to split by question marks to find all questions
  const questionParts = text.split('?').map(part => part.trim()).filter(part => part.length > 10);
  
  for (const part of questionParts) {
    if (questions.length >= expectedAmount) break;
    
    // Clean up the part - remove numbering, bullets, system/user tags
    let cleanPart = part
      .replace(/^(system|user|assistant)\s*/i, '') // Remove role tags
      .replace(/^\d+[\.\)]\s*/, '') // Remove "1." or "1)"
      .replace(/^[-\*\•]\s*/, '') // Remove bullets
      .replace(/^Question\s*\d+:?\s*/i, '') // Remove "Question 1:"
      .trim();
    
    // Skip if it's a placeholder or too short
    if (isPlaceholder(cleanPart) || cleanPart.length < 20) {
      continue;
    }
    
    // If it looks like a question, add it
    if (!cleanPart.includes('\n\n')) {
      // Take only the last sentence if there are multiple
      const sentences = cleanPart.split(/[.!]\s+/);
      const lastSentence = sentences[sentences.length - 1].trim();
      
      if (lastSentence.length > 20 && !isPlaceholder(lastSentence)) {
        const finalQuestion = lastSentence + '?';
        if (!questions.includes(finalQuestion)) {
          questions.push(finalQuestion);
        }
      }
    }
  }
  
  // If we still don't have enough, try line-by-line parsing
  if (questions.length < expectedAmount) {
    console.log("⚠️ Not enough questions from split, trying line-by-line...");
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      if (questions.length >= expectedAmount) break;
      
      // Skip system/user/assistant tags and placeholders
      if (/^(system|user|assistant)/i.test(line) || isPlaceholder(line)) {
        continue;
      }
      
      // Look for numbered questions (1., 2., etc.)
      const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)/);
      if (numberedMatch) {
        let question = numberedMatch[1].trim();
        if (!question.endsWith('?')) question += '?';
        if (question.length > 20 && !isPlaceholder(question) && !questions.includes(question)) {
          questions.push(question);
          continue;
        }
      }
      
      // Look for lines that end with ?
      if (line.endsWith('?') && line.length > 20) {
        const cleanQuestion = line.replace(/^[\d\-\*\•\)\.]+\s*/, '').trim();
        if (cleanQuestion.length > 20 && !isPlaceholder(cleanQuestion) && !questions.includes(cleanQuestion)) {
          questions.push(cleanQuestion);
        }
      }
    }
  }
  
  console.log(`✅ Parsed ${questions.length} questions (expected ${expectedAmount})`);
  questions.forEach((q, i) => console.log(`   ${i + 1}. ${q.substring(0, 80)}...`));
  
  // If we still don't have enough valid questions, log a warning
  if (questions.length < expectedAmount) {
    console.warn(`⚠️ Only found ${questions.length} valid questions out of ${expectedAmount} requested`);
  }
  
  // Return exactly the expected amount (or less if we couldn't parse enough)
  return questions.slice(0, expectedAmount);
}
