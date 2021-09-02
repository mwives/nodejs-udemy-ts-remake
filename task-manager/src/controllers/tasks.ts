import { Router } from "express";

import { ensureAuth } from "../middlewares/ensureAuth";
import { Task } from "../models/Task";

import { Map } from "../ts/interfaces/utils";

const router = Router();

router.post("/", ensureAuth, async (req, res, next) => {
  try {
    const user = req.user;
    const task = await Task.create({
      description: req.body.description,
      completed: req.body.completed,
      owner: user._id,
    });

    await task.save();
    return res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.get("/", ensureAuth, async (req, res, next) => {
  try {
    const sort = {} as { updatedAt: -1 | 1 };
    const match = {} as { completed: boolean };
    let limit = 0;
    let skip = 0;

    if (req.query.completed) {
      if (req.query.completed !== "true" && req.query.completed !== "false") {
        throw new Error("Completed option must be 'true' or 'false'");
      }

      match.completed = req.query.completed === "true";
    }

    if (req.query.sort) {
      if (req.query.sort !== "asc" && req.query.sort !== "desc") {
        throw new Error("Sort option must be 'asc' or 'desc'");
      }

      sort.updatedAt = req.query.sort === "asc" ? 1 : -1;
    }

    if (req.query.limit) {
      if (typeof req.query.limit === "string") {
        limit = parseInt(req.query.limit);
      }
    }

    if (req.query.skip) {
      if (typeof req.query.skip === "string") {
        skip = parseInt(req.query.skip);
      }
    }

    const user = req.user;

    await user
      .populate({
        path: "tasks",
        match,
        options: {
          sort,
          limit,
          skip,
        },
      })
      .execPopulate();

    return res.json(user.tasks);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", ensureAuth, async (req, res, next) => {
  try {
    const allowedUpdates = ["description", "completed"];
    const updates = Object.keys(req.body);

    updates.forEach((update) => {
      if (allowedUpdates.indexOf(update) === -1) {
        throw new Error(`Invalid update: ${update}`);
      }
    });

    const task = (await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    })) as Map;

    if (!task) throw new Error("Task not found");

    updates.forEach((update) => {
      task[update] = req.body[update];
    });

    await task.save();
    return res.json(task);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", ensureAuth, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) throw new Error("Task not found");

    await task.delete();
    return res.json(task);
  } catch (err) {
    next(err);
  }
});

export default router;
