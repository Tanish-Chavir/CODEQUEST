/**
 * Adjusts the user's difficulty for a given topic based on their current performance.
 * @param {Object} skillData - The user's skill object for the topic (from User.skills map)
 * @returns {String} - "easy", "medium", or "hard"
 */
export const calculateNextDifficulty = (skillData) => {
    if (!skillData) return "easy";
    
    const { accuracy, attempts, score } = skillData;
    
    // Not enough data, start at medium if they have a bit of history, otherwise easy
    if (attempts < 3) {
      return score > 0 ? "medium" : "easy";
    }
  
    // Rule-based adaptive logic
    if (accuracy >= 80) {
      return "hard";
    } else if (accuracy >= 50) {
      return "medium";
    } else {
      return "easy";
    }
  };
  
  /**
   * Updates the user's skill data after a game or quiz.
   * @param {Object} currentSkill - The existing skill object for the topic
   * @param {Boolean} isCorrect - Whether the latest attempt was correct
   * @param {String} mistakeType - Type of mistake (if any)
   * @returns {Object} - Updated skill object
   */
  export const updateSkillData = (currentSkill, isCorrect, mistakeType) => {
    const skill = currentSkill || { score: 0, attempts: 0, accuracy: 0, lastMistakeType: null };
    
    skill.attempts += 1;
    if (isCorrect) skill.score += 10;
    
    // Recalculate accuracy (assuming 1 attempt = 1 potential correct answer)
    // Here accuracy is a percentage 0-100.
    // In a real system, you might track total correct answers. 
    // Let's approximate: 
    const totalCorrect = (skill.accuracy / 100) * (skill.attempts - 1) + (isCorrect ? 1 : 0);
    skill.accuracy = Math.round((totalCorrect / skill.attempts) * 100);
    
    skill.lastMistakeType = isCorrect ? null : mistakeType;
    
    return skill;
  };
