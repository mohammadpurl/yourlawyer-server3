const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config();
module.exports = function () {
  mongoose
    .connect(
      "mongodb+srv://mohamadporl:bRlEDJWCH6DxcOfV@yourlawyer.b0oa6ve.mongodb.net/"
    )

    .then(() => console.log("connected to mongodb"))
    .catch(() => console.log("could not connect"));
};
