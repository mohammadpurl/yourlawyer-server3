import express from "express";
import AuthController from "./controller";
import validator from "./validator";

const router = express.Router();

router.post(
  "/get-otp",
  // validator.registerValidation(),
  AuthController.validate,
  AuthController.getOtp
);

router.post(
  "/check-otp",
  validator.loginValidation(),
  AuthController.validate,
  AuthController.checkOtp
);

// router.post("/verifycode", controller.checkVerifyCode);

export default router;
