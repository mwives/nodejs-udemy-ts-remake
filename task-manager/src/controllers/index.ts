import "express-async-errors";

import { Router, Request, Response, NextFunction } from "express";

import refreshTokenRouter from "./refreshTokens";
import tasksRouter from "./tasks";
import usersRouter from "./users";

const router = Router();

router.use("/refresh-token", refreshTokenRouter);
router.use("/tasks", tasksRouter);
router.use("/users", usersRouter);

router.use(
  (err: Error | any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof Error) {
      // User related errors
      if (err.message.match(/.*username.*is required.*/gi)) {
        return res.status(400).json({
          error: "Field username is required",
        });
      }

      if (err.message.match(/.*email.*is required.*/gi)) {
        return res.status(400).json({
          error: "Field email is required",
        });
      }

      if (err.message.includes("Invalid email")) {
        return res.status(400).json({
          error: "Invalid email",
        });
      }

      if (err.message.includes("Cast to date failed")) {
        return res.status(400).json({
          error: "Date format must be YYYY-MM-DD",
        });
      }

      if (err.message.match(/.*password.*is required.*/gi)) {
        return res.status(400).json({
          error: "Field password is required",
        });
      }

      if (err.message.match(/.*password.*is shorter than.*7.*/gi)) {
        return res.status(400).json({
          error: "Password must be at least 7 characters",
        });
      }

      if (err.message.match(/.*(Cast to ObjectId failed).*(User).*/gi)) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      if (err.message === "Token missing" || err.message === "Invalid token") {
        return res.status(401).json({
          error: err.message,
        });
      }

      if (err.message === "Please authenticate") {
        return res.status(401).json({
          error: err.message,
        });
      }

      if (err.message === "File too large") {
        return res.status(400).json({
          error: "The file exceed the max of 2MB",
        });
      }

      // Tasks related errors
      if (err.message.match(/.*(Cast to ObjectId failed).*(Task).*/gi)) {
        return res.status(404).json({
          error: "Task not found",
        });
      }

      if (err.message.match(/.*description.*is required.*/gi)) {
        return res.status(400).json({
          error: "Field description is required",
        });
      }

      // Refresh token related errors
      if (
        err.message.match(/.*(Cast to ObjectId failed).*(RefreshToken).*/gi)
      ) {
        return res.status(404).json({
          error: "Refresh Token not found",
        });
      }

      // General errors
      if (err.message.match(/(Tasks|Task|User) not found/)) {
        return res.status(404).json({
          error: err.message,
        });
      }

      return res.status(400).json({
        error: err.message,
      });
    }

    return res.status(500).json({
      error: "Internal server error",
    });
  }
);

export default router;
