import cron from "node-cron";
import User from "../models/User.js";
import { emailService } from "./emailService.js";
import { createNotificationHelper } from "../controllers/notificationController.js";

/**
 * Initialize background cron job scheduler
 */
export const initScheduler = () => {
  console.log("[Scheduler] Initializing daily study reminder cron daemon...");

  // Enforce job sweep every minute: cron pattern "* * * * *"
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      // Pad single digits to match HH:MM format exactly
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const currentTimeString = `${hours}:${minutes}`;

      console.log(`[Scheduler Sweep] Checking for learning reminders scheduled at ${currentTimeString}...`);

      // Search database for enabled schedules matching current time exactly
      const usersToRemind = await User.find({
        reminderEnabled: true,
        reminderTime: currentTimeString,
      });

      if (usersToRemind.length === 0) return;

      console.log(`[Scheduler Sweep] Found ${usersToRemind.length} learning reminders to dispatch.`);

      // Process all reminders in parallel async threads
      usersToRemind.forEach((user) => {
        // 1. Dispatch learning email
        emailService.sendStudyReminderEmail(user.email, user.username)
          .then(() => {
            console.log(`[Scheduler] Study reminder email sent successfully to ${user.email}`);
          })
          .catch((err) => {
            console.error(`[Scheduler] Failed to dispatch study email to ${user.email}:`, err.message);
          });

        // 2. Dispatch secure in-app DB notification
        createNotificationHelper(
          user._id,
          "Daily Quest Reminder ⏰",
          "Ready for your daily CodeQuest? Jump in to maintain your hot streak and claim bonus coins!",
          "reminder"
        ).then(() => {
          console.log(`[Scheduler] In-app notification queued successfully for user ${user.username}`);
        }).catch((err) => {
          console.error(`[Scheduler] Failed to queue in-app notification:`, err.message);
        });
      });

    } catch (error) {
      console.error("[Scheduler Sweep Error] Sweep routine execution failed:", error.message);
    }
  });
};
