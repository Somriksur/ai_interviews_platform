import { NextRequest, NextResponse } from "next/server";
import { generateDynamicTechStack } from "@/lib/services/tech-stack.service";

/**
 * POST /api/ai/generate-questions
 * Generate interview questions using ONLY the trained Qwen model
 * Primary: Hugging Face Inference API (more reliable)
 * Fallback: Hugging Face Space (if Inference API fails)
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
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;

    console.log("🤖 Using ONLY your custom model:", QWEN_MODEL_ID);

    // Create optimized prompt for upgraded Space (32GB RAM)
    const techStackStr = finalTechStack.join(", "); // Use all techs now
    const optimizedAmount = Math.min(amount, 10); // Increased to 10 questions max
    
    const prompt = `Generate ${optimizedAmount} comprehensive ${level} ${role} interview questions.

Technologies: ${techStackStr}
Question Type: ${type}
Experience Level: ${level}

Requirements:
- Create practical, real-world questions
- Include both theoretical and hands-on scenarios
- Vary difficulty appropriately for ${level} level
- Focus on problem-solving and critical thinking
- Make questions specific to the technologies mentioned

Generate exactly ${optimizedAmount} numbered questions:`;

    console.log("📝 Enhanced prompt for upgraded Space:", prompt.substring(0, 200) + "...");

    // Your model repository is missing model weights - use Inference API which works
    console.log("🔄 Using Inference API since model repository is incomplete...");
    
    if (!HF_API_KEY) {
      return NextResponse.json({
        error: "Your model repository is missing model weights (pytorch_model.bin). Use Inference API instead.",
        solution: "Add HUGGINGFACE_API_KEY to use your trained model via Inference API",
        modelIssue: "Repository only has tokenizer files, missing actual model weights"
      }, { status: 500 });
    }

    try {
      const response = await fetch(
        `https://router.huggingface.co/models/${QWEN_MODEL_ID}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              do_sample: true,
              return_full_text: false
            }
          })
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Your trained model working via Inference API");

        let generatedText = '';
        if (Array.isArray(result) && result.length > 0) {
          generatedText = result[0].generated_text || result[0].text || '';
        } else if (result.generated_text) {
          generatedText = result.generated_text;
        }

        if (generatedText) {
          console.log("🤖 Generated text from your trained model:", generatedText.substring(0, 300));
          const questions = parseQuestions(generatedText, optimizedAmount);

          if (questions.length > 0) {
            console.log(`✅ Successfully generated ${questions.length} questions from your trained model`);
            return NextResponse.json({
              questions,
              metadata: {
                model: QWEN_MODEL_ID,
                method: "Your Trained Model via Inference API",
                generatedAt: new Date().toISOString(),
                techStack: finalTechStack,
                isDynamicTechStack: useDynamicTechStack || !techstack,
                role,
                level,
                type,
                note: "Using your trained model via Inference API (Space repository incomplete)"
              }
            });
          }
        }
      } else if (response.status === 503) {
        return NextResponse.json({
          error: "Your trained model is loading on Hugging Face servers. Please wait 1-2 minutes and try again.",
          modelStatus: "loading",
          retryAfter: 120,
          note: "Your model works via Inference API, just needs to load"
        }, { status: 503 });
      }
    } catch (inferenceError) {
      console.log("⚠️ Inference API error:", inferenceError);
    }

    // Space won't work because model weights are missing
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "Your model repository is incomplete (missing model weights). Cannot use Space without proper model files.",
        solution: "Your trained model works via Inference API. Space needs complete model upload.",
        modelIssue: "Missing pytorch_model.bin or model.safetensors files"
      }, { status: 500 });
    }
    console.log("🚀 Space URL:", SPACE_ENDPOINT);

    // Call your Hugging Face Space using Gradio API with enhanced error handling
    console.log("🔄 Calling Gradio API with enhanced debugging...");
    
    // Try multiple API endpoint formats that work with different Gradio versions
    const possibleEndpoints = [
      `${SPACE_ENDPOINT}/gradio_api/call/generate_interface`,
      `${SPACE_ENDPOINT}/api/predict`,
      `${SPACE_ENDPOINT}/run/predict`
    ];
    
    let callResponse;
    let callData;
    let workingEndpoint;
    
    // Try each endpoint until one works
    for (const endpoint of possibleEndpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        callResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: [prompt, 500, 0.7] // Increased tokens and temperature for better quality
          })
        });
        
        if (callResponse.ok) {
          callData = await callResponse.json();
          workingEndpoint = endpoint;
          console.log(`✅ Working endpoint found: ${endpoint}`);
          break;
        } else {
          console.log(`❌ Endpoint failed: ${endpoint} (${callResponse.status})`);
        }
      } catch (endpointError) {
        console.log(`❌ Endpoint error: ${endpoint}`, endpointError);
        continue;
      }
    }

    if (!callResponse || !callResponse.ok) {
      const errorText = callResponse ? await callResponse.text() : 'No response';
      console.error("❌ All Gradio API endpoints failed:", errorText);
      return NextResponse.json(
        { 
          error: "Your custom model Space is not responding properly. The Gradio API endpoints are not accessible.",
          spaceUrl: SPACE_ENDPOINT,
          suggestion: "Your Space might be using a different Gradio version or API format.",
          troubleshooting: [
            "1. Visit " + SPACE_ENDPOINT + " in your browser",
            "2. Check if the Space interface loads correctly", 
            "3. Try generating a question manually in the Space",
            "4. Check your Space logs for any errors",
            "5. Ensure your Space is using a compatible Gradio version"
          ],
          spaceStatus: "api_endpoint_mismatch",
          testedEndpoints: possibleEndpoints
        },
        { status: 503 }
      );
    }
    const eventId = callData.event_id;

    if (!eventId) {
      console.error("❌ No event_id received from Gradio API");
      return NextResponse.json(
        { error: "Invalid response from custom model Space" },
        { status: 500 }
      );
    }

    console.log("✅ Got event_id:", eventId);
    console.log("🔄 Waiting for generation to complete...");

    // Poll for the result using Server-Sent Events with optimized timeout for upgraded Space
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 2 minutes for better quality
    
    let resultResponse;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Wait a bit before polling (optimized for upgraded Space)
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced wait time
        } else {
          await new Promise(resolve => setTimeout(resolve, 500)); // Faster initial poll
        }
        
        console.log(`🔄 Polling attempt ${retryCount + 1}/${maxRetries}...`);
        
        resultResponse = await fetch(`${workingEndpoint}/${eventId}`, {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
          },
          signal: controller.signal
        });
        
        if (resultResponse.ok) {
          break; // Success, exit retry loop
        } else {
          console.log(`⚠️ Polling attempt ${retryCount + 1} failed with status ${resultResponse.status}`);
          retryCount++;
        }
      } catch (pollError) {
        console.log(`⚠️ Polling attempt ${retryCount + 1} error:`, pollError);
        retryCount++;
        if (retryCount >= maxRetries) {
          clearTimeout(timeoutId);
          if (pollError.name === 'AbortError') {
            console.error("❌ Request timed out after 2 minutes");
            return NextResponse.json(
              { 
                error: "Request timed out after 2 minutes. Your upgraded Space should handle this - please check Space logs.",
                spaceUrl: SPACE_ENDPOINT,
                suggestion: "With 32GB RAM, your model should generate faster. Check Space status.",
                quickFix: "Try again - the upgraded Space should be much more reliable"
              },
              { status: 504 }
            );
          }
          throw pollError;
        }
      }
    }
    
    clearTimeout(timeoutId);

    if (!resultResponse || !resultResponse.ok) {
      console.error("❌ Failed to get result after", maxRetries, "attempts");
      return NextResponse.json(
        { error: "Failed to get response from custom model after multiple attempts" },
        { status: 500 }
      );
    }

    const resultText = await resultResponse.text();
    console.log("📝 Raw Space response length:", resultText.length);
    console.log("📝 Raw Space response preview:", resultText.substring(0, 500));

    // Parse the Server-Sent Events format with better error handling
    const lines = resultText.split('\n');
    let generatedText = '';
    let hasError = false;
    let errorMessage = '';
    let isProcessing = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('event: error')) {
        hasError = true;
        console.log("⚠️ Found error event in response");
        continue;
      }
      
      if (line.startsWith('event: generating')) {
        isProcessing = true;
        console.log("🔄 Model is generating...");
        continue;
      }
      
      if (line.startsWith('event: complete')) {
        console.log("✅ Generation completed");
        continue;
      }
      
      if (line.startsWith('data: ')) {
        try {
          const dataStr = line.substring(6);
          
          // Handle null data (common with errors)
          if (dataStr === 'null' || dataStr === '') {
            if (hasError) {
              errorMessage = 'Space returned null data - model might be overloaded or failed to generate';
              console.log("❌ Null data with error flag");
            }
            continue;
          }
          
          // Try different parsing strategies
          
          // Strategy 1: Simple array format: data: ["generated text here"]
          if (dataStr.startsWith('[') && dataStr.endsWith(']')) {
            try {
              const arrayData = JSON.parse(dataStr);
              if (Array.isArray(arrayData) && arrayData.length > 0 && typeof arrayData[0] === 'string' && arrayData[0].length > 10) {
                generatedText = arrayData[0];
                console.log("✅ Parsed response from simple array format");
                break;
              }
            } catch (arrayError) {
              console.log("⚠️ Could not parse array format:", dataStr.substring(0, 100));
            }
          }
          
          // Strategy 2: Complex JSON format
          if (dataStr.startsWith('{')) {
            try {
              const data = JSON.parse(dataStr);
              if (data.msg === 'process_completed' && data.output && data.output.data) {
                generatedText = data.output.data[0];
                console.log("✅ Parsed response from complex JSON format");
                break;
              }
            } catch (jsonError) {
              console.log("⚠️ Could not parse JSON format:", dataStr.substring(0, 100));
            }
          }
          
          // Strategy 3: Plain string (remove quotes if present)
          if (dataStr.length > 20 && !dataStr.includes('null') && !dataStr.startsWith('{') && !dataStr.startsWith('[')) {
            generatedText = dataStr.replace(/^"|"$/g, '');
            console.log("✅ Parsed response from plain string format");
            break;
          }
          
        } catch (parseError) {
          console.log("⚠️ Could not parse line:", line.substring(0, 100));
          continue;
        }
      }
    }
    
    // Enhanced error handling
    if (hasError && !generatedText) {
      console.error("❌ Space returned an error:", errorMessage || 'Unknown error');
      
      // Check if this is a common Space issue
      if (resultText.includes('event: error') && resultText.includes('data: null')) {
        return NextResponse.json(
          { 
            error: "Your 32GB Space model failed to load. After adding config.json, your Space should work perfectly.",
            spaceUrl: SPACE_ENDPOINT,
            suggestion: "Your model repository was missing config.json. After adding it, restart your Space.",
            troubleshooting: [
              "1. Confirm you added config.json to your model repository",
              "2. Wait 5-10 minutes for your Space to rebuild automatically", 
              "3. Check Space logs for '✅ Model loaded successfully with 32GB RAM optimization!'",
              "4. If still failing, restart your Space manually",
              "5. Your 32GB RAM is more than enough for your model"
            ],
            spaceStatus: "model_config_missing",
            quickFix: "Add config.json to your model repository and wait for Space rebuild",
            rawResponse: resultText.substring(0, 1000),
            paidUpgrade: "You're paying for 32GB RAM - this should work after config.json fix"
          },
          { status: 503 }
        );
      } else {
        return NextResponse.json(
          { 
            error: "Your Hugging Face Space encountered an error: " + (errorMessage || 'Unknown error'),
            spaceUrl: SPACE_ENDPOINT,
            suggestion: "Please check your Space configuration and try again.",
            rawResponse: resultText.substring(0, 500)
          },
          { status: 503 }
        );
      }
    }

    if (!generatedText) {
      console.error("❌ No generated text found in Space response");
      console.log("Response preview:", resultText.substring(0, 500));
      
      // Try a fallback approach with enhanced prompt for upgraded Space
      console.log("🔄 Attempting enhanced fallback for upgraded Space...");
      
      try {
        const enhancedPrompt = `Create ${Math.min(amount, 8)} detailed interview questions for ${role} position.

Focus areas: ${techStackStr}
Level: ${level}
Type: ${type}

Make each question:
- Practical and scenario-based
- Appropriate for ${level} level
- Technology-specific
- Problem-solving oriented

Questions:`;
        
        const fallbackResponse = await fetch(`${workingEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: [enhancedPrompt, 600, 0.8] // Higher quality settings for upgraded Space
          })
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.event_id) {
            // Wait for fallback result
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const fallbackResultResponse = await fetch(`${workingEndpoint}/${fallbackData.event_id}`);
            if (fallbackResultResponse.ok) {
              const fallbackResultText = await fallbackResultResponse.text();
              
              // Try to parse fallback result
              const fallbackLines = fallbackResultText.split('\n');
              for (const line of fallbackLines) {
                if (line.startsWith('data: ') && !line.includes('null')) {
                  const dataStr = line.substring(6);
                  if (dataStr.startsWith('[')) {
                    try {
                      const arrayData = JSON.parse(dataStr);
                      if (Array.isArray(arrayData) && arrayData[0] && arrayData[0].length > 10) {
                        generatedText = arrayData[0];
                        console.log("✅ Fallback successful!");
                        break;
                      }
                    } catch (e) {
                      // Continue trying
                    }
                  }
                }
              }
            }
          }
        }
      } catch (fallbackError) {
        console.log("⚠️ Fallback also failed:", fallbackError);
      }
      
      if (!generatedText) {
        return NextResponse.json(
          { 
            error: "No output received from your upgraded Space. This is unexpected with 32GB RAM.",
            spaceUrl: SPACE_ENDPOINT,
            suggestion: "Your upgraded Space should generate content reliably. This might be a configuration issue.",
            troubleshooting: [
              "1. Verify your Space is using 'CPU Upgrade (8 vCPU • 32GB RAM)' in settings",
              "2. Visit " + SPACE_ENDPOINT + " and test manually with a simple prompt",
              "3. Check if your model loads successfully in the Space interface",
              "4. Verify your Gradio app.py file is correctly configured for the upgraded hardware",
              "5. Restart your Space to ensure upgrade is active"
            ],
            quickFix: "Confirm Space upgrade is active and test manually first",
            rawResponse: resultText.substring(0, 1000)
          },
          { status: 500 }
        );
      }
    }

    console.log("🤖 Generated text from your model:", generatedText.substring(0, 500) + "...");

    // Parse questions from your model's generated text
    const questions = parseQuestions(generatedText, amount);

    if (questions.length === 0) {
      console.error("❌ No questions parsed from model response:", generatedText);
      return NextResponse.json(
        { error: "Failed to parse questions from custom model response" },
        { status: 500 }
      );
    }

    console.log(`✅ Generated ${questions.length} questions from your custom model`);

    return NextResponse.json({
      questions,
      metadata: {
        model: QWEN_MODEL_ID,
        spaceEndpoint: SPACE_ENDPOINT,
        generatedAt: new Date().toISOString(),
        prompt: prompt.substring(0, 200) + "...",
        modelResponse: generatedText.substring(0, 300) + "...",
        techStack: finalTechStack,
        isDynamicTechStack: useDynamicTechStack || !techstack || (Array.isArray(techstack) && techstack.length === 0),
        role,
        level,
        type
      },
    });
  } catch (error) {
    console.error("❌ Error calling custom model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parse questions from your custom model's generated text
 * Handles various formats and cleans up the output
 */
function parseQuestions(text: string, expectedAmount: number): string[] {
  console.log("🔍 Parsing questions from your custom model output:", text.substring(0, 500));
  
  const questions: string[] = [];
  
  // Placeholder patterns to filter out
  const placeholderPatterns = [
    /\[question text here\]/i,
    /\[.*?\]/,
    /placeholder/i,
    /example/i,
    /sample/i
  ];
  
  // Helper to check if text is a placeholder
  const isPlaceholder = (text: string): boolean => {
    return placeholderPatterns.some(pattern => pattern.test(text));
  };
  
  // Split by lines first - this is more reliable for numbered questions
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
      
      // Ensure question ends with ?
      if (!question.endsWith('?')) {
        question += '?';
      }
      
      // Check if it's a valid question
      if (question.length > 10 && !isPlaceholder(question)) {
        // Remove any duplicate questions
        const normalizedQuestion = question.toLowerCase().trim();
        const isDuplicate = questions.some(q => q.toLowerCase().trim() === normalizedQuestion);
        
        if (!isDuplicate) {
          questions.push(question);
          console.log(`   ✅ Added question ${questions.length}: ${question.substring(0, 60)}...`);
        } else {
          console.log(`   ⚠️ Skipped duplicate: ${question.substring(0, 60)}...`);
        }
      }
    }
  }
  
  // If we still don't have enough, try parsing by question marks as fallback
  if (questions.length < expectedAmount) {
    console.log("⚠️ Not enough questions from line parsing, trying question mark split...");
    
    const questionParts = text.split('?').map(part => part.trim()).filter(part => part.length > 10);
    
    for (const part of questionParts) {
      if (questions.length >= expectedAmount) break;
      
      // Clean up the part - remove numbering, bullets, system/user tags
      const cleanPart = part
        .replace(/^(system|user|assistant)\s*/i, '') // Remove role tags
        .replace(/^\d+[\.\)]\s*/, '') // Remove "1." or "1)"
        .replace(/^[-\*\•]\s*/, '') // Remove bullets
        .replace(/^Question\s*\d+:?\s*/i, '') // Remove "Question 1:"
        .trim();
      
      // Skip if it's a placeholder or too short
      if (isPlaceholder(cleanPart) || cleanPart.length < 10) {
        continue;
      }
      
      const finalQuestion = cleanPart + '?';
      const normalizedQuestion = finalQuestion.toLowerCase().trim();
      const isDuplicate = questions.some(q => q.toLowerCase().trim() === normalizedQuestion);
      
      if (!isDuplicate) {
        questions.push(finalQuestion);
        console.log(`   ✅ Added fallback question ${questions.length}: ${finalQuestion.substring(0, 60)}...`);
      }
    }
  }
  
  console.log(`✅ Parsed ${questions.length} questions from your custom model (expected ${expectedAmount})`);
  questions.forEach((q, i) => console.log(`   ${i + 1}. ${q.substring(0, 80)}...`));
  
  // If we still don't have enough valid questions, log a warning
  if (questions.length < expectedAmount) {
    console.warn(`⚠️ Your custom model generated ${questions.length} valid questions out of ${expectedAmount} requested`);
  }
  
  // Return exactly the expected amount (or less if model couldn't generate enough)
  return questions.slice(0, expectedAmount);
}
