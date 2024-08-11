const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors("*"));
//ai
const pdf = require("pdf-parse");
const fs = require("fs");
const OpenAI = require("openai");
// const Chroma = require("chromadb");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

// const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
// const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { OpenAIEmbeddings } = require("@langchain/openai");

//end api
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const router = require("./src/routes");
const { constants } = require("fs/promises");

require("./startup/config")(app, express);
require("./startup/db")();
// require("./startup/loginng")();
// require("./startup/lawyer")();
app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Hello, secure world!");
});

//ai
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Chroma Vector Database
let vectordb;

// Function to load and vectorize documents
// Function to load and vectorize documents
async function loadAndVectorizeDocuments(pdfPaths) {
  try {
    let allDocs = [];

    try {
      for (let filePath of pdfPaths) {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        allDocs = allDocs.concat(docs); // Combine the documents from each PDF
      }
      console.log("Documents loaded:", allDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    console.log("Embeddings created:", embeddings);

    // Create vector database (you might need a custom implementation or a different library)
    vectordb = await Chroma.fromDocuments(allDocs, embeddings, {
      collectionName: "state_of_the_union",
    });
    console.log(`vectordb is ${vectordb}`);
  } catch (error) {
    console.error("Error loading and vectorizing documents:", error);
  }
}

// Example: List of PDF file paths
const pdfFiles = [path.join(__dirname, "public/Data/requests.pdf")];

// Initialize the database once with multiple PDFs
// loadAndVectorizeDocuments(pdfFiles);

// Endpoint to handle questions
app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).send("Question is required.");
  }

  try {
    // Perform similarity search
    const results = vectordb.similaritySearch(question, 5); // Adjust the number of results as needed

    // Generate response using OpenAI
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
