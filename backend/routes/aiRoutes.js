import express from 'express';
import { generateQuestions } from '../services/aiService.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate questions adaptively
router.post('/generate-questions', protect, async (req, res) => {
  try {
    const { topic } = req.body;
    
    // Fetch user to get skill level
    const user = await User.findById(req.user.id);
    
    const skillData = user.skills?.get(topic) || { accuracy: 0, lastMistakeType: "none" };
    const skillLevel = skillData.accuracy > 70 ? "advanced" : (skillData.accuracy > 40 ? "intermediate" : "beginner");
    
    const result = await generateQuestions({
      topic,
      skillLevel,
      pastMistakes: [skillData.lastMistakeType],
      accuracy: skillData.accuracy
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
