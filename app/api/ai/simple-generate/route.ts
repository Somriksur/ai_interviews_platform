import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/simple-generate
 * Simplified question generation that works better with Space limitations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, techstack, amount = 3 } = body;

    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    // Create a much simpler, shorter prompt that's more likely to work
    const techList = Array.isArray(techstack) ? techstack.slice(0, 2).join(", ") : techstack;
    const simplePrompt = `Generate ${Math.min(amount, 3)} ${level} ${role} interview questions about ${techList}:`;
    
    console.log("🧪 Simple prompt:", simplePrompt);

    // Try the basic Gradio API call with minimal parameters
    const response = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          simplePrompt,
          200,  // Much smaller token limit
          0.3   // Lower temperature for more deterministic output
        ]
      })
    });

    if (!response.ok) {
      return NextResponse.json({
        error: "Space API call failed",
        status: response.status
      }, { status: 503 });
    }

    const responseData = await response.json();
    console.log("📝 Response data:", responseData);

    if (!responseData.event_id) {
      return NextResponse.json({
        error: "No event_id received from Space",
        responseData
      }, { status: 500 });
    }

    // Wait for the model to process with progressive polling
    console.log("⏳ Starting progressive polling...");
    
    let resultResponse;
    let resultText = '';
    const maxAttempts = 6;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const waitTime = Math.min(2000 * attempt, 10000); // Progressive wait: 2s, 4s, 6s, 8s, 10s, 10s
      console.log(`⏳ Attempt ${attempt}/${maxAttempts} - waiting ${waitTime}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      try {
        resultResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${responseData.event_id}`);
        
        if (resultResponse.ok) {
          resultText = await resultResponse.text();
          console.log(`📝 Attempt ${attempt} - Raw result length:`, resultText.length);
          
          // Check if we have meaningful content (not just error)
          if (resultText.length > 50 && !resultText.includes('data: null')) {
            console.log("✅ Got meaningful response, breaking polling loop");
            break;
          }
        }
        
        if (attempt === maxAttempts) {
          console.log("❌ Max attempts reached, using last response");
        }
      } catch (pollError) {
        console.log(`⚠️ Polling attempt ${attempt} failed:`, pollError);
        if (attempt === maxAttempts) {
          throw pollError;
        }
      }
    }
    
    if (!resultResponse || !resultResponse.ok) {
      return NextResponse.json({
        error: "Failed to get result from Space after multiple attempts",
        attempts: maxAttempts
      }, { status: 500 });
    }

    console.log("📝 Final raw result:", resultText.substring(0, 200));

    // Parse the result with multiple strategies
    let generatedText = '';
    const lines = resultText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('null') && !line.includes('error')) {
        const dataStr = line.substring(6).trim();
        
        // Try different parsing approaches
        if (dataStr.startsWith('[') && dataStr.endsWith(']')) {
          try {
            const arrayData = JSON.parse(dataStr);
            if (Array.isArray(arrayData) && arrayData[0] && typeof arrayData[0] === 'string' && arrayData[0].length > 5) {
              generatedText = arrayData[0];
              break;
            }
          } catch (e) {
            // Continue
          }
        } else if (dataStr.length > 10 && !dataStr.startsWith('{')) {
          // Plain text
          generatedText = dataStr.replace(/^"|"$/g, '');
          break;
        }
      }
    }

    if (!generatedText) {
      // If still no result, try to extract any meaningful text from the response
      const meaningfulLines = lines.filter(line => 
        line.length > 20 && 
        !line.includes('event:') && 
        !line.includes('data: null') &&
        !line.includes('error')
      );
      
      if (meaningfulLines.length > 0) {
        generatedText = meaningfulLines[0];
      }
    }

    if (!generatedText) {
      return NextResponse.json({
        error: "Model failed to generate content",
        suggestion: "Your Space model might be overloaded or incompatible",
        rawResponse: resultText.substring(0, 500),
        troubleshooting: [
          "1. Visit your Space URL and test manually with a simple prompt",
          "2. Check if your model works with shorter prompts",
          "3. Try restarting your Space",
          "4. Consider using a smaller model or different configuration"
        ]
      }, { status: 500 });
    }

    // Parse questions from the generated text
    const questions = parseSimpleQuestions(generatedText, amount);

    return NextResponse.json({
      success: true,
      questions,
      generatedText: generatedText.substring(0, 500),
      metadata: {
        model: "Custom Qwen (Simplified)",
        prompt: simplePrompt,
        generatedAt: new Date().toISOString(),
        techStack: techList,
        role,
        level
      }
    });

  } catch (error) {
    console.error("❌ Simple generation error:", error);
    return NextResponse.json({
      error: "Failed to generate questions",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Simple question parser that's more forgiving
 */
function parseSimpleQuestions(text: string, expectedAmount: number): string[] {
  const questions: string[] = [];
  
  // Split by common question indicators
  const possibleQuestions = text.split(/[.!?]\s+/)
    .concat(text.split(/\n+/))
    .concat(text.split(/\d+[\.\)]\s*/));
  
  for (const part of possibleQuestions) {
    if (questions.length >= expectedAmount) break;
    
    const cleaned = part.trim()
      .replace(/^(Question\s*\d*:?\s*)/i, '')
      .replace(/^\d+[\.\)]\s*/, '')
      .replace(/^[-\*]\s*/, '');
    
    if (cleaned.length > 15 && 
        (cleaned.includes('?') || cleaned.toLowerCase().includes('what') || 
         cleaned.toLowerCase().includes('how') || cleaned.toLowerCase().includes('explain'))) {
      
      let question = cleaned;
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      // Avoid duplicates
      if (!questions.some(q => q.toLowerCase().includes(question.toLowerCase().substring(0, 20)))) {
        questions.push(question);
      }
    }
  }
  
  // If we still don't have enough, create basic fallback questions
  while (questions.length < Math.min(expectedAmount, 2)) {
    const fallbackQuestions = [
      "What is your experience with the mentioned technologies?",
      "How would you approach solving a complex problem in this domain?",
      "Can you explain a challenging project you've worked on?"
    ];
    
    const fallback = fallbackQuestions[questions.length];
    if (fallback && !questions.includes(fallback)) {
      questions.push(fallback);
    } else {
      break;
    }
  }
  
  return questions.slice(0, expectedAmount);
}