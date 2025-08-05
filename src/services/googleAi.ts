import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL_NAME = "gemini-2.5-flash";

export class GoogleAiService {
  private ai;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_AI_API_KEY,
    });
  }

  async generateContent(prompt: string) {
    try {
      const chat = await this.ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      return JSON.parse(chat.text ?? "") as {
        tool_calls?: Array<{ tool_name: string; args: any[] }>;
        response?: string;
      };
    } catch (error) {
      console.error(error);
      throw new Error("Something went wrong");
    }
  }
}

export const googleAiService = new GoogleAiService();
