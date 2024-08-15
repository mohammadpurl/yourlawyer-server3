"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelatedDataAsRetrieval = void 0;
const openai_1 = require("@langchain/openai");
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const document_1 = require("langchain/util/document");
const output_parsers_1 = require("@langchain/core/output_parsers");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const embeddings = new openai_1.OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_KEY,
});
const chatModel = new openai_1.ChatOpenAI({
    openAIApiKey: process.env.OPENAI_KEY,
});
let retrieval;
function configChroma() {
    return __awaiter(this, void 0, void 0, function* () {
        const vectorStore = yield chroma_1.Chroma.fromExistingCollection(embeddings, {
            collectionName: "c-test-collection",
            url: `http://${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}`,
            collectionMetadata: {
                "hnsw:space": "cosine",
            },
        });
        retrieval = vectorStore.asRetriever();
    });
}
const getRelatedDataAsRetrieval = (params) => __awaiter(void 0, void 0, void 0, function* () {
    configChroma();
    const SYSTEM_TEMPLATE = `Use the following pieces of context to answer the question at the end.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    ----------------
    {context}`;
    const messages = [
        prompts_1.SystemMessagePromptTemplate.fromTemplate(SYSTEM_TEMPLATE),
        prompts_1.HumanMessagePromptTemplate.fromTemplate("{input}"),
    ];
    const prompt = prompts_1.ChatPromptTemplate.fromMessages(messages);
    const chain = runnables_1.RunnableSequence.from([
        {
            context: retrieval.pipe(document_1.formatDocumentsAsString),
            input: new runnables_1.RunnablePassthrough(),
        },
        prompt,
        chatModel,
        new output_parsers_1.StringOutputParser(),
    ]);
    const answer = yield chain.invoke(params.input);
    return answer;
});
exports.getRelatedDataAsRetrieval = getRelatedDataAsRetrieval;
