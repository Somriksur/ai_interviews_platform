import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/ai/health-check
 * Check if your Hugging Face Space is awake and responding
 */
export async function GET(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        status: "error",
        message: "HUGGINGFACE_ENDPOINT_URL not configured",
        spaceUrl: null
      }, { status: 500 });
    }

    console.log("🔍 Checking Space health:", SPACE_ENDPOINT);

    // Try to access the Space root endpoint
    const healthResponse = await fetch(SPACE_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'HireFlow-HealthCheck/1.0'
      }
    });

    const isSpaceAccessible = healthResponse.ok;
    const responseTime = Date.now();

    if (!isSpaceAccessible) {
      return NextResponse.json({
        status: "space_inaccessible",
        message: "Your Hugging Face Space is not accessible. It might be sleeping or there's an error.",
        spaceUrl: SPACE_ENDPOINT,
        httpStatus: healthResponse.status,
        suggestion: "Visit the Space URL to wake it up",
        troubleshooting: [
          "1. Visit " + SPACE_ENDPOINT + " in your browser",
          "2. Wait for the Space to load (1-2 minutes for cold start)",
          "3. Try the health check again"
        ]
      }, { status: 503 });
    }

    // Try a simple Gradio API call to test the interface
    try {
      const testResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            "Test prompt for health check",
            100,
            0.7
          ]
        })
      });

      const testData = await testResponse.json();
      const hasEventId = testData.event_id;

      return NextResponse.json({
        status: "healthy",
        message: "Your Hugging Face Space is awake and responding",
        spaceUrl: SPACE_ENDPOINT,
        spaceAccessible: true,
        gradioApiWorking: testResponse.ok,
        eventIdReceived: !!hasEventId,
        responseTime: `${Date.now() - responseTime}ms`,
        lastChecked: new Date().toISOString()
      });

    } catch (gradioError) {
      return NextResponse.json({
        status: "space_awake_gradio_error",
        message: "Space is accessible but Gradio API might have issues",
        spaceUrl: SPACE_ENDPOINT,
        spaceAccessible: true,
        gradioApiWorking: false,
        error: gradioError instanceof Error ? gradioError.message : 'Unknown Gradio error',
        suggestion: "Space is awake but the Gradio interface might need time to initialize"
      });
    }

  } catch (error) {
    console.error("❌ Health check error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to check Space health",
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceUrl: process.env.HUGGINGFACE_ENDPOINT_URL
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/health-check
 * Try to wake up the Space by making a test call
 */
export async function POST(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        status: "error",
        message: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    console.log("🚀 Attempting to wake up Space:", SPACE_ENDPOINT);

    // Make multiple requests to wake up the Space
    const wakeUpPromises = Array(3).fill(null).map(async (_, index) => {
      try {
        const response = await fetch(SPACE_ENDPOINT, {
          method: 'GET',
          headers: {
            'Accept': 'text/html',
            'User-Agent': `HireFlow-WakeUp/${index + 1}`
          }
        });
        return { success: response.ok, status: response.status, attempt: index + 1 };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error', attempt: index + 1 };
      }
    });

    const wakeUpResults = await Promise.all(wakeUpPromises);
    const successfulAttempts = wakeUpResults.filter(result => result.success).length;

    // Wait a bit for the Space to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test the Gradio API
    try {
      const testResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            "Wake up test: Generate 1 question for a Junior Frontend Developer position focusing on JavaScript",
            200,
            0.7
          ]
        })
      });

      const testData = await testResponse.json();

      return NextResponse.json({
        status: "wake_up_attempted",
        message: `Wake up attempts completed. ${successfulAttempts}/3 successful.`,
        spaceUrl: SPACE_ENDPOINT,
        wakeUpResults,
        gradioApiTest: {
          success: testResponse.ok,
          eventId: testData.event_id || null,
          status: testResponse.status
        },
        nextSteps: [
          "Wait 1-2 minutes for the Space to fully initialize",
          "Try generating questions again",
          "If still failing, visit the Space URL manually"
        ]
      });

    } catch (gradioError) {
      return NextResponse.json({
        status: "wake_up_partial",
        message: "Space wake up attempted but Gradio API not ready yet",
        spaceUrl: SPACE_ENDPOINT,
        wakeUpResults,
        gradioError: gradioError instanceof Error ? gradioError.message : 'Unknown error',
        suggestion: "Wait a few more minutes and try again"
      });
    }

  } catch (error) {
    console.error("❌ Wake up error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to wake up Space",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}