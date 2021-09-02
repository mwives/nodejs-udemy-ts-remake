import "express-async-errors";

import axios from "axios";
import express, { NextFunction, Request, Response } from "express";

import { forecast } from "./utils/forecast";
import { geocode } from "./utils/geocode";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/weather", async (req, res, next) => {
  try {
    const locationSearch = req.query.location as string;

    if (!locationSearch) throw new Error("No location provided");

    let scale = req.query.scale as string;

    const { location, latitude, longitude } = (await geocode(
      locationSearch
    )) as any;

    const forecastData = await forecast(latitude, longitude, scale);

    return res.json({
      location,
      latitude,
      longitude,
      forecast: forecastData,
    });
  } catch (err) {
    return next(err);
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    if (err.message === "No location provided") {
      return res.status(400).json({
        error: err.message,
      });
    }

    if (err.message === "Unable to find location") {
      return res.status(404).json({
        error: err.message,
      });
    }
  }

  if (axios.isAxiosError(err)) {
    return res.status(err.response?.data.cod).json({
      error: err.message,
    });
  }

  return res.status(500).json({
    error: "Internal server error",
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
