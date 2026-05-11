import { NextRequest, NextResponse } from 'next/server';
import { mlNLPService } from '@/lib/services/ml-nlp.service';

/**
 * Test ML NLP API Integration
 * GET /api/test-ml-nlp
 */
export async function GET(request: NextRequest) {
  try {
    // Test 1: Health Check
    console.log('🔍 Testing ML NLP API health...');
    const isHealthy = await mlNLPService.healthCheck();
    
    if (!isHealthy) {
      return NextResponse.json({
        success: false,
        error: 'ML NLP API is not healthy'
      }, { status: 503 });
    }

    // Test 2: Simple Evaluation
    console.log('🧪 Testing simple evaluation...');
    const testText = "I have 5 years of experience with React and have built scalable systems.";
    const result = await mlNLPService.evaluate(testText);

    // Test 3: Edge Case (Sarcasm)
    console.log('🧪 Testing edge case (sarcasm)...');
    const sarcasmText = "Oh yeah, this code is just AMAZING. I absolutely LOVE debugging it.";
    const sarcasmResult = await mlNLPService.evaluate(sarcasmText);

    // Test 4: Convert to legacy format
    const legacyFormat = mlNLPService.convertToLegacyFormat(result);

    return NextResponse.json({
      success: true,
      message: 'ML NLP API integration working!',
      tests: {
        healthCheck: isHealthy,
        simpleEvaluation: {
          text: testText,
          result: result,
          legacyFormat: legacyFormat
        },
        edgeCaseEvaluation: {
          text: sarcasmText,
          result: sarcasmResult
        }
      },
      apiUrl: process.env.HUGGINGFACE_NLP_SPACE_URL,
      modelVersion: result.model_version
    });

  } catch (error: any) {
    console.error('❌ ML NLP test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      apiUrl: process.env.HUGGINGFACE_NLP_SPACE_URL
    }, { status: 500 });
  }
}
