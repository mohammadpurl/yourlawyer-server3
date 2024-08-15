"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { PDFLoader } = require("@langchain/document_loaders");
const { RecursiveCharacterTextSplitter } = require("@langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/embeddings");
const { Chroma } = require("@langchain/vectorstores");
const { ChatOpenAI } = require("@langchain/chat_models");
const { RetrievalQAChain, ConversationalRetrievalChain, } = require("@langchain/chains");
const { ConversationBufferMemory } = require("@langchain/memory");
const fs = require("fs");
// 1. بارگذاری PDF
const loadPDF = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    const pdfLoader = new PDFLoader(filePath);
    return yield pdfLoader.load();
});
// 2. تقسیم‌بندی متن
const splitDocuments = (docs) => {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 150,
    });
    return textSplitter.splitDocuments(docs);
};
// 3. ایجاد embedding و ذخیره در ChromaDB
const createVectorStore = (docs, embedding) => __awaiter(void 0, void 0, void 0, function* () {
    return yield Chroma.fromDocuments({
        documents: docs,
        embedding,
    });
});
// 4. پرسش و پاسخ با ChatGPT
const askQuestion = (question, vectordb) => __awaiter(void 0, void 0, void 0, function* () {
    const llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-3.5-turbo",
    });
    const retriever = vectordb.asRetriever();
    const qaChain = new RetrievalQAChain({
        llm,
        retriever,
    });
    return yield qaChain.run({ query: question });
});
// 5. مدیریت مکالمه و پاسخ‌دهی
const askConversationalQuestion = (question, retriever) => __awaiter(void 0, void 0, void 0, function* () {
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
    const response = yield qa.run({ question });
    return response.answer;
});
// اجرای کد
function vectorizeDocuments(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        //   const filePath = "path/to/requests.pdf";
        const docs = yield loadPDF(filePath);
        const splits = splitDocuments(docs);
        const embedding = new OpenAIEmbeddings({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const vectordb = yield createVectorStore(splits, embedding);
        const question = "یک نمونه نمونه درخواست آزادی مشروط به نام علی رحمتی با کد ملی 1234567890 به شماره پرونده 1234و دادنامه پیوست 1452 ایجاد کن";
        const result = yield askQuestion(question, vectordb);
        console.log("پاسخ: ", result);
        // مدیریت مکالمه
        const conversationalQuestion = "email address";
        const conversationalAnswer = yield askConversationalQuestion(conversationalQuestion, vectordb.asRetriever());
        console.log("پاسخ مکالمه: ", conversationalAnswer);
        return conversationalAnswer;
    });
}
