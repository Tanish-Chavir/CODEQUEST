import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// --- NodeMailer Setup ---
let testAccount = null;
let testTransporter = null;

const sendEmail = async (to, subject, html) => {
  try {
    let activeTransporter;

    // If real credentials are provided in .env, use them
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      activeTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Otherwise, generate a fake Ethereal email account automatically for testing
      if (!testAccount) {
        console.log("Generating Ethereal test account for email previews...");
        testAccount = await nodemailer.createTestAccount();
        testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
      }
      activeTransporter = testTransporter;
    }

    const info = await activeTransporter.sendMail({
      from: '"CodeQuest" <noreply@codequest.app>',
      to,
      subject,
      html
    });

    // If using the test account, provide the preview URL
    if (!process.env.EMAIL_USER) {
      console.log(`\n📧 Email sent! View it in your browser: ${nodemailer.getTestMessageUrl(info)}\n`);
    }

  } catch (err) {
    console.error("Email send error:", err);
  }
};
// ------------------------


export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const isAdmin = [
      "atomicfacts99@gmail.com",
      "tc.random.edits@gmail.com",
      "shivamgadkh46@gmail.com"
    ].includes(email.toLowerCase()) || ["tc", "shivam"].includes(username.toLowerCase());

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: isAdmin ? "admin" : "user",
    });

    await newUser.save();

    // Send Welcome Email
    sendEmail(
      email,
      "Welcome to CodeQuest! 🚀",
      `<h1>Welcome to CodeQuest, ${username}!</h1>
       <p>Get ready to level up your coding skills. Start watching courses, complete interactive quizzes, and earn XP!</p>
       <p>Happy coding!</p>`
    );

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        xp: newUser.xp,
        coins: newUser.coins,
        level: newUser.level,
        watchTime: newUser.watchTime,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "default_secret", { expiresIn: "7d" });

    // Track login stats
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLogin = new Date();
    await user.save();

    // Send Login Security Alert
    sendEmail(
      email,
      "New Login to CodeQuest",
      `<p>Hi ${user.username},</p>
       <p>We detected a new login to your CodeQuest account. If this was you, no further action is needed.</p>
       <p>Keep up the great progress!</p>`
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        xp: user.xp,
        coins: user.coins,
        level: user.level,
        theme: user.theme,
        watchTime: user.watchTime,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Award XP after a correct quiz answer
export const awardXp = async (req, res) => {
  try {
    const { amount, isQuiz, isCorrect } = req.body;
    const xpGain = amount || 50;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.xp += xpGain;
    // Every 500 XP = 1 level (level 1 at 0 XP)
    user.level = Math.floor(user.xp / 500) + 1;

    if (isQuiz) {
      user.quizzesTaken = (user.quizzesTaken || 0) + 1;
      if (isCorrect) {
        user.correctAnswers = (user.correctAnswers || 0) + 1;
      }
    }

    await user.save();

    res.status(200).json({
      message: "XP awarded",
      xp: user.xp,
      level: user.level,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Track total watch time
export const trackTime = async (req, res) => {
  try {
    const { seconds } = req.body;
    if (!seconds || seconds <= 0) return res.status(400).json({ message: "Invalid seconds" });

    await User.findByIdAndUpdate(req.user.id, { $inc: { watchTime: seconds } });

    res.status(200).json({ message: "Watch time updated" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Save video progress (resume position)
export const saveProgress = async (req, res) => {
  try {
    const { courseId, videoId, watchedSeconds } = req.body;
    if (!courseId || !videoId || watchedSeconds === undefined) {
      return res.status(400).json({ message: "courseId, videoId, and watchedSeconds are required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingIndex = user.courseProgress.findIndex(
      (p) => p.courseId?.toString() === courseId && p.videoId === videoId
    );

    if (existingIndex >= 0) {
      user.courseProgress[existingIndex].watchedSeconds = watchedSeconds;
    } else {
      user.courseProgress.push({ courseId, videoId, watchedSeconds });
    }

    await user.save();

    res.status(200).json({ message: "Progress saved" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get video progress for a course
export const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const user = await User.findById(req.user.id).select("courseProgress");
    if (!user) return res.status(404).json({ message: "User not found" });

    const progress = user.courseProgress.filter(
      (p) => p.courseId?.toString() === courseId
    );

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Admin Route: Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ xp: -1 }); // Sorted by XP descending
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
};

// Update personal profile info
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, bio, country, avatar, username } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { fullName, phone, bio, country, avatar, username } },
      { new: true, select: "-password" }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};
