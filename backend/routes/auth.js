import express from "express";
import { register, login, sendOtp, verifyOtp, getMe, awardXp, trackTime, saveProgress, getProgress, getAllUsers, updateProfile, updateReminderSchedule, registerFcmToken, connectGitHubAccount, toggleFollowUser, discoverUsers, forgotPassword, resetPassword } from "../controllers/authController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.patch("/award-xp", protect, awardXp);
router.patch("/track-time", protect, trackTime);
router.patch("/save-progress", protect, saveProgress);
router.get("/progress/:courseId", protect, getProgress);
router.get("/users", protect, admin, getAllUsers);
router.get("/users/discover", protect, discoverUsers);
router.post("/users/:id/follow", protect, toggleFollowUser);
router.patch("/profile", protect, updateProfile);
router.patch("/reminder", protect, updateReminderSchedule);
router.post("/fcm-token", protect, registerFcmToken);
router.patch("/github-token", protect, connectGitHubAccount);

export default router;
