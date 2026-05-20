import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "YOUR_FALLBACK_KEY_HERE" });

export const generateQuestions = async ({ topic, skillLevel, pastMistakes, accuracy }) => {
  try {
    const prompt = `
You are an expert coding instructor AI.

Input:
- Topic: ${topic}
- User Skill Level: ${skillLevel}
- Past Mistakes: ${JSON.stringify(pastMistakes)}
- Accuracy: ${accuracy}%

Tasks:
1. Generate:
- 3 MCQs
- 2 coding problems
- 1 debugging problem

2. Each question must include:
- Difficulty level
- Correct answer
- Explanation
- Concept tested

3. Analyze user:
- Identify weak areas
- Suggest improvements

4. Adaptive logic:
- If weak -> simpler conceptual questions
- If strong -> harder problems

5. Output ONLY a valid JSON string (no markdown formatting or code blocks) with this exact structure:
{
  "questions": [
    {
      "type": "mcq | coding | debugging",
      "difficulty": "easy | medium | hard",
      "content": "Question text here",
      "options": ["A", "B", "C", "D"], // Only for MCQs
      "correctAnswer": "Answer text here",
      "explanation": "Why this is correct",
      "concept": "Concept name"
    }
  ],
  "analysis": {
    "weakAreas": ["area1", "area2"],
    "recommendations": ["rec1", "rec2"],
    "nextDifficulty": "easy | medium | hard"
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const text = response.text.trim();
    
    // Clean potential markdown blocks if the model still adds them
    const jsonString = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating questions with Gemini:", error);
    throw error;
  }
};

export const analyzeGameSession = async ({ gameType, question, correctAnswer, userAnswer, mistakeType }) => {
  try {
    const prompt = `
You are an expert coding instructor AI. A user has completed a coding challenge.

Challenge Details:
- Game Type: ${gameType}
- Question: ${question}
- Correct Solution: ${correctAnswer}
- User's Answer: ${userAnswer}
- Mistake Category: ${mistakeType} // e.g., syntax, logic, concept, none

Task:
Analyze the user's answer compared to the correct solution and provide constructive feedback.

Output ONLY a valid JSON string with this exact structure:
{
  "stepByStep": "A step-by-step breakdown of how to reach the correct solution.",
  "explanation": "Detailed explanation of the user's specific mistake.",
  "whereYouLacked": "A short, encouraging sentence highlighting the specific concept the user needs to practice."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    
    const text = response.text.trim();
    
    const jsonString = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error analyzing session with Gemini:", error);
    throw error;
  }
};

/**
 * Generates fresh, descriptive game challenges for a given language, topic, and game type.
 */
export const generateGameChallenges = async ({ language, gameType, difficulty = "medium", topic = "General" }) => {
  const gameInstructions = {
    debugging: `Generate exactly 4 UNIQUE debugging challenges. Each challenge:
- Has a BROKEN code snippet with a realistic bug related to "${topic}"
- Has a clear instruction explaining what the code SHOULD do
- Provides the corrected fixedCode
- Includes a helpful hint (not giving away the answer)
- Uses DIFFERENT bugs across the 4 challenges (e.g., wrong operator, off-by-one, wrong method, missing return)
Return a raw JSON array:
[
  {
    "instruction": "Detailed description of what this code should do and what concept is tested",
    "buggyCode": "the broken code snippet",
    "fixedCode": "the corrected code snippet",
    "hint": "A helpful clue without revealing the fix",
    "concept": "The programming concept being tested"
  }
]`,
    output_prediction: `Generate exactly 4 UNIQUE output prediction challenges about "${topic}". Each:
- Has a self-contained code snippet
- Has exactly 4 plausible options, correct answer at index "correct"
- Tests DIFFERENT ${language} behaviors across the 4 questions (not the same pattern)
- Has a detailed step-by-step explanation
Return a raw JSON array:
[
  {
    "code": "the code snippet",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": 0,
    "explanation": "Step-by-step explanation of why this output is correct"
  }
]`,
    code_puzzle: `Generate exactly 4 UNIQUE fill-in-the-blank puzzles about "${topic}". Each:
- Splits a meaningful code snippet into before/blank/after
- Tests a KEY expression, method, or syntax element
- Has exactly 4 options where index "correct" is the right answer
- Uses DIFFERENT blanks across the 4 questions
Return a raw JSON array:
[
  {
    "instruction": "What this code does and what concept the blank tests",
    "before": "code before the blank",
    "blank": "the correct answer",
    "after": "code after the blank",
    "options": ["correct answer", "plausible wrong 1", "plausible wrong 2", "plausible wrong 3"],
    "correct": 0,
    "explanation": "Why this is correct"
  }
]`
  };

  const difficultyDesc = difficulty === 'easy'
    ? 'basic syntax and simple operations — suitable for beginners'
    : difficulty === 'medium'
    ? 'intermediate concepts like closures, higher-order functions, data structures'
    : 'advanced algorithms, design patterns, performance, edge cases';

  const prompt = `You are an expert ${language} coding instructor creating engaging, educational game challenges for a developer learning platform.

TASK PARAMETERS:
- Language: ${language}
- Topic Focus: ${topic}
- Difficulty: ${difficulty} (${difficultyDesc})
- Game Type: ${gameType}

${gameInstructions[gameType] || gameInstructions.debugging}

STRICT REQUIREMENTS:
1. ALL 4 questions MUST be about the topic "${topic}" in ${language}
2. Each question MUST be DIFFERENT — no two questions should test the same pattern or concept
3. All code MUST be syntactically valid ${language}
4. Be educational and descriptive — a learner should understand the concept from reading the question
5. Return ONLY the raw JSON array — no markdown fences, no explanations outside the JSON`;

  // Models ordered by quota generosity: lite first (highest RPM), then standard
  const MODELS = ["gemini-2.0-flash-lite", "gemini-flash-latest", "gemini-2.0-flash-001", "gemini-2.5-flash-lite"];

  let lastError = null;
  for (const model of MODELS) {
    try {
      console.log(`[generateGameChallenges] Trying model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text.trim();
      const jsonString = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
      const parsed = JSON.parse(jsonString);
      console.log(`[generateGameChallenges] Success with model: ${model}`);
      return parsed;
    } catch (err) {
      lastError = err;
      const status = err.status || err.code;
      console.warn(`[generateGameChallenges] model ${model} failed (${status}): ${err.message?.slice(0, 120)}`);
      // On rate-limit (429) wait before next model
      if (status === 429 || status === 503) {
        await new Promise(r => setTimeout(r, 3000));
      }
      // Continue to next model
    }
  }

  throw lastError;
};
