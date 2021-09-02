import dayjs from "dayjs";
import { Secret, sign } from "jsonwebtoken";
import { model, Schema, Types } from "mongoose";

import {
  IRefreshToken,
  IRefreshTokenModel,
} from "../ts/interfaces/refresh_token_interface";

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Types.ObjectId,
    required: true,
    ref: "User",
  },
  expiresIn: {
    type: Number,
    required: true,
  },
});

// This should clean the database from unused refresh tokens
// generated by multiple devices by a specific user
refreshTokenSchema.statics.deleteExpired = async function (
  userId: Types.ObjectId
) {
  const refreshTokens = await RefreshToken.find({ userId });

  refreshTokens.forEach(async (refreshToken) => {
    const refreshTokenExpired = dayjs().isAfter(
      dayjs.unix(refreshToken.expiresIn)
    );

    if (refreshTokenExpired) {
      await refreshToken.delete();
    }
  });
};

refreshTokenSchema.statics.generate = async function (userId: Types.ObjectId) {
  const expiresIn = dayjs().add(200, "days").unix();

  const refreshToken = await RefreshToken.create({
    userId,
    expiresIn,
  });

  const token = sign({}, process.env.JWT_SECRET as Secret, {
    subject: userId.toString(),
    expiresIn: "200d",
  });

  return { refreshToken, token };
};

const RefreshToken = model<IRefreshToken, IRefreshTokenModel>(
  "RefreshToken",
  refreshTokenSchema
);

export { RefreshToken };
