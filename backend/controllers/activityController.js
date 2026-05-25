import Activity from "../models/Activity.js";
import User from "../models/User.js";
import { createNotificationHelper } from "./notificationController.js";

/**
 * @desc    Log a new coding activity session & award XP/Coins
 * @route   POST /api/activity/log
 * @access  Private
 */
export const logCodingSession = async (req, res) => {
  try {
    const { timeSpent, language, linesWritten } = req.body;

    if (!timeSpent || !language) {
      return res.status(400).json({ message: "timeSpent (in seconds) and language are required" });
    }

    const cleanLanguage = language.trim().toLowerCase();

    // 1. Create database activity log
    const activity = await Activity.create({
      userId: req.user.id,
      actionType: "coding_session",
      details: {
        timeSpent: parseInt(timeSpent, 10),
        language: cleanLanguage,
        linesWritten: parseInt(linesWritten || 0, 10),
      },
    });

    // 2. Award gamified credentials (1 minute = 10 XP + 2 Coins)
    const xpGain = Math.max(10, Math.floor(parseInt(timeSpent, 10) / 6)); 
    const coinsGain = Math.max(2, Math.floor(parseInt(timeSpent, 10) / 30));

    const user = await User.findById(req.user.id);
    if (user) {
      const oldLevel = user.level || 1;
      
      user.xp = (user.xp || 0) + xpGain;
      user.coins = (user.coins || 0) + coinsGain;
      
      // Recalculate level based on global CodeQuest standard: Every 500 XP = 1 level
      user.level = Math.floor(user.xp / 500) + 1;
      
      // Track total active coding time in user profile
      user.watchTime = (user.watchTime || 0) + parseInt(timeSpent, 10);
      
      await user.save();

      // Trigger gamified achievement notification if leveled up!
      if (user.level > oldLevel) {
        createNotificationHelper(
          user._id,
          "Level Up! 🌟",
          `Congratulations! You have reached Level ${user.level} by mastering code.`,
          "activity"
        );
      } else {
        // Trigger generic XP gain notification
        createNotificationHelper(
          user._id,
          "Quest Cleared! ⚡",
          `Earned ${xpGain} XP & ${coinsGain} Coins for coding in ${language}.`,
          "activity"
        );
      }
    }

    res.status(201).json({
      message: "Coding session tracked successfully",
      activity,
      xpGain,
      coinsGain,
      user: user ? { xp: user.xp, level: user.level, coins: user.coins } : null
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Failed to record coding session", 
      error: error.message 
    });
  }
};

/**
 * @desc    Fetch all of current user's raw activity logs
 * @route   GET /api/activity/logs
 * @access  Private
 */
export const getUserActivityLogs = async (req, res) => {
  try {
    const logs = await Activity.find({ userId: req.user.id })
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to fetch activity logs", 
      error: error.message 
    });
  }
};

/**
 * @desc    Retrieve aggregated statistical coding analytics for charts
 * @route   GET /api/activity/stats
 * @access  Private
 */
export const getActivityStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all logs belonging to user in the past 30 days to compute aggregates
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await Activity.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });

    // Initialize stats metrics
    let totalCodingTimeSeconds = 0;
    let totalLinesWritten = 0;
    const timePerLanguage = {};
    const codingTimePerDay = {}; // Map of "YYYY-MM-DD" -> time in seconds

    // Initialize past 7 days in daily maps to guarantee empty days still render nicely on charts!
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      codingTimePerDay[dateString] = 0;
    }

    logs.forEach((log) => {
      if (log.actionType === "coding_session" && log.details) {
        const timeVal = parseInt(log.details.timeSpent || 0, 10);
        const linesVal = parseInt(log.details.linesWritten || 0, 10);
        const lang = log.details.language || "unknown";

        totalCodingTimeSeconds += timeVal;
        totalLinesWritten += linesVal;

        // Group time by Language
        timePerLanguage[lang] = (timePerLanguage[lang] || 0) + timeVal;

        // Group time by Day
        const dateKey = new Date(log.timestamp).toISOString().split("T")[0];
        // Only collect if the key exists or lies within our reporting days
        codingTimePerDay[dateKey] = (codingTimePerDay[dateKey] || 0) + timeVal;
      }
    });

    // Format language distribution stats for pie-charts
    const languageBreakdown = Object.keys(timePerLanguage).map((lang) => ({
      language: lang,
      timeSpent: timePerLanguage[lang], // in seconds
      percentage: totalCodingTimeSeconds > 0 
        ? Math.round((timePerLanguage[lang] / totalCodingTimeSeconds) * 100) 
        : 0
    })).sort((a, b) => b.timeSpent - a.timeSpent);

    // Format daily distribution stats for bar/line charts
    const dailyBreakdown = Object.keys(codingTimePerDay).map((date) => {
      // Find corresponding weekday shorthand (e.g. "Mon", "Tue")
      const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "short" });
      return {
        date,
        dayName,
        timeSpentMinutes: Math.round(codingTimePerDay[date] / 60)
      };
    });

    res.status(200).json({
      totalCodingTimeMinutes: Math.round(totalCodingTimeSeconds / 60),
      totalLinesWritten,
      languageBreakdown,
      dailyBreakdown
    });

  } catch (error) {
    res.status(500).json({ 
      message: "Failed to compile activity diagnostics", 
      error: error.message 
    });
  }
};

// Admin ONLY: Fetch all logs across the platform
export const getAllActivityLogs = async (req, res) => {
  try {
    const logs = await Activity.find()
      .populate("userId", "username email avatar level")
      .sort({ timestamp: -1 })
      .limit(200);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to load platform logs", error: error.message });
  }
};
