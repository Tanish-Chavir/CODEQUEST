"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Code2, Zap, Target, Trophy, Play, CheckCircle, XCircle, RotateCcw, Lock, Loader2 } from "lucide-react";

// ── Game Data ─────────────────────────────────────────────────────────────────
const GAMES = [
  {
    id: "fix-bug",
    title: "Fix the Bug 🐛",
    description: "Find and fix the bug in the code snippet to earn XP.",
    icon: "🐛",
    xpReward: 75,
    minLevel: 1,
    challenges: [
      {
        instruction: "The function should return the sum of two numbers but it's broken. Fix it!",
        buggyCode: `function add(a, b) {\n  return a - b;\n}`,
        fixedCode: `function add(a, b) {\n  return a + b;\n}`,
        hint: "Look at the operator being used.",
        language: "javascript",
      },
      {
        instruction: "This loop should print numbers 1 to 5 but it has an off-by-one error.",
        buggyCode: `for (let i = 0; i < 5; i++) {\n  console.log(i);\n}`,
        fixedCode: `for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}`,
        hint: "Check the loop start value and condition.",
        language: "javascript",
      },
      {
        instruction: "The function should check if a number is even. Fix the condition.",
        buggyCode: `function isEven(n) {\n  return n % 2 === 1;\n}`,
        fixedCode: `function isEven(n) {\n  return n % 2 === 0;\n}`,
        hint: "What does the modulo operator return for even numbers?",
        language: "javascript",
      },
      {
        instruction: "This function should return the maximum of an array, but it starts wrong.",
        buggyCode: `function maxVal(arr) {\n  let max = 0;\n  for (let x of arr) {\n    if (x > max) max = x;\n  }\n  return max;\n}`,
        fixedCode: `function maxVal(arr) {\n  let max = arr[0];\n  for (let x of arr) {\n    if (x > max) max = x;\n  }\n  return max;\n}`,
        hint: "What if all numbers are negative?",
        language: "javascript",
      },
    ]
  },
  {
    id: "output-predict",
    title: "Predict the Output 🔮",
    description: "Guess what the code will output. No running allowed!",
    icon: "🔮",
    xpReward: 60,
    minLevel: 1,
    challenges: [
      {
        code: `let x = 5;\nx = x * 2;\nconsole.log(x + 3);`,
        options: ["10", "13", "8", "15"],
        correct: 1,
        explanation: "x starts as 5, becomes 10 after *2, then 10+3 = 13"
      },
      {
        code: `let arr = [1, 2, 3];\nconsole.log(arr.length + arr[0]);`,
        options: ["4", "3", "31", "6"],
        correct: 0,
        explanation: "arr.length is 3, arr[0] is 1, so 3+1 = 4"
      },
      {
        code: `function greet(name) {\n  return "Hello, " + name + "!";\n}\nconsole.log(greet("World"));`,
        options: ["Hello, World", "Hello World!", "Hello, World!", "greet(World)"],
        correct: 2,
        explanation: "The function concatenates 'Hello, ' + 'World' + '!' = 'Hello, World!'"
      },
      {
        code: `let a = "5";\nlet b = 3;\nconsole.log(a + b);`,
        options: ["8", "53", "\"53\"", "Error"],
        correct: 1,
        explanation: "String + Number = String concatenation in JS. '5' + 3 = '53'"
      },
    ]
  },
  {
    id: "code-puzzle",
    title: "Code Puzzle 🧩",
    description: "Fill in the missing piece to make the code work correctly.",
    icon: "🧩",
    xpReward: 100,
    minLevel: 2,
    challenges: [
      {
        instruction: "Complete the function to reverse a string.",
        before: `function reverse(str) {\n  return str`,
        blank: `.split("").reverse().join("")`,
        after: `;\n}`,
        options: [`.split("").reverse().join("")`, `.reverse()`, `.split("")`, `.join("")`],
        correct: 0,
        explanation: "split() converts to array, reverse() reverses it, join() converts back to string."
      },
      {
        instruction: "Complete the condition to check if a number is positive.",
        before: `function isPositive(n) {\n  return n`,
        blank: `> 0`,
        after: `;\n}`,
        options: [`>= 0`, `> 0`, `!== 0`, `< 0`],
        correct: 1,
        explanation: "n > 0 is true for positive numbers (0 is not positive)."
      },
    ]
  }
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function GamesPage() {
  const [selected, setSelected] = useState<typeof GAMES[0] | null>(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [phase, setPhase] = useState<"select" | "play" | "result">("select");
  const [userCode, setUserCode] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/auth/me").then(u => {
      setUserLevel(u.level || 1);
    }).finally(() => setLoading(false));
  }, []);

  const currentChallenge = selected ? selected.challenges[challengeIndex] : null;
  const isLastChallenge  = selected ? challengeIndex >= selected.challenges.length - 1 : false;

  const startGame = (game: typeof GAMES[0]) => {
    setSelected(game);
    setChallengeIndex(0);
    setScore(0);
    setXpEarned(0);
    setUserCode(game.id === "fix-bug" ? (game.challenges[0] as any).buggyCode : "");
    setSelectedOption(null);
    setAnswered(false);
    setPhase("play");
  };

  const handleFixBugSubmit = () => {
    if (!currentChallenge || !selected) return;
    const ch = currentChallenge as any;
    const normalized = userCode.replace(/\s+/g, " ").trim();
    const normalFixed = ch.fixedCode.replace(/\s+/g, " ").trim();
    const isCorrect = normalized === normalFixed;
    if (isCorrect) setScore(s => s + 1);
    setAnswered(true);
  };

  const handleOptionSelect = (idx: number) => {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
    const ch = currentChallenge as any;
    if (idx === ch.correct) setScore(s => s + 1);
  };

  const next = async () => {
    if (isLastChallenge) {
      // Award XP
      if (!selected) return;
      const earned = Math.round((score / selected.challenges.length) * selected.xpReward);
      setXpEarned(earned);
      if (earned > 0) {
        await fetchWithAuth("/auth/award-xp", {
          method: "PATCH",
          body: JSON.stringify({ amount: earned })
        });
      }
      setPhase("result");
    } else {
      setChallengeIndex(i => i + 1);
      const next = selected!.challenges[challengeIndex + 1];
      setUserCode(selected!.id === "fix-bug" ? (next as any).buggyCode : "");
      setSelectedOption(null);
      setAnswered(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  // ── Game Select Screen ───────────────────────────────────────────────────────
  if (phase === "select") return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">🎮 Game Zone</h1>
        <p className="text-muted-foreground text-sm">Earn XP by completing coding challenges!</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GAMES.map(game => {
          const locked = userLevel < game.minLevel;
          return (
            <div key={game.id}
              className={`relative bg-card border-2 rounded-2xl p-6 transition-all ${
                locked
                  ? "border-border opacity-60"
                  : "border-border hover:border-primary/50 hover:shadow-lg cursor-pointer"
              }`}
            >
              {locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-2xl z-10">
                  <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-bold text-muted-foreground">Requires Level {game.minLevel}</p>
                </div>
              )}
              <div className="text-5xl mb-4">{game.icon}</div>
              <h3 className="text-xl font-extrabold mb-2">{game.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500">
                  <Zap className="w-3 h-3" /> +{game.xpReward} XP max
                </span>
                <span className="text-xs text-muted-foreground">{game.challenges.length} challenges</span>
              </div>
              {!locked && (
                <button
                  onClick={() => startGame(game)}
                  className="mt-4 w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" /> Play Now
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Result Screen ────────────────────────────────────────────────────────────
  if (phase === "result") return (
    <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <div className="text-7xl mb-6">{score === selected!.challenges.length ? "🏆" : score > 0 ? "🎯" : "😅"}</div>
      <h2 className="text-3xl font-extrabold mb-2">Game Over!</h2>
      <p className="text-muted-foreground mb-6">
        You scored <strong>{score}/{selected!.challenges.length}</strong> on {selected!.title}
      </p>
      {xpEarned > 0 && (
        <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-6 py-3 rounded-2xl text-xl font-bold mb-6">
          <Zap className="w-5 h-5" /> +{xpEarned} XP Earned!
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={() => startGame(selected!)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border hover:bg-secondary font-bold transition-all">
          <RotateCcw className="w-4 h-4" /> Play Again
        </button>
        <button onClick={() => { setPhase("select"); setSelected(null); }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all">
          <Trophy className="w-4 h-4" /> More Games
        </button>
      </div>
    </div>
  );

  // ── Play Screen ──────────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold">{selected!.title}</h2>
          <p className="text-xs text-muted-foreground">
            Challenge {challengeIndex + 1} of {selected!.challenges.length} · Score: {score}
          </p>
        </div>
        <button onClick={() => setPhase("select")}
          className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg">
          Exit Game
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((challengeIndex) / selected!.challenges.length) * 100}%` }}
        />
      </div>

      {/* Fix the Bug */}
      {selected!.id === "fix-bug" && currentChallenge && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="font-bold">{(currentChallenge as any).instruction}</p>
          <p className="text-xs text-muted-foreground">Edit the code below to fix the bug:</p>
          <textarea
            value={userCode}
            onChange={e => setUserCode(e.target.value)}
            disabled={answered}
            rows={6}
            className="w-full font-mono text-sm bg-zinc-900 text-zinc-100 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 border border-zinc-700"
          />
          {answered && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${
              userCode.replace(/\s+/g," ").trim() === (currentChallenge as any).fixedCode.replace(/\s+/g," ").trim()
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}>
              {userCode.replace(/\s+/g," ").trim() === (currentChallenge as any).fixedCode.replace(/\s+/g," ").trim()
                ? <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
                : <XCircle className="w-5 h-5 mt-0.5 shrink-0" />}
              <div>
                <p className="font-bold">
                  {userCode.replace(/\s+/g," ").trim() === (currentChallenge as any).fixedCode.replace(/\s+/g," ").trim()
                    ? "Correct! Great debugging!"
                    : "Not quite. The fix was:"}
                </p>
                {userCode.replace(/\s+/g," ").trim() !== (currentChallenge as any).fixedCode.replace(/\s+/g," ").trim() && (
                  <pre className="mt-2 font-mono text-xs">{(currentChallenge as any).fixedCode}</pre>
                )}
                <p className="mt-1 text-xs opacity-80">Hint: {(currentChallenge as any).hint}</p>
              </div>
            </div>
          )}
          {!answered
            ? <button onClick={handleFixBugSubmit} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all">
                Submit Fix
              </button>
            : <button onClick={next} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all">
                {isLastChallenge ? "See Results 🏆" : "Next Challenge →"}
              </button>
          }
        </div>
      )}

      {/* Predict Output / Code Puzzle */}
      {(selected!.id === "output-predict" || selected!.id === "code-puzzle") && currentChallenge && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="font-bold">{(currentChallenge as any).instruction || "What will this code output?"}</p>
          <pre className="bg-zinc-900 text-zinc-100 font-mono text-sm p-4 rounded-xl overflow-x-auto">
            {(currentChallenge as any).code ||
              `${(currentChallenge as any).before}_____${(currentChallenge as any).after}`}
          </pre>
          <div className="space-y-2.5">
            {(currentChallenge as any).options.map((opt: string, i: number) => {
              const isCorrect = i === (currentChallenge as any).correct;
              let cls = "w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm font-medium ";
              if (!answered) cls += "border-border hover:border-primary/50 hover:bg-secondary/30 cursor-pointer";
              else if (isCorrect) cls += "border-green-500 bg-green-500/10 text-green-400";
              else if (selectedOption === i) cls += "border-red-500 bg-red-500/10 text-red-400";
              else cls += "border-border opacity-40";
              return (
                <button key={i} onClick={() => handleOptionSelect(i)} disabled={answered} className={cls}>
                  <span className="font-mono">{opt}</span>
                </button>
              );
            })}
          </div>
          {answered && (
            <div className="p-4 bg-secondary/50 rounded-xl text-sm border border-border">
              <span className="font-bold text-foreground">Explanation: </span>
              <span className="text-muted-foreground">{(currentChallenge as any).explanation}</span>
            </div>
          )}
          {answered && (
            <button onClick={next} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all">
              {isLastChallenge ? "See Results 🏆" : "Next Challenge →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
