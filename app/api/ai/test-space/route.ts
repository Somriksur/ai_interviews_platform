import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/test-space
 * Simple test to debug your Hugging Face Space
 */
export async function POST(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    console.log("🧪 Testing Space:", SPACE_ENDPOINT);

    // Test 1: Check if Space is accessible
    console.log("🔍 Test 1: Checking Space accessibility...");
    const spaceResponse = await fetch(SPACE_ENDPOINT);
    console.log("Space response status:", spaceResponse.status);

    // Test 2: Try different Gradio API formats
    console.log("🔍 Test 2: Testing Gradio API call...");
    
    const testPrompt = "Generate 1 interview question for a Junior Frontend Developer position focusing on JavaScript";
    
    // Try the current format
    const gradioResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [testPrompt, 200, 0.7]
      })
    });

    console.log("Gradio API response status:", gradioResponse.status);
    const gradioData = await gradioResponse.json();
    console.log("Gradio API response data:", gradioData);

    if (gradioData.event_id) {
      console.log("✅ Got event_id:", gradioData.event_id);
      
      // Test 3: Try to get the result
      console.log("🔍 Test 3: Trying to get result...");
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const resultResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${gradioData.event_id}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
        }
      });

      console.log("Result response status:", resultResponse.status);
      const resultText = await resultResponse.text();
      console.log("Result response text:", resultText);

      return NextResponse.json({
        success: true,
        tests: {
          spaceAccessible: spaceResponse.ok,
          gradioApiWorking: gradioResponse.ok,
          eventIdReceived: !!gradioData.event_id,
          resultReceived: resultResponse.ok
        },
        details: {
          spaceStatus: spaceResponse.status,
          gradioStatus: gradioResponse.status,
          eventId: gradioData.event_id,
          resultStatus: resultResponse.status,
          resultPreview: resultText.substring(0, 500)
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No event_id received from Gradio API",
        gradioResponse: gradioData
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Space test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/test-space
 * Get Space information
 */
export async function GET() {
  const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
  
  return NextResponse.json({
    spaceUrl: SPACE_ENDPOINT,
    configured: !!SPACE_ENDPOINT,
    instructions: [
      "POST to this endpoint to test your Space",
      "Check the console logs for detailed debugging info",
      "Make sure your Space is running at: " + SPACE_ENDPOINT
    ]
  });
}