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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Create the schema corresponding to the document interface.
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        unique: true,
        required: false,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression allowing periods in the email address
    },
    password: { type: String, required: false },
    firstName: { type: String },
    lastName: { type: String },
    address: { type: String },
    sexuality: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Sexuality" },
    education: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Education" },
    title: { type: mongoose_1.default.Schema.Types.ObjectId, ref: "Title" },
    mobile: { type: String, required: false },
    birthDate: { type: Date },
    lastRefreshToken: { type: String },
    confirmedEmail: { type: Boolean },
    otp: {
        type: Object,
        default: {
            code: 0,
            expiresIn: 0,
        },
    },
    roles: { type: [String] },
});
// Apply the timestamp plugin to add `createdAt` and `updatedAt` fields.
// UserSchema.plugin(timestamp);
// Create the model based on the schema and interface.
const User = mongoose_1.default.model("User", UserSchema);
exports.default = User;
