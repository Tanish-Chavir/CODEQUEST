import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/course.js";
import aiRoutes from "./routes/ai.js";
import advancedAiRoutes from "./routes/aiRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import healthRoutes from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/codequest";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Connection Error:", err));

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/advanced-ai", advancedAiRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/games", gameRoutes);

app.get("/", (req, res) => {
  res.send("CodeQuest API is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
