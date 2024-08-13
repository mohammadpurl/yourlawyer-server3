import express from "express";
import authRouter from "./auth";
// import errorMiddleware from "./../middlewares/error";

const router = express.Router();

router.use("/auth", authRouter);

// router.use(errorMiddleware);

export default router;
