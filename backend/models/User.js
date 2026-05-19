import mongoose from "mongoose";

const courseProgressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
  videoId: { type: String },
  watchedSeconds: { type: Number, default: 0 },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // ── Personal Info ────────────────────────────────
  fullName:  { type: String, default: "" },
  phone:     { type: String, default: "" },
  bio:       { type: String, default: "" },
  country:   { type: String, default: "" },
  avatar:    { type: String, default: "" }, // URL or emoji

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
  
  courseProgress: [courseProgressSchema],
}, { timestamps: true });

export default mongoose.model("User", userSchema);
