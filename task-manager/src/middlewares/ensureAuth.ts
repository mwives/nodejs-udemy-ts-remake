import { NextFunction, Request, Response } from "express";
import { decode, Secret, verify } from "jsonwebtoken";

import { User } from "../models/User";

import { IUser } from "../ts/interfaces/user_interface";

export async function ensureAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) throw new Error("Token missing");

  try {
    const token = authHeader.split(" ")[1];

    verify(token, process.env.JWT_SECRET as Secret);

    const decoded = decode(token);

    const userId = decoded?.sub;
    const user = (await User.findById(userId)) as IUser;

    if (!user) throw new Error("Please authenticate");

    req.user = user;

    next();
  } catch (err) {
    throw new Error("Please authenticate");
  }
}
