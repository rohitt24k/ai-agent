import OpenAI from "openai";
import { ChatCompletionRequest } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmbeddingRequest {
  text: string;
}

const AI_MODEL = "gpt-4o-mini";

export class OpenAIService {
  async generateChatCompletion(
    request: ChatCompletionRequest
  ): Promise<string> {
    // If API key is invalid, provide demo response
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("API key missing");
    }

    try {
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: request.messages,
      });

      return (
        response.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response."
      );
    } catch (error: any) {
      console.error("OpenAI chat completion error:", error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

export const openaiService = new OpenAIService();
