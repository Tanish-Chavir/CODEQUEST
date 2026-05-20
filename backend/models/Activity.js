import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  actionType: { 
    type: String, 
    enum: ["video_watch", "quiz_attempt", "game_play", "session_start", "session_end"], 
    required: true 
  },
  details: {
    // Dynamic payload depending on the actionType
    videoId: { type: String },
    gameType: { type: String },
    timeSpent: { type: Number }, // in seconds
    score: { type: Number },
    topic: { type: String },
  },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Activity", activitySchema);
