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
    const dataBuffer = fs.readFileSync(absolutePath);
    const pdfData = await pdf(dataBuffer);

    const splits = textSplitter.splitDocuments([pdfData.text]);
    allSplits.push(splits);
  }
  console.log(allSplits[0]);
  return allSplits;
};

// Function to create embeddings
const createEmbedding = async (text) => {
  console.log("createEmbedding start");
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  console.log("embeddinggggggggggggggggggggggggggggg");
  return response.data.data[0].embedding;
};

// Function to save embeddings to a file
const saveEmbeddings = async (splits) => {
  let embeddings = [];
  for (let split of splits) {
    console.log(split);
    const embedding = await createEmbedding(split);
    embeddings.push(embedding);
  }
  fs.writeFileSync(embeddingsFilePath, JSON.stringify(embeddings));
};

// Function to load embeddings from a file
const loadEmbeddings = () => {
  if (fs.existsSync(embeddingsFilePath)) {
    const embeddingsData = fs.readFileSync(embeddingsFilePath);
    return JSON.parse(embeddingsData);
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
