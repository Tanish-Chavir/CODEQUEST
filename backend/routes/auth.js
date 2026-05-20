import express from "express";
import { register, login, getMe, awardXp, trackTime, saveProgress, getProgress, getAllUsers, updateProfile } from "../controllers/authController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/award-xp", protect, awardXp);
router.patch("/track-time", protect, trackTime);
router.patch("/save-progress", protect, saveProgress);
router.get("/progress/:courseId", protect, getProgress);
router.get("/users", protect, admin, getAllUsers);
router.patch("/profile", protect, updateProfile);

export default router;
