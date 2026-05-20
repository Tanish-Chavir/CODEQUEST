import express from "express";
import { generateQuizAndNotes, getQuizzesForVideo, runCode } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/generate", protect, generateQuizAndNotes);
router.get("/quizzes/:videoId", protect, getQuizzesForVideo);
router.post("/run-code", protect, runCode);

export default router;
