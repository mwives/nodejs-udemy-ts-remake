import express from "express";
import { IUser } from "../../interfaces/user_interface";

declare global {
  namespace Express {
    interface Request {
      user?: Record<IUser>;
    }
  }
}
