import express from 'express';
import { evaluateGameAnswer } from '../services/gameEngine.js';
import { analyzeGameSession, generateGameChallenges } from '../services/aiService.js';
import { updateSkillData, calculateNextDifficulty } from '../services/adaptiveEngine.js';
import GameSession from '../models/GameSession.js';
import User from '../models/User.js';
import { logActivity } from '../services/analyticsService.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Large Fallback Question Pool (used when AI quota exhausted) ──────────────
const FALLBACK_POOL = {
  debugging: [
    { instruction: "This add() function should return the sum but uses the wrong operator.", buggyCode: "function add(a, b) {\n  return a - b;\n}", fixedCode: "function add(a, b) {\n  return a + b;\n}", hint: "Check the arithmetic operator.", concept: "Arithmetic Operators" },
    { instruction: "This loop should print 1 to 5 but starts at 0 and uses wrong boundary.", buggyCode: "for (let i = 0; i < 5; i++) {\n  console.log(i);\n}", fixedCode: "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}", hint: "Check start value and loop condition.", concept: "Loop Boundaries" },
    { instruction: "isEven() should return true for even numbers but has the wrong comparison.", buggyCode: "function isEven(n) {\n  return n % 2 === 1;\n}", fixedCode: "function isEven(n) {\n  return n % 2 === 0;\n}", hint: "Even numbers have remainder 0 when divided by 2.", concept: "Modulo Operator" },
    { instruction: "maxVal() should find max in an array but initializes max wrong.", buggyCode: "function maxVal(arr) {\n  let max = 0;\n  for (let x of arr) {\n    if (x > max) max = x;\n  }\n  return max;\n}", fixedCode: "function maxVal(arr) {\n  let max = arr[0];\n  for (let x of arr) {\n    if (x > max) max = x;\n  }\n  return max;\n}", hint: "What happens if all numbers are negative?", concept: "Array Traversal" },
    { instruction: "factorial() should multiply all numbers 1 to n but has wrong base case.", buggyCode: "function factorial(n) {\n  if (n === 0) return 0;\n  return n * factorial(n - 1);\n}", fixedCode: "function factorial(n) {\n  if (n === 0) return 1;\n  return n * factorial(n - 1);\n}", hint: "What is 0! mathematically?", concept: "Recursion Base Case" },
    { instruction: "isPalindrome() should check if a string reads the same forwards and backwards.", buggyCode: "function isPalindrome(s) {\n  return s === s.split('').reverse();\n}", fixedCode: "function isPalindrome(s) {\n  return s === s.split('').reverse().join('');\n}", hint: "reverse() returns an array, not a string.", concept: "Array to String Conversion" },
    { instruction: "sumArray() should sum all elements but has wrong accumulator start.", buggyCode: "function sumArray(arr) {\n  return arr.reduce((acc, x) => acc * x, 0);\n}", fixedCode: "function sumArray(arr) {\n  return arr.reduce((acc, x) => acc + x, 0);\n}", hint: "Should it multiply or add?", concept: "Array reduce()" },
    { instruction: "This function should count vowels but misses some vowels in the check.", buggyCode: "function countVowels(str) {\n  return str.split('').filter(c => 'aei'.includes(c)).length;\n}", fixedCode: "function countVowels(str) {\n  return str.split('').filter(c => 'aeiou'.includes(c.toLowerCase())).length;\n}", hint: "How many vowels are in the English alphabet?", concept: "String Filtering" },
    { instruction: "flatten() should flatten a 2D array into 1D but uses wrong method.", buggyCode: "function flatten(arr) {\n  return arr.reduce((acc, x) => acc.push(...x), []);\n}", fixedCode: "function flatten(arr) {\n  return arr.reduce((acc, x) => acc.concat(x), []);\n}", hint: "Array.push() returns the new length, not the array.", concept: "Array Methods" },
    { instruction: "This debounce function has the wrong timeout reference.", buggyCode: "function debounce(fn, delay) {\n  let timer;\n  return function() {\n    clearTimeout(fn);\n    timer = setTimeout(fn, delay);\n  };\n}", fixedCode: "function debounce(fn, delay) {\n  let timer;\n  return function() {\n    clearTimeout(timer);\n    timer = setTimeout(fn, delay);\n  };\n}", hint: "clearTimeout needs the timer ID, not the function.", concept: "Closures & Timers" },
    { instruction: "This binary search has an off-by-one error in the mid calculation.", buggyCode: "function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}", fixedCode: "function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    let mid = Math.floor((lo + hi) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}", hint: "Array indices go from 0 to length-1.", concept: "Binary Search" },
    { instruction: "This function should deep clone an object but uses shallow copy.", buggyCode: "function deepClone(obj) {\n  return Object.assign({}, obj);\n}", fixedCode: "function deepClone(obj) {\n  return JSON.parse(JSON.stringify(obj));\n}", hint: "Object.assign only copies top-level properties.", concept: "Object Cloning" },
  ],
  output_prediction: [
    { code: "let x = 5;\nx = x * 2;\nconsole.log(x + 3);", options: ["10", "13", "8", "15"], correct: 1, explanation: "x = 5*2 = 10, then 10+3 = 13." },
    { code: "let arr = [1, 2, 3];\nconsole.log(arr.length + arr[0]);", options: ["4", "3", "31", "6"], correct: 0, explanation: "arr.length=3, arr[0]=1, so 3+1=4." },
    { code: "let a = '5';\nlet b = 3;\nconsole.log(a + b);", options: ["8", "53", "'53'", "Error"], correct: 1, explanation: "String + Number = concatenation: '5' + 3 = '53'." },
    { code: "console.log(typeof null);", options: ["null", "undefined", "object", "string"], correct: 2, explanation: "typeof null returns 'object' — a famous JS quirk." },
    { code: "console.log(0.1 + 0.2 === 0.3);", options: ["true", "false", "undefined", "NaN"], correct: 1, explanation: "Floating point precision: 0.1+0.2 = 0.30000000000000004, not 0.3." },
    { code: "const obj = { a: 1 };\nconst copy = obj;\ncopy.a = 99;\nconsole.log(obj.a);", options: ["1", "99", "undefined", "Error"], correct: 1, explanation: "Objects are assigned by reference. copy and obj point to the same object." },
    { code: "console.log([1,2,3].map(x => x * 2).filter(x => x > 3));", options: ["[2,4,6]", "[4,6]", "[6]", "[2]"], correct: 1, explanation: "map gives [2,4,6], filter(>3) keeps [4,6]." },
    { code: "let i = 3;\nconsole.log(i++);", options: ["4", "3", "2", "undefined"], correct: 1, explanation: "Post-increment returns the value BEFORE incrementing." },
    { code: "console.log(!!0);", options: ["0", "true", "false", "null"], correct: 2, explanation: "!0 = true, !!0 = false. Double-negation converts to boolean." },
    { code: "console.log('hello'.charAt(1));", options: ["h", "e", "l", "o"], correct: 1, explanation: "charAt(1) returns the character at index 1 which is 'e'." },
    { code: "const arr = [1, [2, [3]]];\nconsole.log(arr.flat().length);", options: ["3", "2", "4", "1"], correct: 0, explanation: "flat() flattens one level: [1, 2, [3]], length = 3." },
    { code: "console.log(+true + +false);", options: ["0", "1", "2", "NaN"], correct: 1, explanation: "+true = 1, +false = 0, so 1+0 = 1." },
  ],
  code_puzzle: [
    { instruction: "Reverse a string using split, reverse, and join.", before: "function reverse(str) {\n  return str", blank: '.split("").reverse().join("")', after: ";\n}", options: ['.split("").reverse().join("")', ".reverse()", '.split("")', '.join("")'], correct: 0, explanation: "split creates array, reverse reverses it, join converts back." },
    { instruction: "Check if a number is positive (strictly greater than zero).", before: "function isPositive(n) {\n  return n", blank: "> 0", after: ";\n}", options: [">= 0", "> 0", "!== 0", "< 0"], correct: 1, explanation: "n > 0 excludes zero which is not positive." },
    { instruction: "Find the first even number in an array.", before: "const nums = [1, 3, 4, 7];\nconst first = nums.", blank: "find(n => n % 2 === 0)", after: ";", options: ["find(n => n % 2 === 0)", "filter(n => n % 2 === 0)", "map(n => n % 2)", "indexOf(2)"], correct: 0, explanation: "find() returns the first matching element." },
    { instruction: "Destructure name and age from a person object.", before: "const person = { name: 'Alice', age: 30 };\nconst {", blank: "name, age", after: "} = person;", options: ["name, age", "person.name, person.age", "'name', 'age'", "name: n, age: a"], correct: 0, explanation: "Destructuring extracts properties matching the variable names." },
    { instruction: "Use reduce to sum all elements of an array starting from 0.", before: "const total = [1,2,3,4].reduce((acc, x) =>", blank: "acc + x", after: ", 0);", options: ["acc + x", "acc * x", "acc - x", "x"], correct: 0, explanation: "acc accumulates the sum; start value is 0." },
    { instruction: "Filter an array to keep only strings longer than 3 characters.", before: "const result = ['hi', 'hello', 'hey', 'world'].filter(s =>", blank: "s.length > 3", after: ");", options: ["s.length > 3", "s > 3", "s.size > 3", "length(s) > 3"], correct: 0, explanation: "s.length gives the character count of string s." },
    { instruction: "Get the maximum number in an array using Math.max and spread.", before: "const max = Math.max(", blank: "...arr", after: ");", options: ["...arr", "arr", "arr.max()", "spread(arr)"], correct: 0, explanation: "Math.max needs individual arguments; spread operator unpacks the array." },
    { instruction: "Create a promise that resolves after a delay (ms).", before: "function delay(ms) {\n  return new Promise(resolve =>", blank: "setTimeout(resolve, ms)", after: ");\n}", options: ["setTimeout(resolve, ms)", "setInterval(resolve, ms)", "resolve(ms)", "wait(ms)"], correct: 0, explanation: "setTimeout calls resolve after ms milliseconds, resolving the promise." },
  ],
};

// Pick N random questions from pool, using time to ensure variety
function pickRandom(pool, n = 4) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ── Generate AI Challenges ────────────────────────────────────────────────────
router.post('/generate-challenges', protect, async (req, res) => {
  const { language, gameType, difficulty, topic } = req.body;

  if (!language || !gameType) {
    return res.status(400).json({ message: "language and gameType are required" });
  }

  try {
    const challenges = await generateGameChallenges({
      language,
      gameType,
      difficulty: difficulty || "medium",
      topic: topic || "General Programming"
    });
    res.json({ challenges, source: "ai" });
  } catch (error) {
    console.warn("AI generation failed, using fallback:", error.message?.slice(0, 100));
    const fallbackKey = gameType === "debugging" ? "debugging" : gameType === "output_prediction" ? "output_prediction" : "code_puzzle";
    const pool = FALLBACK_POOL[fallbackKey] || FALLBACK_POOL.debugging;
    const shuffled = pickRandom(pool, 4);
    res.json({ challenges: shuffled, source: "fallback", notice: "AI is busy — using curated questions. Try again later for fresh AI questions!" });
  }
});

router.post('/submit', protect, async (req, res) => {
  try {
    const { gameType, topic, question, correctAnswer, userAnswer, timeTaken } = req.body;
    
    // Evaluate correctness
    const { isCorrect, mistakeType } = evaluateGameAnswer(gameType, userAnswer, correctAnswer);
    
    // AI Feedback (only if incorrect, though can be generated for correct answers too)
    let aiFeedback = null;
    if (!isCorrect) {
      try {
        aiFeedback = await analyzeGameSession({
          gameType,
          question,
          correctAnswer,
          userAnswer,
          mistakeType
        });
      } catch (aiErr) {
        console.error("AI Feedback failed:", aiErr.message);
        aiFeedback = {
          explanation: "The AI service is currently experiencing high demand, so detailed feedback is unavailable. However, keep practicing and try this question again!",
          stepByStep: "We couldn't generate a step-by-step breakdown right now.",
          whereYouLacked: "Try double-checking syntax and logic."
        };
      }
    }

    // Update user skills
    const user = await User.findById(req.user.id);
    let currentSkill = user.skills?.get(topic);
    const updatedSkill = updateSkillData(currentSkill, isCorrect, mistakeType);
    
    if (!user.skills) user.skills = new Map();
    user.skills.set(topic, updatedSkill);
    await user.save();
    
    // Calculate new difficulty
    const nextDifficulty = calculateNextDifficulty(updatedSkill);

    // Save GameSession
    const session = new GameSession({
      userId: req.user.id,
      gameType,
      topic,
      difficulty: nextDifficulty,
      questionContent: question,
      correctSolution: correctAnswer,
      userAnswer,
      isCorrect,
      mistakeType,
      timeTaken,
      aiExplanation: aiFeedback?.explanation,
      aiStepByStep: aiFeedback?.stepByStep,
      aiWhereYouLacked: aiFeedback?.whereYouLacked
    });
    await session.save();

    // Log Activity
    await logActivity(req.user.id, "game_play", {
      gameType,
      topic,
      score: isCorrect ? 10 : 0,
      timeSpent: timeTaken
    });

    res.json({
      isCorrect,
      mistakeType,
      nextDifficulty,
      aiFeedback
    });

  } catch (error) {
    console.error("Game submit error in backend:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

export default router;
