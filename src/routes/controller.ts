// import autoBind from "auto-bind-inheritance";
import { validationResult, ValidationError } from "express-validator";
import { Request, Response, NextFunction } from "express";
import User from "../models/user";

interface ResponseParams {
  res: Response;
  message: string;
  code?: number;
  data?: any;
  status?: number;
}

export default class BaseController {
  protected User = User;

  constructor() {
    // autoBind(this);
  }

  validationBody(req: Request, res: Response): boolean {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      const errors = result.array();
      const messages = errors.map((err: ValidationError) => err.msg);
      res.status(400).json({
        message: "validation error",
        data: messages,
      });
      return false;
    }
    return true;
  }

  validate(req: Request, res: Response, next: NextFunction): void {
    if (!this.validationBody(req, res)) {
      return;
    }
    next();
  }

  response({ res, message, code = 200, data = {} }: ResponseParams): void {
    res.status(code).json({
      message,
      data,
    });
  }
}
