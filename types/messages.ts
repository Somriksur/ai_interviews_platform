// ✅ Core message type enums (consistent naming)
export enum MessageType {
    TRANSCRIPT = "transcript",
    FUNCTION_CALL = "function-call",
    FUNCTION_RESULT = "function-call-result",
    ADD_MESSAGE = "add-message",
}

export enum MessageRole {
    USER = "user",
    SYSTEM = "system",
    ASSISTANT = "assistant",
}

export enum TranscriptType {
    PARTIAL = "partial",
    FINAL = "final",
}

// ✅ Base message every type extends
export interface BaseMessage {
    type: MessageType;
    timestamp?: number; // optional: useful for logging / sequencing
}

// ✅ Transcript message from speech or text
export interface TranscriptMessage extends BaseMessage {
    type: MessageType.TRANSCRIPT;
    role: MessageRole;
    transcriptType: TranscriptType;
    transcript: string;
    confidence?: number; // optional, if ASR returns probability
}

// ✅ Function call request from assistant
export interface FunctionCallMessage extends BaseMessage {
    type: MessageType.FUNCTION_CALL;
    functionCall: {
        name: string;
        parameters: Record<string, unknown>;
    };
}

// ✅ Function call response from your system
export interface FunctionResultMessage extends BaseMessage {
    type: MessageType.FUNCTION_RESULT;
    functionCallResult: {
        forwardToClientEnabled?: boolean;
        result: unknown;
        metadata?: Record<string, unknown>;
    };
}

// ✅ Add-message used for internal system logs or context updates
export interface AddMessage extends BaseMessage {
    type: MessageType.ADD_MESSAGE;
    message: string;
    role?: MessageRole;
}

// ✅ Unified message type
export type Message =
    | TranscriptMessage
    | FunctionCallMessage
    | FunctionResultMessage
    | AddMessage;
