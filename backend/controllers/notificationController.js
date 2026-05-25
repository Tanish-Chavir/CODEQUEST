import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { firebaseService } from "../services/firebaseService.js";

/**
 * @desc    Fetch current user's notifications sorted by newest first
 * @route   GET /api/notifications
 * @access  Private
 */
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50); // Sensible limit to prevent overhead

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch notifications", 
      error: error.message 
    });
  }
};

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      user: req.user.id, // Security: Ensure this notification belongs to the requestor
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({ 
      message: "Notification marked as read", 
      notification 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update notification", 
      error: error.message 
    });
  }
};

/**
 * @desc    Mark all of current user's notifications as read
 * @route   POST /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({ 
      message: "All notifications marked as read", 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to update notifications", 
      error: error.message 
    });
  }
};

/**
 * @desc    Utility helper function to trigger notifications programmatically in backend
 * @param   {string} userId - Recipient user database ID
 * @param   {string} title - Heading of notification
 * @param   {string} message - Detail of notification
 * @param   {string} type - "login" | "reminder" | "activity"
 * @param   {object} meta - Optional metadata (such as course id or xp levels)
 */
export const createNotificationHelper = async (userId, title, message, type, meta = {}) => {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      meta,
    });

    // Fire-and-forget push notification transmission
    User.findById(userId).then(async (user) => {
      if (user && user.fcmTokens && user.fcmTokens.length > 0) {
        const result = await firebaseService.sendPushNotification(
          user.fcmTokens,
          title,
          message,
          { type, ...(meta || {}) }
        );

        // If the FCM dispatcher identified any dead/invalid device tokens, clean them up from the DB
        if (result && result.staleTokens && result.staleTokens.length > 0) {
          await User.findByIdAndUpdate(userId, {
            $pull: { fcmTokens: { $in: result.staleTokens } }
          });
          console.log(`[FCM Service] Cleaned ${result.staleTokens.length} dead device token(s) from database.`);
        }
      }
    }).catch((err) => {
      console.error("[FCM Service] Background processing warning:", err.message);
    });

    return notification;
  } catch (error) {
    console.error("Critical: Failed to generate database notification:", error.message);
    return null;
  }
};
