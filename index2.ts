const { PDFLoader } = require("@langchain/document_loaders");
const { RecursiveCharacterTextSplitter } = require("@langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/embeddings");
const { Chroma } = require("@langchain/vectorstores");
const { ChatOpenAI } = require("@langchain/chat_models");
const {
  RetrievalQAChain,
  ConversationalRetrievalChain,
} = require("@langchain/chains");
const { ConversationBufferMemory } = require("@langchain/memory");
const fs = require("fs");

// 1. بارگذاری PDF
const loadPDF = async (filePath: string) => {
  const pdfLoader = new PDFLoader(filePath);
  return await pdfLoader.load();
};

// 2. تقسیم‌بندی متن
const splitDocuments = (docs: any) => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 150,
  });
  return textSplitter.splitDocuments(docs);
};

// 3. ایجاد embedding و ذخیره در ChromaDB
const createVectorStore = async (docs: any, embedding: any) => {
  return await Chroma.fromDocuments({
    documents: docs,
    embedding,
  });
};

// 4. پرسش و پاسخ با ChatGPT
const askQuestion = async (question: string, vectordb: any) => {
  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
  });

  const retriever = vectordb.asRetriever();

  const qaChain = new RetrievalQAChain({
    llm,
    retriever,
  });

  return await qaChain.run({ query: question });
};

// 5. مدیریت مکالمه و پاسخ‌دهی
const askConversationalQuestion = async (question: string, retriever: any) => {
  const memory = new ConversationBufferMemory({
    memoryKey: "chat_history",
    returnMessage: true,
  });

  const llm = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
  });

  const qa = new ConversationalRetrievalChain({
    llm,
    retriever,
    memory,
  });

  const response = await qa.run({ question });
  return response.answer;
};

// اجرای کد
async function vectorizeDocuments(filePath: string) {
  //   const filePath = "path/to/requests.pdf";
  const docs = await loadPDF(filePath);
  const splits = splitDocuments(docs);

  const embedding = new OpenAIEmbeddings({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const vectordb = await createVectorStore(splits, embedding);

  const question =
    "یک نمونه نمونه درخواست آزادی مشروط به نام علی رحمتی با کد ملی 1234567890 به شماره پرونده 1234و دادنامه پیوست 1452 ایجاد کن";
  const result = await askQuestion(question, vectordb);

  console.log("پاسخ: ", result);

  // مدیریت مکالمه
  const conversationalQuestion = "email address";
  const conversationalAnswer = await askConversationalQuestion(
    conversationalQuestion,
    vectordb.asRetriever()
  );
  console.log("پاسخ مکالمه: ", conversationalAnswer);
  return conversationalAnswer;
}
