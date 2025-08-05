import express from "express";
import { pineconeService } from "../services/pinecone";
import { PINECONE_EMBEDDINGS_INDEXNAME } from "../constants";
import { promptBuilder } from "../services/promptBuilder";
import { storageService } from "../services/storage";
import { googleAiService } from "../services/googleAi";
import { PluginManager } from "../services/plugins/pluginManager";
import { ToolCallResult } from "../types";

const router = express.Router();

router.post("/message", async (req, res) => {
  const { message, session_id } = req.body as {
    message: string;
    session_id: string;
  };

  if (!message || !session_id) {
    res.status(400).json({
      error: "Missing message or session_id in the body",
    });
  }

  console.log(`sessionId:${session_id}, message:${message}`);

  // get the top 3 semantic search result
  const semanticSearchResult = await pineconeService.semanticSearch({
    query: message,
    indexName: PINECONE_EMBEDDINGS_INDEXNAME,
    topK: 3,
  });

  const context = [];

  for (const doc of semanticSearchResult) {
    context.push({ text: doc.pageContent });
  }

  const prompt = promptBuilder.buildPromptAsString({
    sessionId: session_id,
    message,
    context,
  });

  // add the user message in the store
  storageService.appendEvent(session_id, {
    content: message,
    role: "user",
    timestamp: new Date().toISOString(),
  });

  let response = await googleAiService.generateContent(prompt);
  let maxLoopCount = 5;
  const toolCallsResponse: ToolCallResult<any, any>[] = [];

  // loop till we have tool_calls and maxLoopCount is not 0
  while (response.tool_calls) {
    const pluginResponse = await PluginManager.executePlugins(
      response.tool_calls
    );

    pluginResponse.forEach((response) => toolCallsResponse.push(response));

    const prompt = promptBuilder.buildPromptAsString({
      sessionId: session_id,
      message,
      context,
      toolCallResponse: toolCallsResponse,
    });

    response = await googleAiService.generateContent(prompt);

    maxLoopCount--;

    if (maxLoopCount === 0) {
      res.status(500).json({
        error: "Something went wrong the ai call is in a loop",
      });
    }
  }

  // add the assistant message in the store
  if (response.response)
    storageService.appendEvent(session_id, {
      content: response.response,
      role: "assistant",
      timestamp: new Date().toISOString(),
    });

  res.json({
    content: response,
  });
});

export default router;
