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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = __importDefault(require("openai"));
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const openai_2 = require("@langchain/openai");
const pinecone_1 = require("@langchain/pinecone");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./src/routes"));
const pinecone_2 = require("./src/lib/pinecone");
const openai_3 = require("@langchain/openai");
const db_1 = __importDefault(require("./startup/db"));
const config_1 = __importDefault(require("./startup/config"));
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const document_1 = require("langchain/util/document");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(express_1.default.json());
(0, config_1.default)(app, express_1.default);
(0, db_1.default)();
app.use("/api", routes_1.default);
let allDocs = [];
let embeddings;
let vector_store;
app.get("/", (req, res) => {
    res.send("Hello, secure world!");
});
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || "",
});
// Initialize embeddings and Pinecone client outside the route handler
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pc = yield (0, pinecone_2.getPineconeClient)();
        embeddings = new openai_2.OpenAIEmbeddings();
        const pineconeIndex = pc.index("yourlawyer");
        vector_store = yield pinecone_1.PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: pineconeIndex,
            namespace: "yourLawyer",
            textKey: "text",
        });
    }
    catch (error) {
        console.error("Error initializing vector store:", error);
    }
}))();
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
app.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question } = req.body;
    if (!question) {
        return res.status(400).send("Question is required.");
    }
    try {
        if (!vector_store)
            throw new Error("VectorDB is not initialized.");
        const results = yield vector_store.similaritySearch(question, 5);
        const llm = new openai_3.ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-3.5-turbo",
        });
        const retriever = vector_store.asRetriever();
        const answerTemplate = `Answer the question based only on the following context:
{context}

Question: ${question}`;
        const ANSWER_PROMPT = prompts_1.PromptTemplate.fromTemplate(answerTemplate);
        const answerChain = runnables_1.RunnableSequence.from([
            {
                context: retriever.pipe(document_1.formatDocumentsAsString),
                question: new runnables_1.RunnablePassthrough(),
            },
            ANSWER_PROMPT,
            llm,
        ]);
        const result1 = yield answerChain.invoke({
            question: question,
            chat_history: [],
        });
        res.status(200).send({ answer: result1 });
    }
    catch (error) {
        console.error("Error handling question:", error);
        res.status(500).send("Internal Server Error");
    }
}));
app.post("/ask", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { question } = req.body;
    if (!question) {
        return res.status(400).send("Question is required.");
    }
    try {
        console.log(embeddings);
        console.log("Start vectorize");
        if (!embeddings)
            throw new Error("Embeddings are not initialized.");
        console.log(`vectordb is ${vector_store}`);
    }
    catch (error) {
        throw new Error(`Failed to vectorize: ${error.message}`);
    }
    try {
        const pc = yield (0, pinecone_2.getPineconeClient)();
        const pineconeIndex = pc.index("yourlawyer");
        const vector_store = yield pinecone_1.PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: pineconeIndex,
            namespace: "yourLawyer",
            textKey: "text",
        });
        if (!vector_store)
            throw new Error("VectorDB is not initialized.");
        const results = yield vector_store.similaritySearch(question, 5);
        const response = yield openai.completions.create({
            model: "gpt-3.5-turbo",
            prompt: `Context: ${results.join("\n")}\nQuestion: ${question}\nAnswer:`,
            max_tokens: 150,
        });
        res.status(200).send({ answer: response.choices[0].text.trim() });
    }
    catch (error) {
        console.error("Error handling question:", error);
        res.status(500).send("Internal Server Error");
    }
}));
function loadAndVectorizeDocuments(pdfPaths) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            for (let filePath of pdfPaths) {
                const loader = new pdf_1.PDFLoader(filePath);
                const docs = yield loader.load();
                allDocs = allDocs.concat(docs);
            }
            console.log(allDocs);
            embeddings = new openai_2.OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY || "",
            });
            const pc = yield (0, pinecone_2.getPineconeClient)();
            const pineconeIndex = pc.index("yourlawyer");
            vector_store = yield pinecone_1.PineconeStore.fromDocuments(allDocs, embeddings, {
                pineconeIndex: pineconeIndex,
                namespace: "yourLawyer",
                textKey: "text",
            });
            console.log(vector_store);
        }
        catch (error) {
            console.error("Error loading and vectorizing documents:", error);
        }
    });
}
const pdfFiles = [path_1.default.join(__dirname, "public/Data/requests.pdf")];
const PORT = process.env.PORT || 5000;
function initializeServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield loadAndVectorizeDocuments(pdfFiles);
            app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
        }
        catch (error) {
            console.error("Failed to initialize server:", error);
        }
    });
}
initializeServer();
