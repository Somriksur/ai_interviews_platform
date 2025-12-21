import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/test-free-tier
 * Test your optimized Space with minimal prompt
 */
export async function POST(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    console.log("🧪 Testing optimized Space with minimal prompt...");

    // Very simple prompt optimized for free tier
    const testPrompt = "Generate 2 React interview questions:";
    
    console.log("📝 Test prompt:", testPrompt);

    // Call Space with optimized parameters
    const callResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [testPrompt, 100, 0.6] // Short prompt, low tokens, low temperature
      })
    });

    if (!callResponse.ok) {
      return NextResponse.json({
        error: "Space API call failed",
        status: callResponse.status,
        suggestion: "Your Space might not be running or needs optimization"
      }, { status: 503 });
    }

    const callData = await callResponse.json();
    const eventId = callData.event_id;

    if (!eventId) {
      return NextResponse.json({
        error: "No event_id received",
        response: callData
      }, { status: 500 });
    }

    console.log("✅ Got event_id:", eventId);
    console.log("⏳ Waiting for free tier model (this may take 15-30 seconds)...");

    // Wait longer for free tier (model loading is slow)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Poll for result with extended timeout for free tier
    let resultResponse;
    let attempts = 0;
    const maxAttempts = 8; // More attempts for free tier

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}...`);
      
      try {
        resultResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${eventId}`);
        
        if (resultResponse.ok) {
          const resultText = await resultResponse.text();
          console.log(`📝 Attempt ${attempts} response length:`, resultText.length);
          
          // Check if we have actual content (not just error)
          if (resultText.length > 50 && !resultText.includes('data: null')) {
            console.log("✅ Got meaningful response!");
            
            // Try to parse the response
            const lines = resultText.split('\n');
            let generatedText = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('null')) {
                const dataStr = line.substring(6).trim();
                
                if (dataStr.startsWith('[') && dataStr.endsWith(']')) {
                  try {
                    const arrayData = JSON.parse(dataStr);
                    if (Array.isArray(arrayData) && arrayData[0] && arrayData[0].length > 10) {
                      generatedText = arrayData[0];
                      break;
                    }
                  } catch (e) {
                    // Continue trying
                  }
                }
              }
            }
            
            if (generatedText) {
              // Parse questions from generated text
              const questions = parseSimpleQuestions(generatedText);
              
              return NextResponse.json({
                success: true,
                message: "✅ Your optimized Space is working!",
                generatedText: generatedText.substring(0, 300),
                questions,
                metadata: {
                  attempts,
                  eventId,
                  spaceUrl: SPACE_ENDPOINT,
                  testPrompt,
                  responseLength: resultText.length
                }
              });
            } else {
              return NextResponse.json({
                success: false,
                message: "Space responded but no text was generated",
                rawResponse: resultText.substring(0, 500),
                suggestion: "Your model might need more optimization or the Space needs restart"
              });
            }
          }
        }
        
        // Wait before next attempt (progressive backoff)
        if (attempts < maxAttempts) {
          const waitTime = Math.min(3000 + (attempts * 1000), 8000);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
      } catch (pollError) {
        console.log(`⚠️ Polling error attempt ${attempts}:`, pollError);
        if (attempts === maxAttempts) {
          throw pollError;
        }
      }
    }

    return NextResponse.json({
      success: false,
      message: "Space is responding but model generation is failing",
      suggestion: "Your Space needs optimization. Follow the guide in docs/COMPLETE_FREE_SOLUTION.md",
      troubleshooting: [
        "1. Update your Space's app.py with the optimized code",
        "2. Add 8-bit quantization: load_in_8bit=True",
        "3. Reduce max_tokens to 150 or less",
        "4. Test manually in Space UI first",
        "5. Restart Space if needed"
      ],
      eventId,
      attempts
    });

  } catch (error) {
    console.error("❌ Free tier test error:", error);
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: "Follow the complete guide in docs/COMPLETE_FREE_SOLUTION.md"
    }, { status: 500 });
  }
}

function parseSimpleQuestions(text: string): string[] {
  const questions: string[] = [];
  
  // Split by lines and look for questions
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  for (const line of lines) {
    // Look for numbered questions or questions ending with ?
    if (line.match(/^\d+[\.\)]\s*/) || line.endsWith('?')) {
      let question = line.replace(/^\d+[\.\)]\s*/, '').trim();
      
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      if (question.length > 10) {
        questions.push(question);
      }
    }
  }
  
  // If no numbered questions, split by ? and take meaningful parts
  if (questions.length === 0) {
    const parts = text.split('?').map(part => part.trim()).filter(part => part.length > 15);
    for (const part of parts.slice(0, 3)) {
      questions.push(part + '?');
    }
  }
  
  return questions.slice(0, 3);
}