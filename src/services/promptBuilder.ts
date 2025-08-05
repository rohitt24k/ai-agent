import { ToolCallResult, ToolDefinition } from "../types";
import { PluginManager } from "./plugins/pluginManager";
import { storageService } from "./storage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PromptConfig {
  system: string;
  messages: Message[];
  tools: ToolDefinition[];
  toolCallResponse: ToolCallResult[];
  context: object[];
  response_format: {
    type: "json_schema";
    json_schema: {
      name: string;
      schema: any;
    };
  };
}

export class PromptBuilder {
  private readonly promptTemplate: PromptConfig = {
    system:
      "You are a helpful and respectful AI assistant designed to answer user queries.",
    messages: [],
    tools: [],
    toolCallResponse: [],
    context: [],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "assistant_response",
        schema: {
          type: "object",
          oneOf: [
            {
              properties: {
                tool_calls: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tool_name: { type: "string" },
                      args: { type: "object" },
                    },
                    required: ["tool_name", "args"],
                  },
                },
              },
              required: ["tool_calls"],
            },
            {
              properties: {
                response: { type: "string" },
              },
              required: ["response"],
            },
          ],
        },
      },
    },
  };

  constructor() {
    const toolsDefintion = PluginManager.getPluginsDefinitions();

    this.promptTemplate.tools = toolsDefintion;
  }

  buildPrompt({
    message,
    sessionId,
    toolCallResponse,
    context,
  }: {
    sessionId: string;
    message: string;
    context?: object[];
    toolCallResponse?: ToolCallResult[];
  }): PromptConfig {
    // Deep clone the template to avoid mutation
    const prompt = JSON.parse(
      JSON.stringify(this.promptTemplate)
    ) as PromptConfig;

    // Get chat history from storage service
    const userOldSessionChat = storageService.getSessionEvents(sessionId);

    const messages: Message[] = userOldSessionChat.map((chat) => ({
      role: chat.role,
      content:
        chat.content.length > 300
          ? `${chat.content.substring(0, 300)}...`
          : chat.content,
    }));

    messages.push({
      role: "user",
      content: message,
    });

    // Replace template variables in messages
    prompt.messages = messages;

    if (toolCallResponse) prompt.toolCallResponse = toolCallResponse;
    if (context) prompt.context = context;

    return prompt;
  }

  buildPromptAsString(params: {
    sessionId: string;
    message: string;
    toolCallResponse?: ToolCallResult[];
    context?: object[];
  }): string {
    const promptConfig = this.buildPrompt(params);
    return JSON.stringify(promptConfig, null, 2);
  }
}

// Export singleton instance for convenience
export const promptBuilder = new PromptBuilder();
