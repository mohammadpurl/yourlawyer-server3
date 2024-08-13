import createHttpError from "http-errors";
import User from "../models/user";
import JWT from "jsonwebtoken";

function RandomNumberGenerator(): number {
  return Math.floor(Math.random() * 90000 + 10000);
}

function SignAccessToken(userId: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return reject(createHttpError.NotFound("User not found"));
      }

      const payload = {
        mobile: user.mobile,
        useID: user._id,
      };
      const options = {
        expiresIn: "1h",
      };

      JWT.sign(
        payload,
        process.env.JWT_ACCESS_SECRET as string,
        options,
        (err, token) => {
          if (err) {
            reject(createHttpError.InternalServerError("something went wrong"));
          }
          resolve(token as string);
        }
      );
    } catch (err) {
      reject(createHttpError.InternalServerError("something went wrong"));
    }
  });
}

function VerifyAccessToken(token: string): void {
  JWT.verify(token, process.env.JWT_ACCESS_SECRET as string, (err, decoded) => {
    if (err) {
      throw createHttpError.Unauthorized("Invalid token");
    }
    return decoded;
  });
}

export { RandomNumberGenerator, SignAccessToken, VerifyAccessToken };
