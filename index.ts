import express, { Request, Response } from "express";
import cors from "cors";
import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";
import path from "path";
import router from "./src/routes";
import { getPineconeClient } from "./src/lib/pinecone";
import { ChatOpenAI } from "@langchain/openai";
import connectToDatabase from "./startup/db";
import setupApp from "./startup/config";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import {
  RunnableLike,
  RunnablePassthrough,
  RunnableSequence,
} from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { formatDocumentsAsString } from "langchain/util/document";
import { ConversationalRetrievalQAChainInput } from "./types/chat";
import { EmbeddingsInterface } from "@langchain/core/embeddings";
import { DocumentInterface } from "@langchain/core/documents";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

setupApp(app, express);
connectToDatabase();
app.use("/api", router);
let allDocs: any[] = [];
let embeddings: EmbeddingsInterface;
let vector_store: PineconeStore;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, secure world!");
});
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});
// Initialize embeddings and Pinecone client outside the route handler

async function initializePinecone() {
  try {
    const pc = await getPineconeClient();
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const pineconeIndex = pc.index("yourlawyer");
    vector_store = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: "yourLawyer",
      textKey: "text",
    });
    console.log(vector_store);
  } catch (error) {
    console.error("Error initializing vector store:", error);
  }
}

// app.post("/", async (req: Request, res: Response) => {
//   const { question } = req.body;
//   if (!question) {
//     return res.status(400).send("Question is required.");
//   }
//   try {
//     console.log(embeddings);
//     console.log("Start vectorize");

//     if (!embeddings) throw new Error("Embeddings are not initialized.");

//     console.log(`vectordb is ${vector_store}`);
//   } catch (error: any) {
//     throw new Error(`Failed to vectorize: ${error.message}`);
//   }
//   try {
//     const pc = await getPineconeClient();
//     const pineconeIndex = pc.index("yourlawyer");
//     const vector_store = await PineconeStore.fromExistingIndex(embeddings, {
//       pineconeIndex: pineconeIndex,
//       namespace: "yourLawyer",
//       textKey: "text",
//     });
//     if (!vector_store) throw new Error("VectorDB is not initialized.");
//     console.log(`vector_store is ${vector_store}`);

//     const results = await vector_store.similaritySearch(question, 5);
//     console.log(`similaritySearch is ${results}`);

//     const llm = new ChatOpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//       modelName: "gpt-3.5-turbo",
//     });
//     console.log(`openai result  is ${llm}`);

//     const retriever = vector_store.asRetriever();

//     // Create a conversational retrieval chain
//     const condenseQuestionTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, in its original language.

//     Chat History:
//     {chat_history}
//     Follow Up Input: ${question}
//     Standalone question:`;
//     const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
//       condenseQuestionTemplate
//     );

//     const answerTemplate = `Answer the question based only on the following context:
// {context}

// Question: {question}
// `;

//     const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);

//     const formatChatHistory = (chatHistory: [string, string][]) => {
//       const formattedDialogueTurns = chatHistory.map(
//         (dialogueTurn) =>
//           `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`
//       );
//       return formattedDialogueTurns.join("\n");
//     };

//     const standaloneQuestionChain = RunnableSequence.from([
//       {
//         question: (input: ConversationalRetrievalQAChainInput) =>
//           input.question,
//         chat_history: (input: ConversationalRetrievalQAChainInput) =>
//           formatChatHistory(input.chat_history),
//       },
//       CONDENSE_QUESTION_PROMPT,
//       llm,
//       new StringOutputParser(),
//     ]);
//     console.log(`standaloneQuestionChain is ${standaloneQuestionChain}`);
//     const answerChain = RunnableSequence.from([
//       {
//         context: retriever.pipe(formatDocumentsAsString),
//         question: new RunnablePassthrough(),
//       },
//       ANSWER_PROMPT,
//       llm,
//     ]);
//     console.log(`answerChain is ${answerChain}`);
//     const conversationalRetrievalQAChain =
//       standaloneQuestionChain.pipe(answerChain);

//     const result1 = await conversationalRetrievalQAChain.invoke({
//       question: question,
//       chat_history: [],
//     });
//     console.log(result1);
//     res.status(200).send({ answer: result1 });
//   } catch (error) {
//     console.error("Error handling question:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.post("/", async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).send("Question is required.");
  }

  try {
    await initializePinecone();
    const pc = await getPineconeClient();
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const pineconeIndex = pc.index("yourlawyer");
    vector_store = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: "yourLawyer",
      textKey: "text",
    });
    console.log(`vector_store is ${vector_store}`);

    const results = await vector_store.similaritySearch(question, 5);
    console.log(`similaritySearch is ${results}`);

    const llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
    });
    console.log(`openai result  is ${llm}`);

    const retriever = vector_store.asRetriever();

    console.log(retriever);

    const condenseQuestionTemplate = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:
`;

    const CONDENSE_QUESTION_PROMPT = PromptTemplate.fromTemplate(
      condenseQuestionTemplate
    );

    const answerTemplate = `Answer the question based only on the following context:
{context}

Question: {question}
`;

    const ANSWER_PROMPT = PromptTemplate.fromTemplate(answerTemplate);
    // Combine documents into a single string
    const combineDocumentsFn: RunnableLike<
      DocumentInterface<Record<string, string>>[],
      string
    > = (allDocs) => {
      const serializedDocs = allDocs.map((doc) => doc.pageContent);
      return serializedDocs.join("\n\n");
    };

    const formatChatHistory = (chatHistory: any) => {
      const formattedDialogueTurns = chatHistory.map(
        (dialogueTurn: any) =>
          `Human: ${dialogueTurn[0]}\nAssistant: ${dialogueTurn[1]}`
      );
      return formattedDialogueTurns.join("\n");
    };

    const standaloneQuestionChain = RunnableSequence.from([
      {
        chat_history: (input) => formatChatHistory(input.chat_history),
        question: (input) => input.question,
      },
      CONDENSE_QUESTION_PROMPT,
      llm,
      new StringOutputParser(),
    ]);

    const answerChain = RunnableSequence.from([
      {
        context: retriever.pipe(combineDocumentsFn),
        question: new RunnablePassthrough(),
      },
      ANSWER_PROMPT,
      llm,
      new StringOutputParser(),
    ]);

    const conversationalRetrievalQAChain =
      standaloneQuestionChain.pipe(answerChain);

    // const result1 = await conversationalRetrievalQAChain.invoke({
    //   question: "Where is the golden key?",
    //   chat_history: [],
    // });
    // console.log(result1);
    /*
  AIMessage { content: "The golden key is in the Mountains of Ilsodor. }
*/

    const result2 = await conversationalRetrievalQAChain.invoke({
      question: question,
      chat_history: [
        [
          "Where is the golden key?",
          "The golden key is in the Mountains of Ilsodor.",
        ],
      ],
    });
    console.log(result2);

    res.status(200).send({ answer: result2 });
  } catch (error) {
    console.error("Error handling question:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/ask", async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).send("Question is required.");
  }
  try {
    console.log(embeddings);
    console.log("Start vectorize");

    if (!embeddings) throw new Error("Embeddings are not initialized.");

    console.log(`vectordb is ${vector_store}`);
  } catch (error: any) {
    throw new Error(`Failed to vectorize: ${error.message}`);
  }
  try {
    const pc = await getPineconeClient();
    const pineconeIndex = pc.index("yourlawyer");
    const vector_store = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: "yourLawyer",
      textKey: "text",
    });
    if (!vector_store) throw new Error("VectorDB is not initialized.");

    const results = await vector_store.similaritySearch(question, 5);

    const response = await openai.completions.create({
      model: "gpt-3.5-turbo",
      prompt: `Context: ${results.join("\n")}\nQuestion: ${question}\nAnswer:`,
      max_tokens: 150,
    });

    res.status(200).send({ answer: response.choices[0].text.trim() });
  } catch (error) {
    console.error("Error handling question:", error);
    res.status(500).send("Internal Server Error");
  }
});

async function loadAndVectorizeDocuments(pdfPaths: string[]): Promise<void> {
  try {
    for (let filePath of pdfPaths) {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      allDocs = allDocs.concat(docs);
    }
    console.log(allDocs);
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || "",
    });

    const pc = await getPineconeClient();
    const pineconeIndex = pc.index("yourlawyer");
    vector_store = await PineconeStore.fromDocuments(allDocs, embeddings, {
      pineconeIndex: pineconeIndex,
      namespace: "yourLawyer",
      textKey: "text",
    });
    console.log(vector_store);
  } catch (error) {
    console.error("Error loading and vectorizing documents:", error);
  }
}

const pdfFiles = [path.join(__dirname, "public/Data/requests.pdf")];

const PORT = process.env.PORT || 5000;
async function initializeServer() {
  try {
    await loadAndVectorizeDocuments(pdfFiles);

    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  } catch (error) {
    console.error("Failed to initialize server:", error);
  }
}

initializeServer();
