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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_errors_1 = __importDefault(require("http-errors"));
// import { sendSMS } from "../sms/Kavenegar";
const dotenv_1 = __importDefault(require("dotenv"));
const controller_1 = __importDefault(require("../controller"));
const function_1 = require("../../utills/function");
const constans_1 = require("../../utills/constans");
dotenv_1.default.config();
class AuthController extends controller_1.default {
    // *********************getOtp**********************
    getOtp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mobile } = req.body;
                console.log(mobile);
                const code = (0, function_1.RandomNumberGenerator)();
                const result = yield this.saveUser(mobile, code.toString());
                // if (!result)
                //   throw createHttpError.BadRequest("مشکلی در ورود ایجاد شده است");
                // const isSend = sendSMS(mobile, code);
                this.response({
                    res,
                    message: "کد اعتبار سنجی با موفقیت برای شما ارسال شد",
                    data: { code, result },
                });
            }
            catch (error) {
                console.error(error);
                res
                    .status(500)
                    .json({ status: true, message: "something went wrong", data: error });
            }
        });
    }
    // *********************check otp**********************
    checkOtp(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { mobile, code } = req.body;
                const user = yield this.User.findOne({ mobile });
                if (!user) {
                    this.response({
                        res,
                        message: "کاربر یافت نشد",
                        status: 500,
                    });
                    return;
                }
                if (user.otp.code !== code) {
                    this.response({
                        res,
                        message: "کد ارسال شده صحیح نمی باشد",
                        status: 500,
                    });
                    throw http_errors_1.default.Unauthorized("کد ارسال شده صحیح نمی باشد");
                }
                if (user.otp.expiresIn < Date.now()) {
                    this.response({
                        res,
                        message: "کد شما منقضی شده است",
                        status: 500,
                    });
                    throw http_errors_1.default.Unauthorized("کد شما منقضی شده است");
                }
                const accessToken = yield (0, function_1.SignAccessToken)((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString());
                this.response({
                    res,
                    message: "successfuly loged in",
                    data: { accessToken },
                });
            }
            catch (error) {
                console.error(error);
                next(error);
            }
        });
    }
    // *********************saveUser**********************
    saveUser(mobile, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.checkExitUser(mobile);
            let otp = {
                code,
                expiresIn: constans_1.EXPIRES_IN,
            };
            if (result) {
                return yield this.updateUser(mobile, { otp });
            }
            const user = yield this.User.create({
                mobile,
                otp,
                roles: [constans_1.USERS_ROLES],
            });
            return !!user;
        });
    }
    // *********************checkExitUser**********************
    checkExitUser(mobile) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.User.findOne({ mobile });
            return !!user;
        });
    }
    // *********************updateUser**********************
    updateUser(mobile_1) {
        return __awaiter(this, arguments, void 0, function* (mobile, objectData = {}) {
            Object.keys(objectData).forEach((key) => {
                if (["", " ", 0, null, NaN, undefined, "0"].includes(objectData[key])) {
                    delete objectData[key];
                }
            });
            const updateResult = yield this.User.updateOne({ mobile }, { $set: objectData });
            return !!updateResult.modifiedCount;
        });
    }
    // *********************GetAccessToken**********************
    GetAccessToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user_id = req.userData.sub;
                const access_token = jsonwebtoken_1.default.sign({ sub: user_id }, process.env.JWT_ACCESS_SECRET, { expiresIn: process.env.JWT_ACCESS_TIME });
                const refresh_token = yield this.GenerateRefreshToken(user_id);
                res.json({
                    status: true,
                    message: "success",
                    data: { access_token, refresh_token },
                });
            }
            catch (error) {
                console.error(error);
            }
        });
    }
    // *********************GenerateRefreshToken**********************
    GenerateRefreshToken(user_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const refresh_token = jsonwebtoken_1.default.sign({ sub: user_id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_TIME });
                yield this.User.findOneAndUpdate({ _id: user_id }, { $set: { lastRefreshToken: refresh_token } });
                return refresh_token;
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        });
    }
    // *********************verifyRefreshToken**********************
    verifyRefreshToken(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.body.token;
                if (!token) {
                    res.status(401).json({ status: false, message: "Invalid request." });
                    return;
                }
                const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_REFRESH_SECRET);
                req.userData = decoded;
                const user = yield this.User.findById(decoded.sub);
                if (!user || !user.lastRefreshToken || user.lastRefreshToken !== token) {
                    res.status(401).json({
                        status: false,
                        message: "Invalid request. Token is not in store or does not match.",
                    });
                    return;
                }
                next();
            }
            catch (error) {
                res.status(401).json({
                    status: false,
                    message: "Your session is not valid. Relogin now.",
                    data: error,
                });
            }
        });
    }
}
exports.default = new AuthController();
