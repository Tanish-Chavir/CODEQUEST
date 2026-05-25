import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { 
  logCodingSession, 
  getUserActivityLogs, 
  getActivityStats,
  getAllActivityLogs
} from "../controllers/activityController.js";

const router = express.Router();

// Require strict authenticated session for all activity logs
router.use(protect);

router.post("/log", logCodingSession);
router.get("/logs", getUserActivityLogs);
router.get("/stats", getActivityStats);
router.get("/admin/logs", admin, getAllActivityLogs);

export default router;
