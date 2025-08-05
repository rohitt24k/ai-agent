import path from "path";
import { langchainService } from "./langchain";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export class PineconeService {
  private pinecone: Pinecone;
  private embeddings: GoogleGenerativeAIEmbeddings;

  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: "text-embedding-004",
    });
  }

  // Upload a document to Pinecone using LangChain + GoogleGenAI Embeddings
  async processAndUploadFile(
    filePath: string,
    indexName: string,
    namespace?: string
  ) {
    try {
      console.log(`Loading document: ${filePath}`);
      const loader = langchainService.getDocumentLoader(filePath);
      const docs = await loader.load();

      console.log("Splitting documents into chunks...");
      const splitDocs = await langchainService.textSplitter.splitDocuments(
        docs
      );

      const filename = path.basename(filePath);
      splitDocs.forEach((doc, index) => {
        doc.metadata = {
          ...doc.metadata,
          filename,
          chunkIndex: index,
          totalChunks: splitDocs.length,
          uploadTimestamp: new Date().toISOString(),
        };
      });

      console.log(`Created ${splitDocs.length} document chunks`);

      const pineconeIndex = this.pinecone.index(indexName);

      await PineconeStore.fromDocuments(splitDocs, this.embeddings, {
        pineconeIndex,
        namespace,
      });

      console.log(`Successfully uploaded to Pinecone`);
      return { success: true, chunksCount: splitDocs.length, filename };
    } catch (error) {
      console.error("Error processing file:", error);
      throw error;
    }
  }

  async semanticSearch({
    query,
    indexName,
    topK = 5,
  }: {
    query: string;
    indexName: string;
    topK?: number;
  }) {
    try {
      console.log(`Embedding query: "${query}"`);
      const pineconeIndex = this.pinecone.Index(indexName);

      const vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        { pineconeIndex }
      );

      const result = await vectorStore.similaritySearch(query, topK);

      return result || [];
    } catch (error) {
      console.error("Error in semantic search:", error);
      throw error;
    }
  }
}

export const pineconeService = new PineconeService();
