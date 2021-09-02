import { Router } from "express";
import { Secret, sign } from "jsonwebtoken";

import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const refreshToken = await RefreshToken.findById(req.body.refreshToken);

    if (!refreshToken) {
      throw new Error("Refresh token not provided");
    }

    const user = await User.findById(refreshToken.userId);

    if (!user) {
      throw new Error("Invalid refresh token");
    }

    await RefreshToken.deleteExpired(user._id);

    const token = sign({}, process.env.JWT_SECRET as Secret, {
      subject: user._id.toString(),
      expiresIn: "15s",
    });

    return res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;
