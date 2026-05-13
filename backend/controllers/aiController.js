import { GoogleGenAI } from "@google/genai";
import { YoutubeTranscript } from "youtube-transcript";
import Quiz from "../models/Quiz.js";
import Course from "../models/Course.js";
import vm from "vm";
import dotenv from "dotenv";
dotenv.config();

export const generateQuizAndNotes = async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const { courseId, videoId, force } = req.body;

    if (!courseId || !videoId) {
      return res.status(400).json({ message: "Course ID and Video ID are required" });
    }

    // If force-regenerate, delete existing quizzes first
    if (force) {
      await Quiz.deleteMany({ courseId, videoId });
      console.log(`Force-regenerate: deleted old quizzes for video ${videoId}`);
    } else {
      // Check if quizzes already exist for this video
      const existingQuizzes = await Quiz.find({ courseId, videoId });
      if (existingQuizzes.length > 0) {
        return res.status(200).json({ 
          message: "Quizzes already exist", 
          quizzes: existingQuizzes,
          summary: "Quizzes loaded from cache. Test your knowledge below!"
        });
      }
    }

    // 1. Fetch Transcript with real timestamps
    console.log(`Fetching transcript for video ${videoId}...`);
    let transcriptData;
    try {
      transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (e) {
      console.log("Transcript fetch failed:", e.message);
      return res.status(400).json({ message: "Could not extract transcript for this video. It might not have closed captions enabled." });
    }

    // Build a timestamped transcript so the AI knows WHEN each thing is said
    // Group transcript into ~30s segments for readability
    const segments = [];
    let segText = "";
    let segStart = 0;
    for (const t of transcriptData) {
      const ts = Math.floor(t.offset / 1000); // offset is in ms
      if (segments.length === 0 && segText === "") segStart = ts;
      segText += " " + t.text;
      // Flush every ~30 seconds of content
      if (ts - segStart >= 30) {
        const mm = String(Math.floor(segStart / 60)).padStart(2, "0");
        const ss = String(segStart % 60).padStart(2, "0");
        segments.push(`[${mm}:${ss} / ${segStart}s] ${segText.trim()}`);
        segText = "";
        segStart = ts;
      }
    }
    if (segText.trim()) {
      const mm = String(Math.floor(segStart / 60)).padStart(2, "0");
      const ss = String(segStart % 60).padStart(2, "0");
      segments.push(`[${mm}:${ss} / ${segStart}s] ${segText.trim()}`);
    }

    // Cap to ~18000 chars to stay within Gemini context
    const timestampedTranscript = segments.join("\n").slice(0, 18000);

    // 2. Call Gemini with a detailed, video-specific prompt
    console.log("Generating AI Quiz using Gemini (timestamped)...");
    const prompt = `You are an expert coding educator. Your job is to create HIGHLY ACCURATE quiz questions for a programming tutorial video.

IMPORTANT: Read the full timestamped transcript below carefully BEFORE generating questions.
Each line starts with [MM:SS / Xs] showing the time in the video when that content was spoken.

TIMESTAMPED TRANSCRIPT:
${timestampedTranscript}

YOUR TASK — Two steps:

STEP 1 — UNDERSTAND THE VIDEO:
Read the entire transcript. Identify:
- The programming language and main topic of the video
- Each distinct concept, function, or technique explained
- Code examples or syntax the instructor demonstrated
- The order concepts are introduced

STEP 2 — GENERATE 5–7 QUESTIONS:
For each question, pick a SPECIFIC moment in the video (a specific timestamp) and write a question about exactly what was explained at that moment. Rules:
- Each question MUST test something ACTUALLY SAID OR SHOWN in this video — not general knowledge
- Use the instructor's own words, variable names, or code examples when possible
- Questions should span the FULL video (early, middle, late segments)
- At least 2 questions must include a code snippet (using \`backticks\`) pulled from the transcript
- Include output-prediction and "what is wrong with this" style questions where applicable
- Wrong options should be plausible but clearly incorrect based on the video content
- The timestamp for each question must match when that topic was discussed

Return ONLY valid JSON (no markdown fences), matching exactly:
{
  "summary": "2–3 sentences describing what this specific video teaches — mention the language, topic, and key concepts shown.",
  "questions": [
    {
      "question": "Question referencing exact content from the video",
      "options": ["Correct answer", "Plausible wrong A", "Plausible wrong B", "Plausible wrong C"],
      "correctAnswer": 0,
      "explanation": "Why this is correct, quoting or referencing the video content directly.",
      "difficulty": "easy",
      "timestamp": 45
    }
  ]
}

Strict rules:
- correctAnswer: integer 0–3
- timestamp: integer seconds matching video content
- difficulty: exactly "easy", "medium", or "hard"
- explanation: reference what the instructor ACTUALLY said/showed
- 5–7 questions total, spread from easy → hard, covering early to late in the video`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const aiResultText = response.text;
    console.log("AI Response received.");
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(aiResultText);
    } catch (parseErr) {
      console.log("Failed to parse AI JSON:", aiResultText);
      return res.status(500).json({ message: "AI returned invalid format." });
    }

    // 3. Save to Database
    const savedQuizzes = [];
    for (const q of parsedResult.questions) {
      const xpMap = { easy: 25, medium: 50, hard: 100 };
      const newQuiz = new Quiz({
        courseId,
        videoId,
        timestamp: q.timestamp || 0,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        xpReward: xpMap[q.difficulty] || 50,
      });
      await newQuiz.save();
      savedQuizzes.push(newQuiz);
    }

    res.status(201).json({
      message: "Quiz generated successfully",
      summary: parsedResult.summary,
      quizzes: savedQuizzes
    });

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: "Error generating AI content", error: error.message });
  }
};

export const getQuizzesForVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const quizzes = await Quiz.find({ videoId }).sort({ timestamp: 1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: "Error fetching quizzes", error: error.message });
  }
};

// Sandboxed JavaScript code execution
export const runCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "No code provided" });

    const logs = [];
    const errors = [];

    const sandboxConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)).join(" ")),
      error: (...args) => errors.push(args.map(a => String(a)).join(" ")),
      warn: (...args) => logs.push("[warn] " + args.map(a => String(a)).join(" ")),
      info: (...args) => logs.push(args.map(a => String(a)).join(" ")),
    };

    const sandbox = {
      console: sandboxConsole,
      Math,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      setTimeout: undefined,
      setInterval: undefined,
      fetch: undefined,
      require: undefined,
      process: undefined,
    };

    vm.createContext(sandbox);

    try {
      vm.runInContext(code, sandbox, { timeout: 3000 });
    } catch (execErr) {
      errors.push(execErr.message);
    }

    res.status(200).json({
      output: logs.join("\n"),
      errors: errors.join("\n"),
    });
  } catch (error) {
    res.status(500).json({ message: "Code execution error", error: error.message });
  }
};
