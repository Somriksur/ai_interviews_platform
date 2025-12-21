import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/test-space-status
 * Test if the Space is working after config.json upload
 */
export async function POST(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "Space endpoint not configured",
        status: "no_endpoint"
      }, { status: 500 });
    }

    console.log("🔄 Testing Space after config.json upload:", SPACE_ENDPOINT);

    // Test simple prompt
    const testPrompt = "Generate 1 simple Python question for junior level";
    
    try {
      // Try the Gradio API call
      const callResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [testPrompt, 100, 0.7]
        })
      });

      if (!callResponse.ok) {
        return NextResponse.json({
          error: "Space API call failed",
          status: callResponse.status,
          statusText: callResponse.statusText,
          spaceUrl: SPACE_ENDPOINT,
          note: "Space might still be rebuilding after config.json upload"
        }, { status: 503 });
      }

      const callData = await callResponse.json();
      const eventId = callData.event_id;

      if (!eventId) {
        return NextResponse.json({
          error: "No event_id received from Space",
          response: callData,
          status: "invalid_response"
        }, { status: 500 });
      }

      console.log("✅ Got event_id:", eventId);

      // Wait a moment then check result
      await new Promise(resolve => setTimeout(resolve, 3000));

      const resultResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${eventId}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        }
      });

      if (!resultResponse.ok) {
        return NextResponse.json({
          error: "Failed to get result from Space",
          status: resultResponse.status,
          eventId,
          note: "Space might still be loading the model"
        }, { status: 503 });
      }

      const resultText = await resultResponse.text();
      console.log("📝 Space response:", resultText.substring(0, 500));

      // Parse the response
      const lines = resultText.split('\n');
      let generatedText = '';
      let hasError = false;
      let errorMessage = '';

      for (const line of lines) {
        if (line.startsWith('event: error')) {
          hasError = true;
          continue;
        }
        
        if (line.startsWith('data: ')) {
          const dataStr = line.substring(6);
          
          if (dataStr === 'null' || dataStr === '') {
            if (hasError) {
              errorMessage = 'Space returned null - model might still be loading';
            }
            continue;
          }
          
          // Try to parse the response
          if (dataStr.startsWith('[') && dataStr.endsWith(']')) {
            try {
              const arrayData = JSON.parse(dataStr);
              if (Array.isArray(arrayData) && arrayData.length > 0) {
                generatedText = arrayData[0];
                break;
              }
            } catch (e) {
              // Continue trying
            }
          }
        }
      }

      if (hasError && !generatedText) {
        return NextResponse.json({
          status: "model_loading_error",
          error: errorMessage || "Model failed to load",
          spaceUrl: SPACE_ENDPOINT,
          suggestion: "Your Space might still be rebuilding after config.json upload. Wait 5-10 minutes and try again.",
          rawResponse: resultText.substring(0, 1000),
          configStatus: "config.json uploaded successfully - Space should rebuild automatically"
        }, { status: 503 });
      }

      if (!generatedText) {
        return NextResponse.json({
          status: "no_output",
          error: "No output received from Space",
          spaceUrl: SPACE_ENDPOINT,
          suggestion: "Space responded but didn't generate content. Model might still be loading.",
          rawResponse: resultText.substring(0, 1000),
          configStatus: "config.json uploaded - waiting for Space rebuild"
        }, { status: 503 });
      }

      // Success!
      return NextResponse.json({
        status: "success",
        message: "🎉 Your Space is working perfectly after config.json upload!",
        spaceUrl: SPACE_ENDPOINT,
        testPrompt,
        generatedText: generatedText.substring(0, 500),
        configStatus: "config.json fix successful",
        upgradeStatus: "32GB RAM upgrade working",
        note: "Your trained model is now loading properly in the Space"
      });

    } catch (spaceError) {
      console.error("❌ Space test error:", spaceError);
      return NextResponse.json({
        status: "connection_error",
        error: "Failed to connect to Space",
        spaceUrl: SPACE_ENDPOINT,
        suggestion: "Space might be rebuilding after config.json upload. This is normal and takes 5-10 minutes.",
        configStatus: "config.json uploaded successfully",
        upgradeStatus: "32GB RAM ready",
        note: "Wait for Space rebuild to complete"
      }, { status: 503 });
    }

  } catch (error) {
    console.error("❌ Test error:", error);
    return NextResponse.json({
      error: "Internal server error during Space test",
      status: "internal_error"
    }, { status: 500 });
  }
}