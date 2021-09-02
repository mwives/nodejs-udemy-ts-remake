import { Secret, sign } from "jsonwebtoken";
import { Types } from "mongoose";

import { RefreshToken } from "../../src/models/RefreshToken";
import { Task } from "../../src/models/Task";
import { User } from "../../src/models/User";

const frodoUser = {
  _id: Types.ObjectId(),
  username: "Frodo",
  email: "frodo@baggins.com",
  birthday: "2968-09-22",
  password: "Samwise.S2!",
};

const frodoToken = sign({}, process.env.JWT_SECRET as Secret, {
  subject: frodoUser._id.toString(),
  expiresIn: "20s",
});

const frodoTask = {
  _id: Types.ObjectId(),
  description: "Destroy the ring",
  completed: false,
  owner: frodoUser._id,
};

const bilboTask = {
  _id: Types.ObjectId(),
  description: "Water Bilbo's plants",
  completed: false,
  owner: Types.ObjectId(),
};

async function setupUserDB() {
  await new User(frodoUser).save();
}

async function setupTaskDB() {
  await new Task(bilboTask).save();
  await new Task(frodoTask).save();
  await new User(frodoUser).save();
}

async function cleanDB() {
  await Task.deleteMany();
  await User.deleteMany();
  await RefreshToken.deleteMany();
}

export {
  bilboTask,
  cleanDB,
  frodoTask,
  frodoToken,
  frodoUser,
  setupTaskDB,
  setupUserDB,
};
