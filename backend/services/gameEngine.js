/**
 * Evaluates the user's code/answer based on the game type.
 * @param {String} gameType 
 * @param {String} userAnswer 
 * @param {String} correctAnswer 
 * @returns {Object} { isCorrect: boolean, mistakeType: "logic" | "syntax" | "concept" | "none" }
 */
export const evaluateGameAnswer = (gameType, userAnswer, correctAnswer) => {
    // Basic normalization for comparison
    const normalize = (str) => str.replace(/\s+/g, '').trim().toLowerCase();
    const uAns = normalize(userAnswer);
    const cAns = normalize(correctAnswer);
  
    const isCorrect = uAns === cAns;
    let mistakeType = "none";
  
    if (!isCorrect) {
      // Very basic rule-based mistake classification. 
      // In a real app, you might run the code in a sandbox (e.g. Judge0) to check for SyntaxError vs failing logic tests.
      if (gameType === "debugging") {
        mistakeType = "logic";
      } else if (gameType === "code_puzzle") {
        mistakeType = uAns.includes("syntax") ? "syntax" : "logic";
      } else {
        mistakeType = "concept";
      }
    }
  
    return { isCorrect, mistakeType };
  };
