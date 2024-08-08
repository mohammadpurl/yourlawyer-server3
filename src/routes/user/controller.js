const controller = require("./../controller");
const _ = require("lodash");
const { RecursiveCharacterTextSplitter } = require("langchain-text-splitters");
const pdf = require("pdf-parse");
const { OpenAIApi, Configuration } = require("@openai/api");
const { Chroma } = require("chromadb");
const fs = require("fs");

module.exports = new (class extends controller {
  //get all visit list for a patient
  async getALlPatientList(req, res) {
    try {
      console.log("getALlPatientList");

      let userInfo = await this.Patient.find({ user: req.user._id })
        .populate("user", "email")
        .populate("religion", "name -_id")
        .populate("nationality", "name -_id")
        .populate("sexuality", "name -_id")
        .populate("mStatus", "name -_id")
        .populate("languages", "name -_id")
        .populate("education", "name -_id")
        .populate("title", "name _id")
        .populate("country", "name  code _id");

      const processedObjects = userInfo?.map((userInfo) =>
        this.processObject(userInfo, "show")
      );
      this.response({
        res,
        message: "",
        data: processedObjects,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: false, message: "something went wrong", data: error });
    }
  }
  // *********************Register patients**********************
  async patientRegister(req, res) {
    try {
      const userId = req.user._id;
      console.log("patientRegister");
      let patient = new this.Patient(
        _.pick(req.body, [
          "sexuality",
          "title",
          "firstName",
          "lastName",
          "address",
          "country",
          "mobileNumber",
          "nationality",
          "religion",
          "mStatus",
          "education",
          "languages",
          "occupation",
          "height",
          "weight",
          "hoursWorked",
          "birthDate",
          "editable",
        ])
      );

      patient.user = userId;
      const response = await patient.save();

      console.log(`patient register ${response}`);
      const respondePatient = this.processObject(response);
      this.updateProfile(req, res);
      this.response({
        res,
        message: "the user successfully registered",
        data: respondePatient,
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: false, message: "something went wrong", data: error });
    }
  }
})();
