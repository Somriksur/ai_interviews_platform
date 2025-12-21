import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/debug-space
 * Comprehensive Space debugging with multiple strategies
 */
export async function POST(request: NextRequest) {
  try {
    const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
    
    if (!SPACE_ENDPOINT) {
      return NextResponse.json({
        error: "HUGGINGFACE_ENDPOINT_URL not configured"
      }, { status: 500 });
    }

    console.log("🔍 Starting comprehensive Space debugging...");
    console.log("🌐 Space URL:", SPACE_ENDPOINT);

    const debugResults = {
      spaceUrl: SPACE_ENDPOINT,
      timestamp: new Date().toISOString(),
      tests: []
    };

    // Test 1: Basic connectivity
    console.log("🧪 Test 1: Basic Space connectivity");
    try {
      const connectResponse = await fetch(SPACE_ENDPOINT, { method: 'GET' });
      debugResults.tests.push({
        name: "Basic Connectivity",
        status: connectResponse.ok ? "PASS" : "FAIL",
        statusCode: connectResponse.status,
        details: `Space ${connectResponse.ok ? 'is accessible' : 'returned error'}`
      });
    } catch (error) {
      debugResults.tests.push({
        name: "Basic Connectivity",
        status: "FAIL",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Try different API endpoints
    const endpoints = [
      '/gradio_api/call/generate_interface',
      '/api/predict',
      '/run/predict',
      '/call/generate_interface'
    ];

    for (const endpoint of endpoints) {
      console.log(`🧪 Testing endpoint: ${endpoint}`);
      try {
        const testResponse = await fetch(`${SPACE_ENDPOINT}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: ["Hello", 50, 0.5]
          })
        });

        const responseText = await testResponse.text();
        
        debugResults.tests.push({
          name: `Endpoint ${endpoint}`,
          status: testResponse.ok ? "PASS" : "FAIL",
          statusCode: testResponse.status,
          responseLength: responseText.length,
          hasEventId: responseText.includes('event_id'),
          responsePreview: responseText.substring(0, 200)
        });

        // If this endpoint works, try to get a result
        if (testResponse.ok && responseText.includes('event_id')) {
          try {
            const eventData = JSON.parse(responseText);
            if (eventData.event_id) {
              console.log(`✅ Got event_id from ${endpoint}: ${eventData.event_id}`);
              
              // Wait and try to get result
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              const resultResponse = await fetch(`${SPACE_ENDPOINT}${endpoint}/${eventData.event_id}`);
              const resultText = await resultResponse.text();
              
              debugResults.tests.push({
                name: `Result from ${endpoint}`,
                status: resultResponse.ok ? "PASS" : "FAIL",
                statusCode: resultResponse.status,
                resultLength: resultText.length,
                hasError: resultText.includes('event: error'),
                hasData: resultText.includes('data:') && !resultText.includes('data: null'),
                resultPreview: resultText.substring(0, 300)
              });
            }
          } catch (parseError) {
            debugResults.tests.push({
              name: `Parse ${endpoint} response`,
              status: "FAIL",
              error: parseError instanceof Error ? parseError.message : 'Parse error'
            });
          }
        }
      } catch (error) {
        debugResults.tests.push({
          name: `Endpoint ${endpoint}`,
          status: "FAIL",
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Test 3: Try minimal prompt
    console.log("🧪 Test 3: Minimal prompt test");
    try {
      const minimalResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: ["Hi", 10, 0.1]
        })
      });

      if (minimalResponse.ok) {
        const minimalData = await minimalResponse.json();
        if (minimalData.event_id) {
          // Wait longer for minimal test
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const minimalResult = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${minimalData.event_id}`);
          const minimalText = await minimalResult.text();
          
          debugResults.tests.push({
            name: "Minimal Prompt Test",
            status: minimalResult.ok ? "PASS" : "FAIL",
            eventId: minimalData.event_id,
            resultLength: minimalText.length,
            hasError: minimalText.includes('event: error'),
            hasValidData: minimalText.includes('data:') && !minimalText.includes('data: null'),
            fullResult: minimalText
          });
        }
      }
    } catch (error) {
      debugResults.tests.push({
        name: "Minimal Prompt Test",
        status: "FAIL",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Analyze results
    const passedTests = debugResults.tests.filter(t => t.status === "PASS").length;
    const totalTests = debugResults.tests.length;
    
    debugResults.summary = {
      passedTests,
      totalTests,
      successRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      recommendations: []
    };

    // Generate recommendations
    const hasConnectivity = debugResults.tests.some(t => t.name === "Basic Connectivity" && t.status === "PASS");
    const hasWorkingEndpoint = debugResults.tests.some(t => t.name.includes("Endpoint") && t.status === "PASS");
    const hasValidResults = debugResults.tests.some(t => t.hasValidData === true);

    if (!hasConnectivity) {
      debugResults.summary.recommendations.push("❌ Space is not accessible - check if it's running");
    } else if (!hasWorkingEndpoint) {
      debugResults.summary.recommendations.push("❌ No API endpoints are working - check Gradio version/configuration");
    } else if (!hasValidResults) {
      debugResults.summary.recommendations.push("❌ Model is not generating valid responses - check model loading/memory");
    } else {
      debugResults.summary.recommendations.push("✅ Space appears to be working - issue might be with specific prompts");
    }

    // Additional recommendations based on common issues
    if (debugResults.tests.some(t => t.hasError === true)) {
      debugResults.summary.recommendations.push("⚠️ Model is returning errors - check Space logs for memory/timeout issues");
    }

    if (debugResults.tests.some(t => t.responseLength && t.responseLength < 50)) {
      debugResults.summary.recommendations.push("⚠️ Very short responses - model might not be loading properly");
    }

    return NextResponse.json({
      success: true,
      debug: debugResults
    });

  } catch (error) {
    console.error("❌ Debug error:", error);
    return NextResponse.json({
      error: "Debug failed",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/debug-space
 * Quick Space status check
 */
export async function GET() {
  const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;
  
  if (!SPACE_ENDPOINT) {
    return NextResponse.json({
      status: "ERROR",
      message: "HUGGINGFACE_ENDPOINT_URL not configured"
    }, { status: 500 });
  }

  try {
    const response = await fetch(SPACE_ENDPOINT, { 
      method: 'GET',
      timeout: 10000 
    });
    
    return NextResponse.json({
      status: response.ok ? "ONLINE" : "ERROR",
      statusCode: response.status,
      spaceUrl: SPACE_ENDPOINT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "OFFLINE",
      error: error instanceof Error ? error.message : 'Unknown error',
      spaceUrl: SPACE_ENDPOINT,
      timestamp: new Date().toISOString()
    });
  }
}