import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/security/auth-context";
import { requireRole } from "@/lib/security/guards";

/**
 * POST /api/ai/simple-test
 * Simple test with minimal prompt to debug your Space
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthContext(request);
    if (!authResult.ok) return authResult.response;

    const roleError = requireRole(authResult.context, ["organization", "college"]);
    if (roleError) return roleError;

    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    console.log("🧪 Simple Space test:", SPACE_ENDPOINT);

    // Ultra-simple test prompt
    const simplePrompt = "Generate 1 JavaScript question";
    
    // Try the most basic Gradio API call
    const response = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [simplePrompt, 100, 0.5]
      })
    });

    console.log("Response status:", response.status);
    const responseData = await response.json();
    console.log("Response data:", responseData);

    if (responseData.event_id) {
      // Wait and get result
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const resultResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${responseData.event_id}`);
      const resultText = await resultResponse.text();
      
      console.log("Result text:", resultText);
      
      return NextResponse.json({
        success: true,
        eventId: responseData.event_id,
        resultStatus: resultResponse.status,
        resultText: resultText,
        analysis: {
          hasEventId: !!responseData.event_id,
          resultReceived: resultResponse.ok,
          hasError: resultText.includes('event: error'),
          hasData: resultText.includes('data: ') && !resultText.includes('data: null')
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "No event_id received",
        responseData
      });
    }

  } catch (error) {
    console.error("Simple test error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
