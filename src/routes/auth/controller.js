const controller = require("./../controller");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  RandomNumberGenerator,
  SignAccessToken,
} = require("../../utills/function");
const { EXPIRES_IN, USERS_ROLES } = require("../../utills/constans");
const createHttpError = require("http-errors");

// const { sendSMS } = require("../sms/Kavenegar");
require("dotenv").config();

module.exports = new (class extends controller {
  // *********************getOtp**********************
  async getOtp(req, res) {
    try {
      const { mobile } = req.body;
      console.log(mobile);
      const code = RandomNumberGenerator();
      console.log("codellllllllllllllllllllllllllllllll");
      const result = await this.saveUser(mobile, code);
      // if (!result)
      //   throw createHttpError.BadRequest("مشکلی در ورود ایجاد شده است");
      // const isSend = sendSMS(mobile, code);
      this.response({
        res,
        message: "کد اعتبار سنجی با موفقیت برای شما ارسال شد",
        data: { code, result },
      });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ status: true, message: "something went wrong", data: error });
    }
  }
  // *********************check otp**********************
  async checkOtp(req, res, next) {
    try {
      // await checkOtpSchema.validateAsync(req.body);
      console.log("++++++++++++++++++++++++");
      const { mobile, code } = req.body;
      console.log(`mobile: ${mobile} code:${code}`);
      const user = await this.User.findOne({ mobile: mobile });
      console.log(user?.otp?.code);
      if (!user) {
        console.log("!user");
        this.response({
          res,
          message: "کاربر یافت نشد",
          status: 500,
        });
      }

      if (user?.otp?.code != code) {
        this.response({
          res,
          message: "کد ارسال شده صحیح نمی باشد",
          status: 500,
        });
        throw createHttpError.Unauthorized("کد ارسال شده صحیح نمی باشد");
      }

      if (user?.otp?.expiresIn < Date.now()) {
        this.response({
          res,
          message: "کد شما منقضی شده است",
          status: 500,
        });
        throw createHttpError.Unauthorized("کد شما منقضی شده است");
      }

      const accessToken = await SignAccessToken(user?._id);
      this.response({
        res,
        message: "successfuly loged in",
        data: { accessToken },
      });
    } catch (error) {
      // next(error);
      console.log(error);
    }
  }
  // *********************saveUser**********************

  async saveUser(mobile, code) {
    const result = await this.checkExitUser(mobile);
    console.log("checkExitUser", result);
    let otp = {
      code,
      expiresIn: EXPIRES_IN,
    };
    console.log(otp);
    if (result) {
      return await this.updateUser(mobile, { otp });
    }
    const user = await this.User.create({
      mobile: mobile,
      otp,
      roles: [USERS_ROLES],
    });
    console.log(user);
    return !!user;
  }
  // *********************checkExitUser**********************
  async checkExitUser(mobile) {
    const user = await this.User.findOne({ mobile: mobile });
    return !!user;
  }
  // *********************updateUser**********************
  async updateUser(mobile, objectData = {}) {
    Object.keys(objectData).forEach((key) => {
      if (["", " ", 0, null, NaN, undefined, "0"].includes(objectData[key]))
        delete objectData[key];
    });
    const updateResult = await this.User.updateOne(
      { mobile },
      { $set: objectData }
    );
    return !!updateResult.modifiedCount;
  }
  // *********************login**********************

  // *********************login**********************

  async GetAccessToken(req, res) {
    try {
      const user_id = req.userData.sub;

      const access_token = jwt.sign(
        { sub: user_id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_TIME }
      );
      console.log(`GetAccessToken${access_token}`);
      const refresh_token = await this.GenerateRefreshToken(user_id);
      console.log(`GetAccessToken${refresh_token}`);
      return res.json({
        status: true,
        message: "success",
        data: { access_token, refresh_token },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async GenerateRefreshToken(user_id) {
    try {
      const refresh_token = jwt.sign(
        { sub: user_id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_TIME }
      );

      const result = await this.User.findOneAndUpdate(
        { _id: user_id },
        { $set: { lastRefreshToken: refresh_token } }
      );

      return refresh_token;
    } catch (error) {
      console.log(error);
    }
  }

  async verifyRefreshToken(req, res, next) {
    try {
      const token = req.body.token;
      if (token === null)
        return res
          .status(401)
          .json({ status: false, message: "Invalid request." });
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      req.userData = decoded;
      console.log(`decoded${decoded.sub}`);

      const user = await this.User.findById(decoded.sub);
      console.log(`lmp verifyRefreshToken user${user}`);
      if (!user || !user.lastRefreshToken) {
        return res.status(401).json({
          status: false,
          message: "Invalid request. Token is not in store.",
        });
      }

      if (user.lastRefreshToken != token) {
        console.log("user.lastRefreshToken != token");
        return res.status(401).json({
          status: false,
          message: "Invalid request. Token is not same in store.",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        status: false,
        message: "Your session is not valid.Relogin now",
        data: error,
      });
    }
  }
})();
