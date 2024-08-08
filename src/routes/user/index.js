const express = require("express");
const router = express.Router();
const controller = require("./controller");
const validator = require("./validator");

router.get(
  "/patients",
  // validator.paRegisterValidation(),
  // controller.validate,
  controller.getALlPatientList
);
router.post(
  "/patients",
  // validator.paRegisterValidation(),
  // controller.validate,
  controller.patientRegister
);

module.exports = router;
