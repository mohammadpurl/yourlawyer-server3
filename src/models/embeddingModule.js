// embeddingModule.js
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const pdf = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { OpenAI } = require("openai");
const { Chroma } = require("chromadb");

console.log(process.env.OPENAI_API_KEY);
const openai = new OpenAI({
  apikey: process.env.OPENAI_API_KEY,
});
var os = require("os");

var interfaces = os.networkInterfaces();
var addresses = [];
for (var k in interfaces) {
  for (var k2 in interfaces[k]) {
    var address = interfaces[k][k2];
    if (address.family === "IPv4" && !address.internal) {
      addresses.push(address.address);
    }
  }
}

console.log("my ip address:", addresses);
const embeddingsFilePath = path.resolve(__dirname, "embeddings.json");
console.log(`embeddingsFilePath: ${embeddingsFilePath}`);
// Function to load and process PDF files
const loadAndProcessFiles = async (filePaths) => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunk_size: 1500,
    chunk_overlap: 150,
  });

  let allSplits = [];
  for (let filePath of filePaths) {
    const absolutePath = path.resolve(__dirname, filePath);
    console.log(`Absolute Path: ${absolutePath}`);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);

    const splits = textSplitter.splitDocuments([pdfData.text]);
    allSplits.push(splits);
  }
  console.log(allSplits[0]);
  return allSplits;
};

// Function to create embeddings
const createEmbedding = async (text) => {
  try {
    console.log("createEmbedding start");
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    console.log("embeddinggggggggggggggggggggggggggggg");
    return response.data.data[0].embedding;
  } catch (error) {
    console.log(`embedding error: ${error}`);
  }
};

// Function to save embeddings to a file
const saveEmbeddings = async (splits) => {
  let embeddings = [];

  for (let split of splits) {
    const embedding = await createEmbedding(split);
    embeddings.push(embedding);
  }

  // Ensure the directory exists
  const dirPath = path.dirname(embeddingsFilePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  if (embeddings.length > 0) {
    fs.writeFileSync(embeddingsFilePath, JSON.stringify(embeddings));
  } else {
    throw new Error("No embeddings were created to save.");
  }
};

// Function to load embeddings from a file
const loadEmbeddings = () => {
  if (fs.existsSync(embeddingsFilePath)) {
    const embeddingsData = fs.readFileSync(embeddingsFilePath, "utf-8");

    if (embeddingsData.trim() === "") {
      throw new Error("Embeddings file is empty or corrupted.");
    }

    try {
      return JSON.parse(embeddingsData);
    } catch (error) {
      throw new Error(`Failed to parse embeddings JSON: ${error.message}`);
    }
  } else {
    throw new Error(`Embeddings file not found at ${embeddingsFilePath}`);
  }
};

// Function to perform similarity search
const similaritySearch = async (question, k = 10) => {
  const embeddings = loadEmbeddings();
  const vectordb = new Chroma({ embeddings });
  return vectordb.similarity_search(question, k);
};

module.exports = {
  loadAndProcessFiles,
  saveEmbeddings,
  loadEmbeddings,
  similaritySearch,
};
