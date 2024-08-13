"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import autoBind from "auto-bind-inheritance";
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
class BaseController {
    constructor() {
        this.User = user_1.default;
        // autoBind(this);
    }
    validationBody(req, res) {
        const result = (0, express_validator_1.validationResult)(req);
        if (!result.isEmpty()) {
            const errors = result.array();
            const messages = errors.map((err) => err.msg);
            res.status(400).json({
                message: "validation error",
                data: messages,
            });
            return false;
        }
        return true;
    }
    validate(req, res, next) {
        if (!this.validationBody(req, res)) {
            return;
        }
        next();
    }
    response({ res, message, code = 200, data = {} }) {
        res.status(code).json({
            message,
            data,
        });
    }
}
exports.default = BaseController;
