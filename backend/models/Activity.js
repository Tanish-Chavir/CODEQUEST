import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actionType: { 
    type: String, 
    enum: ["video_watch", "quiz_attempt", "game_play", "session_start", "session_end", "coding_session"], 
    required: true 
  },
  details: {
    // Dynamic payload depending on the actionType
    videoId: { type: String },
    gameType: { type: String },
    timeSpent: { type: Number }, // in seconds
    score: { type: Number },
    topic: { type: String },
    language: { type: String }, // e.g. "javascript", "python", "typescript"
    linesWritten: { type: Number }, // optional typing stats
  },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Optimize query routing
activitySchema.index({ userId: 1, timestamp: -1 });

export default mongoose.model("Activity", activitySchema);
