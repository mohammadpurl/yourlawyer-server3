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

import connectToDatabase from "./startup/db";
import setupApp from "./startup/config";

dotenv.config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

setupApp(app, express);
connectToDatabase();
app.use("/api", router);
let allDocs: any[] = [];
let embeddings: OpenAIEmbeddings | undefined;
let vector_store: PineconeStore;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, secure world!");
});
app.post("/", (req: Request, res: Response) => {
  res.send("post");
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
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
