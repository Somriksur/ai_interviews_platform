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
}

/**
 * Generate interview questions using your HuggingFace Space
 */
export async function generateQuestionsWithSpace(
  request: QuestionGenerationRequest
): Promise<QuestionGenerationResponse> {
  const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;

  if (!SPACE_ENDPOINT) {
    throw new Error('HUGGINGFACE_ENDPOINT_URL not configured in environment variables');
  }

  const { role, level, type, amount } = request;

  // Create simple, role-based prompt for your Space
  const prompt = `Generate ${amount} ${type.toLowerCase()} interview questions for a ${level} ${role}`;

  console.log('🤖 Calling HireFlow Space:', SPACE_ENDPOINT);
  console.log('📝 Request:', { role, level, type, amount });
  console.log('📝 Prompt:', prompt);

  try {
    // Call your Space's API using Gradio 4.x format
    const callResponse = await fetch(`${SPACE_ENDPOINT}/call/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [prompt, Math.min(300, amount * 50), 0.6] // prompt, max_tokens, temperature
      })
    });

    if (!callResponse.ok) {
      throw new Error(`Space API call failed with status ${callResponse.status}`);
    }

    const callData = await callResponse.json();
    const eventId = callData.event_id;

    if (!eventId) {
      throw new Error('No event_id received from Space');
    }

    console.log('✅ Got event_id:', eventId);

    // Wait for the result using SSE
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for generation

    const resultResponse = await fetch(`${SPACE_ENDPOINT}/call/predict/${eventId}`);
    
    if (!resultResponse.ok) {
      throw new Error(`Failed to get result: ${resultResponse.status}`);
    }

    const resultText = await resultResponse.text();
    console.log('📝 Raw response:', resultText.substring(0, 500));

    // Parse SSE response
    let generatedText = '';
    const lines = resultText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          if (data && Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
            generatedText = data[0];
            break;
          }
        } catch (e) {
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
  const SPACE_ENDPOINT = process.env.HUGGINGFACE_ENDPOINT_URL;

  if (!SPACE_ENDPOINT) {
    return {
      status: 'error',
      message: 'HUGGINGFACE_ENDPOINT_URL not configured',
      spaceUrl: '',
      lastChecked: new Date().toISOString()
    };
  }

  try {
    // Try to access the Space
    const healthResponse = await fetch(SPACE_ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'HireFlow-HealthCheck/1.0'
      }
    });

    if (!healthResponse.ok) {
      return {
        status: 'loading',
        message: 'Space is not accessible. It might be sleeping or loading.',
        spaceUrl: SPACE_ENDPOINT,
        lastChecked: new Date().toISOString()
      };
    }

    // Try a test API call
    const testResponse = await fetch(`${SPACE_ENDPOINT}/gradio_api/call/generate_interface`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: ['Test health check', 100, 0.7]
      })
    });

    const testData = await testResponse.json();

    return {
      status: testResponse.ok && testData.event_id ? 'healthy' : 'loading',
      message: testResponse.ok && testData.event_id 
        ? 'Space is healthy and responding' 
        : 'Space is accessible but API might be initializing',
      spaceUrl: SPACE_ENDPOINT,
      lastChecked: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      spaceUrl: SPACE_ENDPOINT,
      lastChecked: new Date().toISOString()
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
