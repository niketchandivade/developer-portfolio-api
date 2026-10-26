
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import profileRouter from "./routes/profile.routes.js";
import projectsRouter from "./routes/projects.routes.js";
import githubRouter from "./routes/github.routes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Portfolio API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/profile", profileRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/github", githubRouter);

app.use(errorHandler);

export default app;
