### Health Check

#### `GET /ping`

This is a simple health check endpoint to verify that the server is running.

- **Description**: Returns a `pong` message to indicate the server is active.
- **Input**: None
- **Output**: `pong`

---

### Agent Interaction

#### `POST /agent/message`

This is the primary endpoint for communicating with the AI agent. It processes a user's message, leveraging RAG and a plugin system to generate a response.

- **Description**: Sends a message to the AI agent within a specific session. The agent's response is based on the LLM, historical chat messages, retrieved context, and potential plugin results.
- **Input (JSON Body)**:
  ```json
  {
    "message": "What is the weather in London?",
    "session_id": "user-session-123"
  }
  ```
- **Output (JSON)**:
  ```json
  {
    "content": {
      "response": "The current weather in London is 15°C with partly cloudy skies."
    }
  }
  ```
- **Note**: The output from the LLM is a JSON object. If a tool call is required, the output will contain a `tool_calls` array instead of a `response` string.

---

### RAG Operations (for testing purposes)

#### `POST /rag/upload`

This endpoint is used to upload a single file for document processing and embedding. The file is cleaned up after the operation.

- **Description**: Uploads a single file (e.g., `.txt`, `.md`, `.json`) to be processed, chunked, embedded, and stored in the Pinecone vector database.
- **Input (Form Data)**:
  - `file`: The file to be uploaded.
- **Output (JSON)**:
  ```json
  {
    "message": "File successfully processed and uploaded to Pinecone",
    "result": {
      "originalFilename": "document.txt",
      "uploadTimestamp": "2025-08-05T12:00:00.000Z"
    }
  }
  ```

#### `POST /rag/upload-multiple`

This endpoint allows for uploading multiple files at once to the RAG system.

- **Description**: Uploads up to 10 files to be processed and stored in the Pinecone vector database. Reports the success or failure for each file.
- **Input (Form Data)**:
  - `files`: An array of files (e.g., `.txt`, `.md`, `.json`).
- **Output (JSON)**:
  ```json
  {
    "message": "Processed 2 files",
    "results": [
      {
        "filename": "file1.txt",
        "success": true,
        "chunksUploaded": 5
      },
      {
        "filename": "file2.json",
        "success": true,
        "chunksUploaded": 8
      }
    ],
    "errors": [],
    "namespace": "default",
    "uploadTimestamp": "2025-08-05T12:00:00.000Z"
  }
  ```

#### `POST /rag/semantic-search`

This endpoint performs a semantic search on the vector database for a given query.

- **Description**: Searches the Pinecone index for documents semantically similar to the provided query. This is a direct test of the retrieval part of the RAG system.
- **Input (JSON Body)**:
  ```json
  {
    "query": "What are the key features of the AI agent server?"
  }
  ```
- **Output (JSON)**:
  ```json
  [
    {
      "pageContent": "The AI agent server is a robust and extensible backend...",
      "metadata": {
        "filename": "docs.md",
        "chunkIndex": 0,
        "totalChunks": 3,
        "uploadTimestamp": "2025-08-05T12:00:00.000Z"
      }
    }
  ]
  ```
