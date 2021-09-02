import { model, Schema } from "mongoose";

import { ITask } from "../ts/interfaces/task_interface";

const taskSchema = new Schema<ITask>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.methods.toJSON = function () {
  const task = this;
  const taskObj = task.toObject();

  delete taskObj.__v;

  return taskObj;
};

const Task = model<ITask>("Task", taskSchema);

export { Task };
