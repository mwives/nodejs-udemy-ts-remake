import { Router } from "express";
import Jimp from "jimp";
import multer from "multer";

import { sendCancelationEmail, sendWelcomeEmail } from "../emails/account";
import { ensureAuth } from "../middlewares/ensureAuth";
import { RefreshToken } from "../models/RefreshToken";
import { User } from "../models/User";

import { Map } from "../ts/interfaces/utils";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const userAlreadyExists = await User.findOne({ email: req.body.email });

    if (userAlreadyExists) throw new Error("Email already in use");

    const user = await User.create(req.body);
    const token = await user.generateAuthToken();
    const { refreshToken } = await RefreshToken.generate(user._id);

    await RefreshToken.deleteExpired(user._id);

    sendWelcomeEmail(user);

    return res.status(201).json({ user, token, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    const { refreshToken } = await RefreshToken.generate(user._id);

    await RefreshToken.deleteExpired(user._id);

    res.json({ user, token, refreshToken });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", ensureAuth, (req, res, next) => {
  try {
    const token = req.headers.authorization!.split(" ")[1];
    req.headers.authorization = "";
    return res.send();
  } catch (err) {
    next(err);
  }
});

router.get("/me", ensureAuth, async (req, res, next) => {
  try {
    const user = req.user;
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch("/me", ensureAuth, async (req, res, next) => {
  try {
    const allowedUpdates = ["username", "email", "birthday", "password"];
    const updates = Object.keys(req.body);

    updates.forEach((update) => {
      if (allowedUpdates.indexOf(update) === -1) {
        throw new Error(`Invalid update: ${update}`);
      }
    });

    const user = req.user as Map;

    updates.forEach((update) => {
      user[update] = req.body[update];
    });

    user.updatedAt = new Date();

    await user.save();
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete("/me", ensureAuth, async (req, res, next) => {
  try {
    const user = req.user;

    await user.delete();
    delete req.headers.authorization;

    sendCancelationEmail(user);

    return res.json(user);
  } catch (err) {
    next(err);
  }
});

// Avatar related
const upload = multer({
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/(jpg|jpeg|png)$/)) {
      cb(new Error("Avatar file must be jpg, jpeg or png"));
    }

    cb(null, true);
  },
});

router.post(
  "/me/avatar",
  ensureAuth,
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const buffer = req.file?.buffer;

      if (!buffer) {
        throw new Error("No image buffer found");
      }

      const avatar = await Jimp.read(buffer);
      avatar.resize(250, 250);

      const avatarBuffer = await avatar.getBufferAsync(Jimp.MIME_PNG);
      const user = req.user;

      user.avatar = avatarBuffer;

      await user.save();

      res.set("Content-Type", "image/png");
      return res.send(user.avatar);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id/avatar", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) throw new Error("No user found");

    res.set("Content-Type", "image/png");
    return res.send(user.avatar);
  } catch (err) {
    next(err);
  }
});

router.delete("/me/avatar", ensureAuth, async (req, res, next) => {
  try {
    const user = req.user;
    user.avatar = undefined;
    await user.save();
    return res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
