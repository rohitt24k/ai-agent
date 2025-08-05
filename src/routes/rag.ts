import express from "express";
import { upload } from "../modules/multer";
import { pineconeService } from "../services/pinecone";
import { PINECONE_EMBEDDINGS_INDEXNAME } from "../constants";
import { cleanupFile } from "../utils";

const router = express.Router();

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please provide a file in the "file" field.',
      });
    }

    const filePath = req.file.path;

    console.log(`Processing file upload: ${req.file.originalname}`);

    // Process and upload the file
    const result = await pineconeService.processAndUploadFile(
      filePath,
      PINECONE_EMBEDDINGS_INDEXNAME
    );

    await cleanupFile(filePath);

    res.json({
      message: "File successfully processed and uploaded to Pinecone",
      result: {
        originalFilename: req.file.originalname,
        // chunksUploaded: result.chunksCount,
        uploadTimestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (req.file?.path) {
      await cleanupFile(req.file.path);
    }

    console.error("Upload error:", error);
    res.status(500).json({
      error: "Failed to process and upload file",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/upload-multiple", upload.array("files", 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded. Please provide files in the "files" field.',
      });
    }

    const results = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        console.log(`Processing file: ${file.originalname}`);
        const result = await pineconeService.processAndUploadFile(
          file.path,
          PINECONE_EMBEDDINGS_INDEXNAME
        );
        results.push({
          filename: file.originalname,
          success: true,
          chunksUploaded: result.chunksCount,
        });
        await cleanupFile(file.path);
      } catch (error) {
        console.error(`Error processing ${file.originalname}:`, error);
        errors.push({
          filename: file.originalname,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        await cleanupFile(file.path);
      }
    }

    res.json({
      message: `Processed ${files.length} files`,
      results,
      errors,
      namespace: "default",
      uploadTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    const files = req.files as Express.Multer.File[];
    if (files) {
      for (const file of files) {
        await cleanupFile(file.path);
      }
    }

    console.error("Multiple upload error:", error);
    res.status(500).json({
      error: "Failed to process files",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/semantic-search", async (req, res) => {
  const query = req.body.query as string;
  if (!query) {
    res.status(400).json({
      error: "missing query in body",
    });
  }

  const response = await pineconeService.semanticSearch({
    query,
    indexName: PINECONE_EMBEDDINGS_INDEXNAME,
  });

  res.json(response);
});

export default router;
