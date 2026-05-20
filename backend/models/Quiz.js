import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  videoId: {
    type: String, // YouTube Video ID
    required: true,
  },
  timestamp: {
    type: Number, // seconds into the video
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctAnswer: {
    type: Number, // Index of options array
    required: true,
  },
  explanation: {
    type: String,
    default: "",
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
  xpReward: {
    type: Number,
    default: 50,
  }
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
