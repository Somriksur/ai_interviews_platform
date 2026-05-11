import { NextRequest, NextResponse } from "next/server";
import { hybridQuestionGeneration } from "@/lib/services/hybrid-question-generation.service";

/**
 * Test endpoint for hybrid question generation
 * Tests both ML and fallback seamlessly
 */
export async function GET(request: NextRequest) {
  console.log('🧪 Testing Hybrid Question Generation Service');

  try {
    // Test 1: Check health status
    console.log('\n📊 Test 1: Health Status Check');
    const healthStatus = await hybridQuestionGeneration.getHealthStatus();
    console.log('Health Status:', healthStatus);

    // Test 2: Generate questions (will use ML or fallback automatically)
    console.log('\n📊 Test 2: Generate Questions (Automatic ML/Fallback)');
    const result = await hybridQuestionGeneration.generateQuestions({
      role: 'React Developer',
      level: 'Mid-level',
      type: 'Technical',
      amount: 5
    });

    console.log(`✅ Generated ${result.questions.length} questions`);
    console.log(`Source: ${result.source}`);
    console.log(`ML Available: ${result.mlAvailable}`);

    // Test 3: Force health check
    console.log('\n📊 Test 3: Force Health Check');
    const isHealthy = await hybridQuestionGeneration.forceHealthCheck();
    console.log(`ML Healthy: ${isHealthy}`);

    return NextResponse.json({
      success: true,
      message: 'Hybrid question generation test completed',
      results: {
        healthStatus,
        questionGeneration: {
          questionsCount: result.questions.length,
          questions: result.questions,
          source: result.source,
          mlAvailable: result.mlAvailable,
          metadata: result.metadata
        },
        healthCheck: {
          mlHealthy: isHealthy
        }
      }
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

/**
 * POST endpoint for custom test parameters
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, level, type, amount } = body;

    console.log('🧪 Testing with custom parameters:', { role, level, type, amount });

    const result = await hybridQuestionGeneration.generateQuestions({
      role: role || 'Software Engineer',
      level: level || 'Mid-level',
      type: type || 'Technical',
      amount: amount || 5
    });

    return NextResponse.json({
      success: true,
      questions: result.questions,
      source: result.source,
      mlAvailable: result.mlAvailable,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
