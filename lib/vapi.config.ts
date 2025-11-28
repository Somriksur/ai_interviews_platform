/**
 * Vapi Assistant Configuration
 * 
 * This file contains configuration for Vapi voice AI assistants.
 * You can either use pre-created assistant IDs from the Vapi dashboard
 * or define inline assistant configurations here.
 * 
 * Docs: https://docs.vapi.ai/assistants
 */

/**
 * Default interview assistant configuration
 * Uses OpenAI GPT-4 for the model and ElevenLabs for voice
 */
export const defaultInterviewAssistant = {
    model: {
        provider: "openai" as const,
        model: "gpt-4" as const,
        messages: [
            {
                role: "system" as const,
                content: "You are a HireFlow interviewer conducting a professional job interview. Ask relevant questions based on the candidate's role and experience level. Be professional, encouraging, and thorough. Listen carefully to responses and ask follow-up questions when appropriate."
            }
        ]
    },
    voice: {
        provider: "11labs" as const,
        voiceId: "rachel"
    },
    firstMessage: "Hello! I'm your HireFlow interviewer today. Let's begin with a brief introduction. Can you tell me about yourself?",
    firstMessageMode: "assistant-speaks-first" as const,
};

/**
 * Get assistant configuration based on interview type
 */
export function getAssistantConfig(
    role?: string,
    level?: string,
    type?: string
) {
    const systemPrompt = `You are a HireFlow interviewer conducting a ${type || "professional"} job interview for a ${level || "mid-level"} ${role || "software engineer"} position. 
    
Ask relevant questions based on the candidate's role and experience level. 
Be professional, encouraging, and thorough. 
Listen carefully to responses and ask follow-up questions when appropriate.
Keep the conversation natural and engaging.`;

    return {
        ...defaultInterviewAssistant,
        model: {
            ...defaultInterviewAssistant.model,
            messages: [
                {
                    role: "system" as const,
                    content: systemPrompt
                }
            ]
        }
    };
}
