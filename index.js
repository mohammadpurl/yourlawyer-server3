const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors("*"));
const pdf = require("pdf-parse");
const fs = require("fs");
const OpenAI = require("openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const { OpenAIEmbeddings } = require("@langchain/openai");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const router = require("./src/routes");
const { constants } = require("fs/promises");

require("./startup/config")(app, express);
require("./startup/db")();
app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello, secure world!");
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

let vectordb;

async function loadAndVectorizeDocuments(pdfPaths) {
  try {
    let allDocs = [];

    for (let filePath of pdfPaths) {
      const loader = new PDFLoader(filePath);
      const docs = await loader.load();
      allDocs = allDocs.concat(docs);
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    vectordb = await Chroma.fromDocuments(allDocs, embeddings, {
      collectionName: "state_of_the_union",
    });
    console.log(`vectordb is ${vectordb}`);
  } catch (error) {
    console.error("Error loading and vectorizing documents:", error);
  }
}

const pdfFiles = [path.join(__dirname, "public/Data/requests.pdf")];

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).send("Question is required.");
  }

  if (!vectordb) {
    return res.status(500).send("Vector database is not initialized.");
  }

  try {
    const results = await vectordb.similaritySearch(question, 5); // Ensure await is used here

    const response = await openai.completions.create({
      model: "gpt-3.5-turbo",
      prompt: `Context: ${results.join("\n")}\nQuestion: ${question}\nAnswer:`,
      max_tokens: 150,
    });

    res.send({ answer: response.choices[0].text.trim() });
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
