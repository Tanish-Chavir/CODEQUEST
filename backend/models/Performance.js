import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true },
  
  // Accumulated data for ML processing
  totalAttempts: { type: Number, default: 0 },
  averageTime: { type: Number, default: 0 }, // average time to solve in seconds
  mistakePatterns: {
    logic: { type: Number, default: 0 },
    syntax: { type: Number, default: 0 },
    concept: { type: Number, default: 0 }
  },
  accuracyHistory: [{ type: Number }], // array of historical accuracies (e.g. per session/quiz)
  
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model("Performance", performanceSchema);
