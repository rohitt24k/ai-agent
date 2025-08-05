#### Key Features:

- **LLM-based Messaging**: Utilizes a powerful LLM to process user messages and generate human-like responses.
- **Session Memory**: Maintains conversational context for each user, allowing for more coherent and personalized interactions across multiple turns.
- **Retrieval-Augmented Generation (RAG)**: Integrates with a vector database (Pinecone) to augment the LLM's knowledge with custom, domain-specific documents.
- **Plugin Execution**: Dynamically executes code-based plugins (tools) when the LLM detects a specific intent in the user's query.

---

### 🛠️ Setup & Installation

#### Prerequisites

- **Vector Database**: The project uses Pinecone as the vector database. A Pinecone account and a configured index are required.
  while configuring the pinecone use the custom settings in the configuration. Then for the dimesion use the value `768`. since we are using google's `text-embedding-004` to create embeddings.

#### Local Installation

1.  **Clone the repository**.
2.  **Install dependencies**:
    ```bash
    yarn install
    ```
3.  **Run the server**:
    - For development with hot-reloading: `yarn dev`
    - For production: `yarn start`

---

### 📁 Project Structure

```
.
├── src/
│   ├── modules/
│   │   └── multer.ts             # Multer configuration for file uploads
│   ├── routes/
│   │   ├── agent.ts              # API endpoint for agent messaging
│   │   └── rag.ts                # API endpoints for RAG-related tasks (upload, search)
│   ├── services/
│   │   ├── googleAi.ts           # Service for interacting with Google's GenAI API
│   │   ├── langchain.ts          # Utility for document loading and splitting
│   │   ├── openai.ts             # Service for interacting with the OpenAI API
│   │   ├── pinecone.ts           # Service for Pinecone integration
│   │   ├── promptBuilder.ts      # Constructs the final prompt for the LLM
│   │   ├── storage.ts            # Manages in-memory session history
│   │   └── plugins/
│   │       ├── pluginManager.ts  # Manages and executes all available plugins
│   │       ├── mathPlugin.ts     # Defines the math calculation tool
│   │       └── weatherPlugin.ts  # Defines the weather lookup tool
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   └── index.ts                  # Main server entry point
├── package.json
└── tsconfig.json
```

---

### 🌐 API Reference

#### `POST /agent/message`

This endpoint is the primary interface for interacting with the AI agent. It processes a user message, retrieves relevant context, executes plugins if necessary, and returns a response from the LLM.

- **Request Body**:

  - `message`: A string containing the user's query.
  - `session_id`: A unique string identifier for the user's session.

- **Processing Flow**:

  1.  The system performs a semantic search on the Pinecone index using the user's message.
  2.  It retrieves the top 3 most relevant documents as context.
  3.  A system prompt is built, incorporating the session history, the user's message, and the retrieved context.
  4.  The LLM (`gemini-2.5-flash`) generates a response, which may include tool calls.
  5.  If tool calls are present, the `PluginManager` executes them, and the results are fed back into the prompt. This loop continues up to 5 times.
  6.  The final text response from the LLM is stored in the session memory and returned to the user.

- **Sample Request**:

  ```json
  {
    "message": "What is the weather like in London?",
    "session_id": "user123"
  }
  ```

- **Sample Response**:

  ```json
  {
    "content": {
      "response": "The current temperature in London is 15°C with partly cloudy skies."
    }
  }
  ```

---

### 🧠 Memory System

The server uses an in-memory `StorageService` to handle session history.

- Messages for each `session_id` are stored in a `Map`.
- The system maintains a rolling window of up to 10 messages to keep the conversation concise and relevant.
- This approach is simple and effective for demonstration but is not persistent across server restarts.

---

### 🔎 RAG Integration

The RAG system is a core component that allows the AI to reference external documents.

- **File Processing**: Files are uploaded via the `POST /rag/upload` and `POST /rag/upload-multiple` endpoint. The `LangchainService` loads the document and splits it into chunks of up to 1000 characters with a 200-character overlap.
- **Embedding and Storage**: Each chunk is embedded into a vector using the `GoogleGenerativeAIEmbeddings` model (`text-embedding-004`). These vectors are then stored in a Pinecone index named `learning-v4` by default.
- **Retrieval Logic**: During a user query, a semantic search is performed on the Pinecone index to find the documents most semantically similar to the user's message. These are then added to the prompt as context.

---

### 🔌 Plugin System

The AI agent can invoke predefined plugins to perform specific tasks.

- **Architecture**: The `PluginManager` holds an array of available plugin classes (`MathPlugin`, `WeatherPlugin`). It can provide their definitions to the LLM and execute them based on the LLM's tool-call response.
- **Plugin Detection**: The LLM is prompted with the tool definitions and can decide to call a plugin with specific arguments if the user's message matches the plugin's description.

#### Available Plugins:

- **Math Plugin (`math_tool`)**:

  - **Description**: "Perform mathematical calculations".
  - **Input**: `expression` (a string containing a mathematical expression).
  - **Functionality**: Safely evaluates the provided mathematical expression. It handles basic arithmetic, percentages, and exponents.

- **Weather Plugin (`weather_tool`)**:

  - **Description**: "Get current weather for a location".
  - **Input**: `location` (a string specifying a location).
  - **Functionality**: Uses the Open-Meteo API to fetch weather data for the specified location. It first geocodes the location and then retrieves temperature, description, humidity, and wind speed.

---

### ✍️ Prompt Engineering

The `PromptBuilder` service is responsible for constructing the final prompt sent to the LLM.

- **Prompt Structure**: The prompt is a JSON object that includes a `system` prompt, a list of `messages` (chat history), `tools` definitions, `toolCallResponse` (if any), `context` (from RAG), and a specific `response_format`.
- **Content Composition**:
  - **System Prompt**: Sets the agent's persona as a "helpful and respectful AI assistant".
  - **Messages**: Includes a trimmed version of the session history to maintain conversational context.
  - **Context**: Contains the textual content of documents retrieved by the RAG system.
  - **Tool Calls**: The prompt is constructed to guide the LLM to output either a textual response or a tool call in a structured JSON format.

---

### 🚀 Deployment

The server is designed for a hosted deployment environment. The `start` script in `package.json` and the server setup in `src/index.ts` make it suitable for platforms like Render, Vercel, or Railway. The server runs on a configurable port, defaulting to `4000`.

---
