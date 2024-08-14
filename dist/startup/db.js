"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = connectToDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function connectToDatabase() {
    mongoose_1.default
        .connect("mongodb+srv://mohamadporl:bRlEDJWCH6DxcOfV@yourlawyer.b0oa6ve.mongodb.net/")
        .then(() => console.log("Connected to MongoDB"))
        .catch((error) => console.error("Could not connect to MongoDB", error));
}
