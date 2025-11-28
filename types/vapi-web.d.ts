// Patch incorrect / missing type definitions from @vapi-ai/web

declare module "@vapi-ai/web" {
    /**
     * ✅ Main callable function exported by the SDK
     */
    const createClient: (apiKey: string) => {
        start?: (options?: CreateAssistantDTO) => Promise<void>;
        stop?: () => Promise<void>;
        on?: (event: string, cb: (...args: unknown[]) => void) => void;
    };

    export default createClient;

    /**
     * ✅ Type for options passed to start()
     */
    export interface CreateAssistantDTO {
        assistant?: { id: string };
        metadata?: Record<string, unknown>;
        languageCode?: string;
        voiceId?: string;
    }
}
