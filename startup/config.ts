import { Express } from "express";

export default function setupApp(
  app: Express,
  express: typeof import("express")
): void {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));
}
