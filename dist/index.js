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
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: "*" }));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(express_1.default.json());
require("./startup/config")(app, express_1.default);
require("./startup/db")();
app.use("/api", routes_1.default);
app.get("/", (req, res) => {
    res.send("Hello, secure world!");
});
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || "",
});
let vectordb;
let allDocs = [];
let embeddings;
let vector_store;
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
        vector_store.similaritySearch(question, 10);
        console.log(`vectordb is ${vectordb}`);
    }
    catch (error) {
        throw new Error(`Failed to vectorize: ${error.message}`);
    }
    try {
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
