import express from 'express';
import { exportTrainingData } from '../services/analyticsService.js';

const router = express.Router();

// Export dataset for ML training
router.get('/export-data', async (req, res) => {
  try {
    const dataset = await exportTrainingData();
    res.json(dataset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Placeholder for predicting performance (e.g., Logistic Regression or Classification model)
router.post('/predict-performance', async (req, res) => {
  try {
    // In a real implementation, you'd call a Python microservice or use ONNX/TensorFlow.js here
    res.json({ message: "ML prediction endpoint ready for integration", prediction: "Will pass next question" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
