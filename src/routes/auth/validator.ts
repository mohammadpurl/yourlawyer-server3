import { body } from "express-validator";

class Validator {
  registerValidation() {
    console.log("registerValidation");
    return [
      body("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Invalid Email")
        .exists(),
      body("password")
        .isLength({ min: 5 })
        .withMessage("Password must be at least 5 chars long")
        .isLength({ max: 30 })
        .withMessage("Password must be at max 30 chars long")
        .matches(/\d/)
        .withMessage("Password must contain a number")
        .exists(),
    ];
  }

  loginValidation() {
    return [
      body("mobile")
        .isString()
        .matches("^09[0-9]{9}$")
        .withMessage("لطفا شماره موبایل را به درستی وارد کنید")
        .exists(),
      body("code")
        .isNumeric()
        .isLength({ min: 5 })
        .withMessage("Verification code must be at least 5 chars long")
        .isLength({ max: 6 })
        .withMessage("Verification code must be at max 6 chars long")
        .exists(),
    ];
  }
}

export default new Validator();
