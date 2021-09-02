import request, { Response } from "supertest";

import app from "../src/app";
import { Task } from "../src/models/Task";

import {
  bilboTask,
  cleanDB,
  frodoTask,
  frodoToken,
  setupTaskDB,
} from "./fixtures/db";

import { ITask } from "../src/ts/interfaces/task_interface";

describe("Task", () => {
  beforeAll(setupTaskDB);

  describe("Create", () => {
    it("should create a task", async () => {
      const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          description: "   Protect Sam    ",
          completed: false,
        })
        .expect(201);

      const task = await Task.findById(response.body._id);

      expect(task).not.toBeNull();

      expect(response.body).toMatchObject({
        description: "Protect Sam",
        completed: false,
      });
    });

    it("shouldn't create task on invalid fields", async () => {
      const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          desc: "Protect Sam", // Description (not desc) is required
          completed: false, // Not required; default: false
        })
        .expect(400);

      expect(response.body.error).toBe("Field description is required");
    });

    // Since all routes that requires auth use the same middleware,
    // testing only one case of bad authentication is enough
    it("shouldn't create task if not authenticated", async () => {
      let response: Response;

      response = await request(app)
        .post("/tasks")
        .send({
          description: "Protect Sam",
          completed: false,
        })
        .expect(401);

      expect(response.body.error).toBe("Token missing");

      response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${frodoToken}A`)
        .send({
          description: "Protect Sam",
          completed: false,
        })
        .expect(401);

      expect(response.body.error).toBe("Please authenticate");
    });
  });

  describe("Read", () => {
    it("should read user's tasks", async () => {
      const response = await request(app)
        .get("/tasks")
        .set("Authorization", `Bearer ${frodoToken}`)
        .expect(200);

      expect(response).not.toBeNull();

      // 1 task created on the first test
      // 1 tasks created on "setupDatabase"
      expect(response.body.length).toBe(2);
    });

    it("shouldn't read tasks if not authenticated", async () => {
      const response = await request(app).post("/tasks").expect(401);

      expect(response.body.error).toBe("Token missing");
    });
  });

  describe("Update", () => {
    it("should update a task", async () => {
      let response: Response;

      response = await request(app)
        .patch(`/tasks/${frodoTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          description: "Destroy the ring of the rings",
        })
        .expect(200);

      expect(response.body.description).not.toBe(frodoTask.description);

      response = await request(app)
        .patch(`/tasks/${frodoTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          completed: true,
        })
        .expect(200);

      expect(response.body.completed).not.toBe(frodoTask.completed);
    });

    it("shouldn't update a task if not authenticated", async () => {
      const response = await request(app)
        .patch(`/tasks/${frodoTask._id}`)
        .expect(401);

      expect(response.body.error).toBe("Token missing");
    });

    it("shouldn't update an unexisting or another user's task", async () => {
      const task = await Task.findById(bilboTask._id);
      expect(task).not.toBeNull();

      const response = await request(app)
        .patch(`/tasks/${bilboTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          completed: true,
        })
        .expect(404);

      expect(response.body.error).toBe("Task not found");
    });

    it("shouldn't update a task on invalid fields", async () => {
      const response = await request(app)
        .patch(`/tasks/${frodoTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .send({
          desc: "Destroy the ring", // Actual field name is 'description'
        })
        .expect(400);

      expect(response.body.error).toBe("Invalid update: desc");
    });
  });

  describe("Delete", () => {
    it("shouldn't delete another user's task", async () => {
      const response = await request(app)
        .delete(`/tasks/${bilboTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .expect(404);
    });

    it("shouldn't delete if not authenticated", async () => {
      const response = await request(app)
        .delete(`/tasks/${frodoTask._id}`)
        .expect(401);

      expect(response.body.error).toBe("Token missing");
    });

    it("should delete a task", async () => {
      let task: ITask | null;

      task = await Task.findById(frodoTask._id);
      expect(task).not.toBeNull();

      await request(app)
        .delete(`/tasks/${frodoTask._id}`)
        .set("Authorization", `Bearer ${frodoToken}`)
        .expect(200);

      task = await Task.findById(frodoTask._id);
      expect(task).toBeNull();
    });
  });

  afterAll(cleanDB);
});
