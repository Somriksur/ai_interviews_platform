/**
 * AI Model Service - HireFlow Qwen Space Integration
 * 
 * This service provides a clean interface to your custom HuggingFace Space.
 * Space URL: https://somriksur-hireflow-qwen-api.hf.space
 * Model: somriksur/HireFlow-Qwen-Fresh-Pro (GPU Optimized)
 */

export interface QuestionGenerationRequest {
  role: string;
  level: string;
  type: string;
  amount: number;
}

export interface QuestionGenerationResponse {
  questions: string[];
  metadata: {
    model: string;
    spaceEndpoint: string;
    generatedAt: string;
    role: string;
    level: string;
    type: string;
  };
}

export interface SpaceHealthStatus {
  status: 'healthy' | 'loading' | 'error';
  message: string;
  spaceUrl: string;
  lastChecked: string;
  details?: string;
  httpStatus?: number;
}

function getSpaceEndpoint() {
  const rawEndpoint = process.env.HUGGINGFACE_ENDPOINT_URL;

  if (!rawEndpoint) {
    throw new Error('HUGGINGFACE_ENDPOINT_URL not configured in environment variables');
  }

  return rawEndpoint.replace(/\/+$/, '');
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number = 60000 // Increased default to 60 seconds
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate interview questions using your HuggingFace Space
 */
export async function generateQuestionsWithSpace(
  request: QuestionGenerationRequest
): Promise<QuestionGenerationResponse> {
  const SPACE_ENDPOINT = getSpaceEndpoint();

  const { role, level, type, amount } = request;

  // Create simple, role-based prompt for your Space
  const prompt = `Generate ${amount} ${type.toLowerCase()} interview questions for a ${level} ${role}`;

  console.log('🤖 Calling HireFlow Space:', SPACE_ENDPOINT);
  console.log('📝 Request:', { role, level, type, amount });
  console.log('📝 Prompt:', prompt);

  try {
    // Call your Space's API using Gradio 4.x format
    console.log('🔗 Calling Space API:', `${SPACE_ENDPOINT}/gradio_api/call/generate_interface`);
    
    const callResponse = await fetchWithTimeout(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: [prompt, Math.min(300, amount * 50), 0.6] // prompt, max_tokens, temperature
      })
    }, 30000); // 30 second timeout for initial call

    console.log('📡 Call response status:', callResponse.status);
    
    if (!callResponse.ok) {
      const errorText = await callResponse.text();
      console.error('❌ Call failed:', errorText);
      throw new Error(`Space API call failed with status ${callResponse.status}: ${errorText}`);
    }

    const callData = await callResponse.json();
    console.log('📦 Call data:', JSON.stringify(callData).substring(0, 200));
    
    const eventId = callData.event_id;

    if (!eventId) {
      throw new Error('No event_id received from Space');
    }

    console.log('✅ Got event_id:', eventId);

    // Wait for the result using SSE - increase wait time for model loading
    console.log('⏳ Waiting for generation...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const resultResponse = await fetchWithTimeout(
      `${SPACE_ENDPOINT}/gradio_api/call/generate_interface/${eventId}`,
      { method: 'GET' },
      90000 // Increased to 90 seconds for model loading
    );
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to get result: ${resultResponse.status}`);
    }

    const resultText = await resultResponse.text();
    console.log('📝 Raw response:', resultText.substring(0, 500));

    // Parse SSE response - Gradio returns "event: complete\ndata: [result]"
    let generatedText = '';
    const lines = resultText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data && Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            generatedText = data[0];
            console.log('✅ Extracted generated text:', generatedText.substring(0, 200));
            break;
          }
        } catch (e) {
          console.log('⚠️ Failed to parse line:', line);
          // Continue to next line
        }
      }
    }

    if (!generatedText) {
      throw new Error('No generated text in response');
    }

    // Parse the Space response
    const questions = parseSpaceResponse(generatedText, amount);

    if (questions.length === 0) {
      throw new Error('Failed to parse questions from Space output');
    }

    console.log(`✅ Successfully generated ${questions.length} questions`);

    return {
      questions,
      metadata: {
        model: 'HireFlow-Qwen-Fresh-Pro',
        spaceEndpoint: SPACE_ENDPOINT,
        generatedAt: new Date().toISOString(),
        role,
        level,
        type
      }
    };
  } catch (error) {
    console.error('❌ Space generation failed:', error);
    throw error;
  }
}

/**
 * Check if your HuggingFace Space is healthy and responding
 */
export async function checkSpaceHealth(): Promise<SpaceHealthStatus> {
  let SPACE_ENDPOINT = '';

  try {
    SPACE_ENDPOINT = getSpaceEndpoint();
  } catch (_error) {
    return {
      status: 'error',
      message: 'HUGGINGFACE_ENDPOINT_URL not configured',
      spaceUrl: '',
      lastChecked: new Date().toISOString()
    };
  }

  try {
    const testResponse = await fetchWithTimeout(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        data: ['Health check prompt', 32, 0.2]
      })
    }, 20000);

    let testData: { event_id?: string; error?: string } | null = null;
    try {
      testData = await testResponse.json();
    } catch (_parseError) {
      testData = null;
    }

    if (testResponse.ok && testData?.event_id) {
      return {
        status: 'healthy',
        message: 'Space API is healthy and responding',
        spaceUrl: SPACE_ENDPOINT,
        lastChecked: new Date().toISOString()
      };
    }

    if (testResponse.status === 404) {
      return {
        status: 'loading',
        message: 'Space is reachable, but the Gradio endpoint was not found.',
        spaceUrl: SPACE_ENDPOINT,
        lastChecked: new Date().toISOString(),
        httpStatus: testResponse.status,
        details: 'Check that the interface endpoint name matches `generate_interface`.'
      };
    }

    return {
      status: 'loading',
      message: 'Space is reachable, but the API is still warming up or returned an unexpected response.',
      spaceUrl: SPACE_ENDPOINT,
      lastChecked: new Date().toISOString(),
      httpStatus: testResponse.status,
      details: testData?.error || 'No event_id returned from Gradio API.'
    };
  } catch (error) {
    return {
      status: 'loading',
      message: 'Space API did not respond in time. It may still be waking up.',
      spaceUrl: SPACE_ENDPOINT,
      lastChecked: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean question text by removing all common prefixes and formatting issues
 */
function cleanQuestionText(text: string): string {
  let cleaned = text.trim();
  
  // Remove all common prefixes in order of specificity
  cleaned = cleaned.replace(/^\d+\.\s*[\)\(\?\w]*\s*/i, ''); // Remove "1. ) " or "1. (?) "
  cleaned = cleaned.replace(/^[\)\(\?\w\d\.\s]*\)\s*/i, ''); // Remove any ") " patterns
  cleaned = cleaned.replace(/^[\(\?\w\d\.\s]*\?\)\s*/i, ''); // Remove any "?) " patterns
  cleaned = cleaned.replace(/^\(\?\)\s*/i, ''); // Remove "(?) " specifically
  cleaned = cleaned.replace(/^\)\s*/i, ''); // Remove ") " specifically
  cleaned = cleaned.replace(/^[a-z]\)\s*/i, ''); // Remove "a)" prefix
  cleaned = cleaned.replace(/^\?\s*/i, ''); // Remove "? " prefix
  cleaned = cleaned.replace(/^[\(\)]+\s*/i, ''); // Remove standalone parentheses
  cleaned = cleaned.replace(/^[^\w]*/, ''); // Remove any non-word characters at start
  cleaned = cleaned.replace(/Human Resources.*$/i, ''); // Remove HR text
  cleaned = cleaned.replace(/Interview Question.*$/i, ''); // Remove meta text
  
  return cleaned.trim();
}

/**
 * Extract numbered questions from generated text
 */
function parseSpaceResponse(text: string, expectedAmount: number): string[] {
  const questions: string[] = [];

  // Split by lines and look for numbered questions
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Look for numbered questions
  for (const line of lines) {
    if (questions.length >= expectedAmount) break;

    // Look for numbered questions (1., 2., 3.)
    const numberedMatch = line.match(/^\d+[\.\)]\s*(.+)/);
    if (numberedMatch) {
      let question = numberedMatch[1].trim();

      // Comprehensive cleaning of all possible prefixes
      question = cleanQuestionText(question);

      // Ensure question ends with ?
      if (!question.endsWith('?')) {
        question += '?';
      }

      // Validate question quality - must be technical and reasonable length
      if (question.length > 15 && question.length < 200 && 
          !question.toLowerCase().includes('dream team') &&
          !question.toLowerCase().includes('building exercise') &&
          !questions.includes(question)) {
        questions.push(question);
      }
    }
  }

  // If not enough questions, try splitting by question marks
  if (questions.length < expectedAmount) {
    const questionParts = text.split('?').map(part => part.trim()).filter(part => part.length > 20);

    for (const part of questionParts) {
      if (questions.length >= expectedAmount) break;

      const cleanPart = part
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[-\*\•]\s*/, '')
        .replace(/^Question\s*\d+:?\s*/i, '');
      
      const cleanedQuestion = cleanQuestionText(cleanPart);

      if (cleanedQuestion.length > 15 && cleanedQuestion.length < 200 &&
          !cleanedQuestion.toLowerCase().includes('dream team') &&
          !cleanedQuestion.toLowerCase().includes('building exercise')) {
        const question = cleanedQuestion + '?';
        if (!questions.includes(question)) {
          questions.push(question);
        }
      }
    }
  }

  return questions.slice(0, expectedAmount);
}
