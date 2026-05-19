import Activity from '../models/Activity.js';
import Performance from '../models/Performance.js';

export const logActivity = async (userId, actionType, details) => {
  try {
    const activity = new Activity({
      userId,
      actionType,
      details
    });
    await activity.save();
    return activity;
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

export const exportTrainingData = async () => {
  try {
    // Gather user performance history and activities to form a dataset
    const performances = await Performance.find().populate('userId', 'username email');
    
    const dataset = performances.map(p => ({
      userId: p.userId._id,
      topic: p.topic,
      totalAttempts: p.totalAttempts,
      averageTime: p.averageTime,
      mistakePatternLogic: p.mistakePatterns.logic,
      mistakePatternSyntax: p.mistakePatterns.syntax,
      mistakePatternConcept: p.mistakePatterns.concept,
      latestAccuracy: p.accuracyHistory[p.accuracyHistory.length - 1] || 0
    }));

    return dataset;
  } catch (error) {
    console.error("Error exporting training data:", error);
    throw error;
  }
};
