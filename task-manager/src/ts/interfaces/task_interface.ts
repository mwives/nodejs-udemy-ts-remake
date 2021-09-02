import { Document } from "mongoose";

interface ITask extends Document {
  description: string;
  completed: boolean;
}

export { ITask };
