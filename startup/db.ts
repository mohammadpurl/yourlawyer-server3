import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default function connectToDatabase(): void {
  mongoose
    .connect(
      "mongodb+srv://mohamadporl:bRlEDJWCH6DxcOfV@yourlawyer.b0oa6ve.mongodb.net/"
    )
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.error("Could not connect to MongoDB", error));
}
