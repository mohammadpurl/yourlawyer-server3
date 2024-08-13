import { Request, Response, NextFunction } from "express";
import _ from "lodash";
import jwt from "jsonwebtoken";
import createHttpError from "http-errors";
// import { sendSMS } from "../sms/Kavenegar";
import dotenv from "dotenv";
import Controller from "../controller";
import { RandomNumberGenerator, SignAccessToken } from "../../utills/function";
import { EXPIRES_IN, USERS_ROLES } from "../../utills/constans";

dotenv.config();

class AuthController extends Controller {
  // *********************getOtp**********************
  async getOtp(req: Request, res: Response): Promise<void> {
    try {
      const { mobile } = req.body;
      console.log(mobile);
      const code = RandomNumberGenerator();
      const result = await this.saveUser(mobile, code.toString());
      // if (!result)
      //   throw createHttpError.BadRequest("مشکلی در ورود ایجاد شده است");
      // const isSend = sendSMS(mobile, code);
      this.response({
        res,
        message: "کد اعتبار سنجی با موفقیت برای شما ارسال شد",
        data: { code, result },
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ status: true, message: "something went wrong", data: error });
    }
  }

  // *********************check otp**********************
  async checkOtp(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { mobile, code } = req.body;
      const user = await this.User.findOne({ mobile });
      if (!user) {
        this.response({
          res,
          message: "کاربر یافت نشد",
          status: 500,
        });
        return;
      }

      if (user.otp.code !== code) {
        this.response({
          res,
          message: "کد ارسال شده صحیح نمی باشد",
          status: 500,
        });
        throw createHttpError.Unauthorized("کد ارسال شده صحیح نمی باشد");
      }

      if (user.otp.expiresIn < Date.now()) {
        this.response({
          res,
          message: "کد شما منقضی شده است",
          status: 500,
        });
        throw createHttpError.Unauthorized("کد شما منقضی شده است");
      }

      const accessToken = await SignAccessToken(user?._id?.toString()!);
      this.response({
        res,
        message: "successfuly loged in",
        data: { accessToken },
      });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

  // *********************saveUser**********************
  async saveUser(mobile: string, code: string): Promise<boolean> {
    const result = await this.checkExitUser(mobile);
    let otp = {
      code,
      expiresIn: EXPIRES_IN,
    };
    if (result) {
      return await this.updateUser(mobile, { otp });
    }
    const user = await this.User.create({
      mobile,
      otp,
      roles: [USERS_ROLES],
    });
    return !!user;
  }

  // *********************checkExitUser**********************
  async checkExitUser(mobile: string): Promise<boolean> {
    const user = await this.User.findOne({ mobile });
    return !!user;
  }

  // *********************updateUser**********************
  async updateUser(
    mobile: string,
    objectData: Record<string, any> = {}
  ): Promise<boolean> {
    Object.keys(objectData).forEach((key) => {
      if (["", " ", 0, null, NaN, undefined, "0"].includes(objectData[key])) {
        delete objectData[key];
      }
    });
    const updateResult = await this.User.updateOne(
      { mobile },
      { $set: objectData }
    );
    return !!updateResult.modifiedCount;
  }

  // *********************GetAccessToken**********************
  async GetAccessToken(req: any, res: Response): Promise<void> {
    try {
      const user_id = req.userData.sub;

      const access_token = jwt.sign(
        { sub: user_id },
        process.env.JWT_ACCESS_SECRET!,
        { expiresIn: process.env.JWT_ACCESS_TIME }
      );

      const refresh_token = await this.GenerateRefreshToken(user_id);
      res.json({
        status: true,
        message: "success",
        data: { access_token, refresh_token },
      });
    } catch (error) {
      console.error(error);
    }
  }

  // *********************GenerateRefreshToken**********************
  async GenerateRefreshToken(user_id: string): Promise<string> {
    try {
      const refresh_token = jwt.sign(
        { sub: user_id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_TIME }
      );

      await this.User.findOneAndUpdate(
        { _id: user_id },
        { $set: { lastRefreshToken: refresh_token } }
      );

      return refresh_token;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // *********************verifyRefreshToken**********************
  async verifyRefreshToken(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const token = req.body.token;
      if (!token) {
        res.status(401).json({ status: false, message: "Invalid request." });
        return;
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET!
      ) as jwt.JwtPayload;
      req.userData = decoded;

      const user = await this.User.findById(decoded.sub);
      if (!user || !user.lastRefreshToken || user.lastRefreshToken !== token) {
        res.status(401).json({
          status: false,
          message: "Invalid request. Token is not in store or does not match.",
        });
        return;
      }

      next();
    } catch (error) {
      res.status(401).json({
        status: false,
        message: "Your session is not valid. Relogin now.",
        data: error,
      });
    }
  }
}

export default new AuthController();
