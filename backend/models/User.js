import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  videoId: { type: String },
  watchedSeconds: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: false },
  otp:      { type: String, default: null },
  otpExpires: { type: Date, default: null },

  // ── Personal Info ────────────────────────────────
  fullName:  { type: String, default: "" },
  phone:     { type: String, default: "" },
  bio:       { type: String, default: "" },
  country:   { type: String, default: "" },
  avatar:    { type: String, default: "" }, // URL or emoji
  techSkills: { type: [String], default: [] },

  // ── Gamification ────────────────────────────────
  xp:     { type: Number, default: 0 },
  coins:  { type: Number, default: 0 },
  level:  { type: Number, default: 1 },
  badges: [{ type: String }],
  theme:  { type: String, default: "dark" },

  // ── Analytics ───────────────────────────────────
  watchTime:      { type: Number, default: 0 }, // seconds
  quizzesTaken:   { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  streakDays:     { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  loginCount:     { type: Number, default: 0 },
  lastLogin:      { type: Date, default: null },

  // ── Access Control ───────────────────────────────
  role: { type: String, enum: ["user", "admin"], default: "user" },

  // ── Adaptive Learning ───────────────────────────
  skills: {
    type: Map,
    of: new mongoose.Schema({
      score: { type: Number, default: 0 },
      attempts: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 },
      lastMistakeType: { type: String, default: null } // e.g. "logic", "syntax", "concept"
    }, { _id: false }),
    default: {}
  },
  
  // ── Daily Learning Reminder ───────────────────────
  reminderEnabled: { type: Boolean, default: false },
  reminderTime:    { type: String, default: "09:00" }, // stored as "HH:MM" 24h format
  fcmTokens:       [{ type: String }],
  githubToken:     { type: String, default: "" },
  githubUsername:  { type: String, default: "" },
  followers:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following:       [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  courseProgress: [courseProgressSchema],
}, { timestamps: true });

export default mongoose.model("User", userSchema);
