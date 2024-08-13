import mongoose, { Document, Schema } from "mongoose";
// import timestamp from "mongoose-timestamp";

// Define an interface representing a document in MongoDB.
interface IUser extends Document {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  sexuality?: mongoose.Types.ObjectId;
  education?: mongoose.Types.ObjectId;
  title?: mongoose.Types.ObjectId;
  mobile?: string;
  birthDate?: Date;
  lastRefreshToken?: string;
  confirmedEmail?: boolean;
  otp: {
    code: number;
    expiresIn: number;
  };
  roles: string[];
}

// Create the schema corresponding to the document interface.
const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    unique: true,
    required: false,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression allowing periods in the email address
  },
  password: { type: String, required: false },
  firstName: { type: String },
  lastName: { type: String },
  address: { type: String },
  sexuality: { type: mongoose.Schema.Types.ObjectId, ref: "Sexuality" },
  education: { type: mongoose.Schema.Types.ObjectId, ref: "Education" },
  title: { type: mongoose.Schema.Types.ObjectId, ref: "Title" },
  mobile: { type: String, required: false },
  birthDate: { type: Date },
  lastRefreshToken: { type: String },
  confirmedEmail: { type: Boolean },
  otp: {
    type: Object,
    default: {
      code: 0,
      expiresIn: 0,
    },
  },
  roles: { type: [String] },
});

// Apply the timestamp plugin to add `createdAt` and `updatedAt` fields.
// UserSchema.plugin(timestamp);

// Create the model based on the schema and interface.
const User = mongoose.model<IUser>("User", UserSchema);

export default User;
