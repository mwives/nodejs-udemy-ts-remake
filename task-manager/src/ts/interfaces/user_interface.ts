import { JwtPayload } from "jsonwebtoken";
import { Model, Types } from "mongoose";

interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  birthday: Date;
  password?: string;
  avatar: Buffer;
  generateAuthToken(): Promise<JwtPayload>;
}

interface IUserModel extends Model<IUser> {
  findByCredentials(email: string, password: string): Promise<IUser>;
}

export { IUser, IUserModel };
