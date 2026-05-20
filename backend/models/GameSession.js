import mongoose from "mongoose";

const gameSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gameType: { 
    type: String, 
    enum: ["code_puzzle", "output_prediction", "speed_coding", "debugging"], 
    required: true 
  },
  topic: { type: String, required: true },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
  
  // Solution Intelligence
  questionContent: { type: String, required: true }, // The prompt/question
  correctSolution: { type: String, required: true },
  userAnswer: { type: String, required: true },
  
  isCorrect: { type: Boolean, required: true },
  mistakeType: { type: String, enum: ["logic", "syntax", "concept", "none"], default: "none" },
  timeTaken: { type: Number, required: true }, // in seconds
  
  // AI Feedback
  aiExplanation: { type: String },
  aiStepByStep: { type: String },
  aiWhereYouLacked: { type: String },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("GameSession", gameSessionSchema);
