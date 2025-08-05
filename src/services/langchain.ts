import { TextLoader } from "langchain/document_loaders/fs/text";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import path from "path";

export class LangchainService {
  getDocumentLoader(filePath: string) {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
      case ".txt":
      case ".md":
      case ".json":
        return new TextLoader(filePath);
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  // Text splitter configuration
  textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
}

export const langchainService = new LangchainService();
