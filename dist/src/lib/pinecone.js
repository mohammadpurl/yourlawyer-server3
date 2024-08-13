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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPineconeClient = void 0;
const pinecone_1 = require("@pinecone-database/pinecone");
const dotenv = require("dotenv");
dotenv.config();
const getPineconeClient = () => __awaiter(void 0, void 0, void 0, function* () {
    const pc = new pinecone_1.Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const indexExists = yield pc.describeIndex("yourlawyer");
    if (indexExists) {
        console.log("Pinecone index already exists.");
    }
    else {
        yield pc.createIndex({
            name: "yourlawyer",
            dimension: 1536,
            spec: { serverless: { cloud: "aws", region: "us-east-1" } },
        });
    }
    return pc;
});
exports.getPineconeClient = getPineconeClient;
// Create a serverless index
// "dimension" needs to match the dimensions of the vectors you upsert
// await pc.createIndex({ name: 'products', dimension: 1536,
//     spec: { serverless: { cloud: 'aws', region: 'us-east-1', } }
// })
// // Target the index
// const index = pc.index('products');
// // Mock vector and metadata objects (you would bring your own)
// const records = [{
//   id: 'some_id',
//   values: [0.010, 2.34,...],
//   metadata: { id: 3056, description: 'Networked neural adapter' },
// }]
// // Upsert your vector(s)
// await index.upsert(records)
