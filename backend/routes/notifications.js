import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead 
} from "../controllers/notificationController.js";

const router = express.Router();

// All notification actions require active user verification
router.use(protect);

router.get("/", getUserNotifications);
router.patch("/:id/read", markAsRead);
router.post("/read-all", markAllAsRead);

export default router;
