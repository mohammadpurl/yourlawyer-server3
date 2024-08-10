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
//end api
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const router = require("./src/routes");

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
    let allTextChunks = [];

    for (let path of pdfPaths) {
      // Read each PDF file from the file system
      const dataBuffer = fs.readFileSync(path);

      // Parse the PDF to extract text
      const data = await pdf(dataBuffer);

      // Simulate text splitting (you may need to implement a more robust text splitting)
      const textChunks = data.text.match(/.{1,1500}/g); // Split into chunks of 1500 characters

      allTextChunks = allTextChunks.concat(textChunks);
    }

    // Initialize embeddings (using OpenAI or any other embedding service)
    const embeddings = await Promise.all(
      allTextChunks.map((chunk) =>
        openai.embeddings.create({
          input: chunk,
        })
      )
    );

    // Create vector database (you might need a custom implementation or a different library)
    vectordb = new Chroma.fromDocuments(allTextChunks, embeddings);
    console.log(`vectordb is ${vectordb}`);
  } catch (error) {
    console.error("Error loading and vectorizing documents:", error);
  }
}

// Example: List of PDF file paths
const pdfFiles = [path.join(__dirname, "public/Data/requests.pdf")];

// Initialize the database once with multiple PDFs
loadAndVectorizeDocuments(pdfFiles);

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
app.listen(PORT, () => console.log(`listening on port ${PORT}`));
