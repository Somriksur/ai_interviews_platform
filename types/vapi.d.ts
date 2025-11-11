// types/vapi.d.ts
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

export interface BaseMessage {
  type: MessageType;
  timestamp?: number;
}

export interface TranscriptMessage extends BaseMessage {
  type: MessageType.TRANSCRIPT;
  role: MessageRole;
  transcript: string;
  transcriptType?: "partial" | "final";
}

export interface FunctionCallMessage extends BaseMessage {
  type: MessageType.FUNCTION_CALL;
  functionCall: {
    name: string;
    parameters: Record<string, unknown>;
  };
}

export interface FunctionResultMessage extends BaseMessage {
  type: MessageType.FUNCTION_RESULT;
  functionCallResult: {
    result: unknown;
  };
}

export interface AddMessage extends BaseMessage {
  type: MessageType.ADD_MESSAGE;
  message: string;
}

export type Message =
    | TranscriptMessage
    | FunctionCallMessage
    | FunctionResultMessage
    | AddMessage;
