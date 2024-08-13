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
exports.VerifyAccessToken = exports.SignAccessToken = exports.RandomNumberGenerator = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const user_1 = __importDefault(require("../models/user"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function RandomNumberGenerator() {
    return Math.floor(Math.random() * 90000 + 10000);
}
exports.RandomNumberGenerator = RandomNumberGenerator;
function SignAccessToken(userId) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield user_1.default.findById(userId);
            if (!user) {
                return reject(http_errors_1.default.NotFound("User not found"));
            }
            const payload = {
                mobile: user.mobile,
                useID: user._id,
            };
            const options = {
                expiresIn: "1h",
            };
            jsonwebtoken_1.default.sign(payload, process.env.JWT_ACCESS_SECRET, options, (err, token) => {
                if (err) {
                    reject(http_errors_1.default.InternalServerError("something went wrong"));
                }
                resolve(token);
            });
        }
        catch (err) {
            reject(http_errors_1.default.InternalServerError("something went wrong"));
        }
    }));
}
exports.SignAccessToken = SignAccessToken;
function VerifyAccessToken(token) {
    jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if (err) {
            throw http_errors_1.default.Unauthorized("Invalid token");
        }
        return decoded;
    });
}
exports.VerifyAccessToken = VerifyAccessToken;
