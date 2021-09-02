import request from "supertest";

import app from "../src/app";

import { cleanDB } from "./fixtures/db";

describe("Refresh token", () => {
  beforeAll(cleanDB);

  let sauronRefreshTokenId: any;

  describe("Creation", () => {
    it("should create a refresh token on user sign up", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          username: "Sauron",
          email: "sauron@middlearth.com",
          password: "RingOfTheRings@123",
        })
        .expect(201);

      sauronRefreshTokenId = response.body.refreshToken._id;
      expect(response.body.refreshToken).not.toBeNull();
    });

    it("should create a refresh token on user sign in", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          email: "sauron@middlearth.com",
          password: "RingOfTheRings@123",
        })
        .expect(200);

      expect(response.body.refreshToken).not.toBeNull();
    });
  });

  describe("New token generation", () => {
    it("should generate a new token", async () => {
      const response = await request(app)
        .post("/refresh-token")
        .send({
          refreshToken: sauronRefreshTokenId,
        })
        .expect(200);

      expect(response.body.token).not.toBeNull();
    });

    it("shouldn't generate a token for invalid refresh token id", async () => {
      const response = await request(app)
        .post("/refresh-token")
        .send({
          refreshToken: `${sauronRefreshTokenId}A`,
        })
        .expect(404);

      expect(response.body.error).toBe("Refresh Token not found");
    });
  });

  afterAll(cleanDB);
});
