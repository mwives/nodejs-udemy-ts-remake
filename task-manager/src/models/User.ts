import { compare, hash } from "bcrypt";
import { Secret, sign } from "jsonwebtoken";
import { model, Schema } from "mongoose";
import validator from "validator";

import { RefreshToken } from "./RefreshToken";
import { Task } from "./Task";

import { IUser, IUserModel } from "../ts/interfaces/user_interface";

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    birthday: Date,
    password: {
      type: String,
      required: true,
      minLength: 7,
    },
    avatar: Buffer,
  },
  {
    timestamps: true,
  }
);

userSchema.virtual("tasks", {
  ref: "Task",
  localField: "_id",
  foreignField: "owner",
});

userSchema.statics.findByCredentials = async function (
  email: string,
  password: string
) {
  const user = await User.findOne({ email });

  if (!user) throw new Error("Email or password incorrect");

  const isMatch = await compare(password, user.password!);

  if (!isMatch) throw new Error("Email or password incorrect");

  return user;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = sign({}, process.env.JWT_SECRET as Secret, {
    subject: user._id.toString(),
    expiresIn: "30m",
  });

  return token;
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObj = user.toObject();

  delete userObj.password;
  delete userObj.__v;

  return userObj;
};

userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await hash(user.password!, 8);
  }

  next();
});

userSchema.pre("remove", async function (next) {
  const user = this;

  await Task.deleteMany({ owner: user._id });
  await RefreshToken.deleteMany({ userId: user._id });

  next();
});

const User = model<IUser, IUserModel>("User", userSchema);

export { User };
