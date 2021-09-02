import request, { Response } from "supertest";

import app from "../src/app";
import { User } from "../src/models/User";

import { cleanDB, frodoToken, frodoUser, setupUserDB } from "./fixtures/db";

describe("User", () => {
  beforeAll(setupUserDB);

  describe("Creation", () => {
    it("should create a new user", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          username: "  Samwise   ",
          email: "  sam@gamgee.com    ",
          birthday: "2980/04/06",
          password: "ICanCarryU",
        })
        .expect(201);

      const user = await User.findById(response.body.user._id);

      expect(user).not.toBeNull();

      expect(response.body.user).toMatchObject({
        username: "samwise",
        email: "sam@gamgee.com",
        birthday: "2980-04-06T03:00:00.000Z",
      });

      expect(response.body.user.password).not.toBe("Samwise.S2!");
    });

    it("shouldn't create user on invalid fields", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          username: "Bilbo", // Required
          email: "bilbo@baggins.com", // Required and must be valid
          birthday: "2980/09/22", // Not required but must be YYYY/MM/DD
          password: "Bilbo", // Required and must be at least 7 characters
        })
        .expect(400);

      const error = response.body.error;

      // expect(error).toBe("Username is required");
      // expect(error).toBe("Invalid email");
      // expect(error).toBe("Date format must be YYYY-MM-DD");
      // expect(error).toBe("Field password is required");
      expect(error).toBe("Password must be at least 7 characters");
    });

    it("shouldn't create existent user", async () => {
      const response = await request(app)
        .post("/users")
        .send(frodoUser) // Frodo was already created on "setupUserDB"
        .expect(400);

      expect(response.body.error).toBe("Email already in use");
    });
  });

  describe("Authentication", () => {
    it("should login existent user", async () => {
      const response = await request(app)
        .post("/users/login")
        .send({
          email: frodoUser.email,
          password: frodoUser.password,
        })
        .expect(200);

      expect(response.body.user).toMatchObject({
        username: frodoUser.username.toLowerCase(),
        email: frodoUser.email,
      });

      expect(response.body.token).not.toBeNull();
      expect(response.body.refreshToken).not.toBeNull();
    });

    it("shouldn't login on wrong credentials/unexistent user", async () => {
      let response: Response;

      response = await request(app)
        .post("/users/login")
        .send({
          email: `${frodoUser.email}.sam`,
          password: frodoUser.password,
        })
        .expect(400);

      expect(response.body.error).toBe("Email or password incorrect");

      await request(app)
        .post("/users/login")
        .send({
          email: `${frodoUser.email}`,
          password: `${frodoUser.password}123`,
        })
        .expect(400);

      expect(response.body.error).toBe("Email or password incorrect");
    });
  });

  describe("Profile operations", () => {
    it("should read own profile", async () => {
      const response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${frodoToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        username: "frodo",
        email: "frodo@baggins.com",
        birthday: "2968-09-22T00:00:00.000Z",
      });
    });

    it("shouldn't read profile if not authenticated", async () => {
      let response: Response;

      // Token not set case
      response = await request(app).get("/users/me").expect(401);

      expect(response.body.error).toBe("Token missing");

      // Wrong token set
      response = await request(app)
        .get("/users/me")
        .set("Authorization", `Bearer ${frodoToken}A`)
        .expect(401);

      expect(response.body.error).toBe("Please authenticate");
    });

    describe("Update profile", () => {
      it("should update profile", async () => {
        const response = await request(app)
          .patch("/users/me")
          .set("Authorization", `Bearer ${frodoToken}`)
          .send({
            username: "Mr. Underhill",
            email: "frodo@shrine.com",
            birthday: "2968-09-23",
            password: "StillLoveSam123",
          })
          .expect(200);

        expect(response.body.username).not.toBe(frodoUser.username);
        expect(response.body.email).not.toBe(frodoUser.email);
        expect(response.body.birthday).not.toBe(frodoUser.birthday);
      });

      it("shouldn't update profile on invalid fields", async () => {
        const response = await request(app)
          .patch("/users/me")
          .send({
            name: "Mr. Underhill",
          })
          .set("Authorization", `Bearer ${frodoToken}`)
          .expect(400);
      });

      it("shouldn't update profile if not authenticated", async () => {
        let response: Response;

        // Token not set
        response = await request(app)
          .patch("/users/me")
          .send({
            username: "Mr. Underhill",
          })
          .expect(401);

        expect(response.body.error).toBe("Token missing");

        // Wrong token set
        response = await request(app)
          .patch("/users/me")
          .send({
            username: "Mr. Underhill",
          })
          .set("Authorization", `Bearer ${frodoToken}A`)
          .expect(401);

        expect(response.body.error).toBe("Please authenticate");
      });
    });

    describe("Avatar operations", () => {
      describe("Upload", () => {
        it("should upload", async () => {
          await request(app)
            .post("/users/me/avatar")
            .set("Authorization", `Bearer ${frodoToken}`)
            .attach("avatar", "tests/fixtures/frodo-avatar.png")
            .expect(200);

          const user = await User.findById(frodoUser._id);

          expect(user?.avatar).toEqual(expect.any(Buffer));
        });

        it("shouldn't upload if bigger than 2MB", async () => {
          const response = await request(app)
            .post("/users/me/avatar")
            .set("Authorization", `Bearer ${frodoToken}`)
            .attach("avatar", "tests/fixtures/frodo-avatar-big.jpg")
            .expect(400);

          expect(response.body.error).toBe("The file exceed the max of 2MB");
        });

        it("shouldn't upload if extension is not supported", async () => {
          const response = await request(app)
            .post("/users/me/avatar")
            .set("Authorization", `Bearer ${frodoToken}`)
            .attach("avatar", "tests/fixtures/frodo-avatar.webm")
            .expect(400);

          expect(response.body.error).toBe(
            "Avatar file must be jpg, jpeg or png"
          );
        });

        it("shouldn't upload avatar if not authenticated", async () => {
          const response = await request(app)
            .post("/users/me/avatar")
            .attach("avatar", "tests/fixtures/frodo-avatar.png")
            .expect(401);

          expect(response.body.error).toBe("Token missing");
        });
      });

      describe("Delete", () => {
        it("should delete own avatar", async () => {
          await request(app)
            .delete("/users/me/avatar")
            .set("Authorization", `Bearer ${frodoToken}`)
            .expect(200);

          const user = await User.findById(frodoUser._id);

          expect(user?.avatar).toBe(undefined);
        });

        it("shouldn't delete if not authenticated", async () => {
          const response = await request(app)
            .delete("/users/me/avatar")
            .attach("avatar", "tests/fixtures/frodo-avatar.png")
            .expect(401);

          expect(response.body.error).toBe("Token missing");
        });
      });

      describe("Read", () => {
        it("should read avatar by user id", async () => {
          const response = await request(app)
            .get(`/users/${frodoUser._id}/avatar`)
            .expect(200);

          expect(response.body).toEqual(expect.any(Buffer));
        });
      });
    });

    describe("Delete profile", () => {
      it("should delete own profile", async () => {
        const response = await request(app)
          .delete("/users/me")
          .set("Authorization", `Bearer ${frodoToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          username: "mr. underhill",
          email: "frodo@shrine.com",
          birthday: "2968-09-23T00:00:00.000Z",
        });
      });

      it("shouldn't delete if not authenticated", async () => {
        const response = await request(app).delete("/users/me").expect(401);

        expect(response.body.error).toBe("Token missing");
      });
    });
  });

  afterAll(cleanDB);
});
