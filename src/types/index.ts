export interface ChatCompletionRequest {
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface ChatEvent {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ToolCall {
  tool_name: string;
  args: any[];
}

export interface ToolDefinition {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, any>;
      required: string[];
    };
  };
}

export interface ToolCallResult<TInput = any, TOutput = any> {
  tool_name: string;
  success: boolean;
  error?: string;
  execution_time_ms?: number; // Optional: track performance
  data: {
    input: TInput;
    output?: TOutput;
  };
}
