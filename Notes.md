#### AI-Generated Content

The initial structure of the project, including the file and folder layout, and the boilerplate code for the Express server were generated with the help of a large language model. This was done to accelerate the initial setup process and ensure a clean, standard project foundation. The documentation for the project was also generated with AI assistance.

#### Bugs Faced and Solutions

- **The Problem with Prompting**: The most significant challenge was getting the LLM to consistently follow instructions and provide the desired output, especially when it came to tool calls. Initially, the prompt was structured as a simple text string, which made it difficult to precisely control the LLM's response format. The LLM often struggled to differentiate between a simple conversational response and a structured tool call.

  - **The Fix**: I shifted to a **JSON-formatted prompt**. This provided a rigid structure, making it explicit to the LLM what kind of output was expected. Within this JSON, I defined the available tools and their parameters. The key insight was to model the tool arguments using a schema similar to **Zod or JSON Schema**, which is a common practice in modern web development. This allowed for clear and unambiguous communication of what a tool call should look like. The final JSON prompt includes a `response_format` property that explicitly tells the LLM to respond with a JSON object, either containing a `response` string or a `tool_calls` array.

- **The Challenge with Embeddings**: My knowledge of embeddings was a bit rusty, and I struggled to recall the exact process of splitting documents and indexing them. The official LangChain documentation, while comprehensive, was dense.
  - **The Fix**: I turned to AI to help me quickly grasp the core concepts. The AI helped me understand how `RecursiveCharacterTextSplitter` works and how to use `GoogleGenerativeAIEmbeddings` to embed documents. It provided clear code examples that bridged the gap between my rusty knowledge and the complex documentation, allowing me to implement the RAG system efficiently.

#### Agent Architecture

- **Plugin Calls**: The agent routes plugin calls through a multi-step process.

  1.  A user message is received, and a prompt is built using the `PromptBuilder`.
  2.  This prompt, which includes definitions for all available tools, is sent to the LLM.
  3.  If the LLM's response contains a `tool_calls` array, the `PluginManager`'s `executePlugins` method is invoked.
  4.  The `PluginManager` dynamically finds the correct plugin class based on the `tool_name` and executes its `execute` method with the provided arguments.
  5.  The result of the tool execution is then added back to the prompt as a `toolCallResponse`.
  6.  The process repeats, allowing the LLM to generate a final, informed response.

- **Memory and Context**:
  - **Memory**: Session memory is handled by the `StorageService`. It stores a limited number of past conversations (up to 10 messages) in an in-memory `Map`. This history is then incorporated into the LLM's prompt by the `promptBuilder` to maintain conversational context.
  - **Context (RAG)**: Contextual information is provided by the RAG system. The `pineconeService` handles document embedding and retrieval. It performs a semantic search on the Pinecone index using the user's query and fetches the top 3 most relevant document chunks. This retrieved context is then passed to the `PromptBuilder` and included in the LLM's prompt.
