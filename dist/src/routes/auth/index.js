"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = __importDefault(require("./controller"));
const validator_1 = __importDefault(require("./validator"));
const router = express_1.default.Router();
router.post("/get-otp", 
// validator.registerValidation(),
controller_1.default.validate, controller_1.default.getOtp);
router.post("/check-otp", validator_1.default.loginValidation(), controller_1.default.validate, controller_1.default.checkOtp);
// router.post("/verifycode", controller.checkVerifyCode);
exports.default = router;
