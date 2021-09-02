import { Model, Types } from "mongoose";

interface IRefreshToken {
  userId: Types.ObjectId;
  expiresIn: number;
  token: string;
}

interface IRefreshTokenModel extends Model<IRefreshToken> {
  generate(
    userId: Types.ObjectId
  ): Promise<{ refreshToken: IRefreshToken; token: string }>;

  deleteExpired(
    userId: Types.ObjectId
  ): Promise<IRefreshToken[] | IRefreshToken>;
}

export { IRefreshToken, IRefreshTokenModel };
