import "./db/mongoose";
import express from "express";

import controllers from "./controllers";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(controllers);

export default app;
