"use client";

import { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Zap, Trophy, Play, CheckCircle, XCircle, RotateCcw, Loader2, Sparkles, ChevronRight, Search, X } from "lucide-react";
import { CodePuzzle } from "@/components/games/CodePuzzle";
import { OutputPrediction } from "@/components/games/OutputPrediction";
import { DebuggingChallenge } from "@/components/games/DebuggingChallenge";

// ── Constants ─────────────────────────────────────────────────────────────────
const POPULAR_LANGUAGES = [
  "JavaScript", "Python", "Java", "C++", "TypeScript",
  "Go", "Rust", "C#", "Ruby", "PHP",
  "Swift", "Kotlin", "Dart", "R", "Scala",
  "Haskell", "Lua", "Perl", "C", "SQL",
];

const TOPICS_BY_CATEGORY = {
  "Fundamentals": ["Variables & Data Types", "Operators", "Control Flow", "Loops", "Functions"],
  "Data Structures": ["Arrays / Lists", "Strings", "Dictionaries / Maps", "Sets", "Stacks & Queues", "Linked Lists"],
  "OOP & Patterns": ["Classes & Objects", "Inheritance", "Polymorphism", "Interfaces", "Design Patterns"],
  "Advanced": ["Recursion", "Closures", "Higher-Order Functions", "Async / Promises", "Error Handling", "Generics"],
  "Algorithms": ["Sorting", "Searching", "Big-O Complexity", "Dynamic Programming", "Graph Algorithms"],
};

const GAME_TYPES = [
  { id: "fix-bug",       apiType: "debugging",         title: "Fix the Bug 🐛",        description: "Find and fix real bugs in code. AI generates unique broken snippets.",  icon: "🐛", xpReward: 75,  minLevel: 1 },
  { id: "output-predict", apiType: "output_prediction", title: "Predict the Output 🔮", description: "Guess what the code outputs. Tests your mental model of the language.", icon: "🔮", xpReward: 60,  minLevel: 1 },
  { id: "code-puzzle",   apiType: "code_puzzle",        title: "Code Puzzle 🧩",        description: "Fill in the missing piece of the code to make it work.",               icon: "🧩", xpReward: 100, minLevel: 2 },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function GamesPage() {
  // Selection state
  const [language, setLanguage]     = useState("JavaScript");
  const [langInput, setLangInput]   = useState("JavaScript");
  const [topic, setTopic]           = useState("");
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Game state
  const [phase, setPhase]               = useState<"select" | "loading" | "play" | "result">("select");
  const [selectedGame, setSelectedGame] = useState<typeof GAME_TYPES[0] | null>(null);
  const [challenges, setChallenges]     = useState<any[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore]               = useState(0);
  const [xpEarned, setXpEarned]         = useState(0);
  const [answered, setAnswered]         = useState(false);
  const [aiFeedback, setAiFeedback]     = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFallback, setIsFallback]     = useState(false);
  const [userLevel, setUserLevel]       = useState(1);
  const [loadingUser, setLoadingUser]   = useState(true);
  const [genError, setGenError]         = useState<string | null>(null);

  useEffect(() => {
    fetchWithAuth("/auth/me").then(u => setUserLevel(u.level || 1)).finally(() => setLoadingUser(false));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLangDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredLangs = POPULAR_LANGUAGES.filter(l => l.toLowerCase().includes(langInput.toLowerCase()));
  const currentChallenge = challenges[challengeIndex] ?? null;
  const isLastChallenge  = challengeIndex >= challenges.length - 1;

  const selectLanguage = (lang: string) => {
    setLanguage(lang);
    setLangInput(lang);
    setShowLangDropdown(false);
  };

  // ── Start Game ──────────────────────────────────────────────────────────────
  const startGame = async (game: typeof GAME_TYPES[0]) => {
    const resolvedLang = langInput.trim() || "JavaScript";
    const resolvedTopic = topic.trim() || "General Programming";

    setLanguage(resolvedLang);
    setSelectedGame(game);
    setPhase("loading");
    setGenError(null);
    setIsFallback(false);
    setScore(0);
    setXpEarned(0);
    setChallengeIndex(0);
    setAnswered(false);
    setAiFeedback(null);

    try {
      const data = await fetchWithAuth("/games/generate-challenges", {
        method: "POST",
        body: JSON.stringify({
          language: resolvedLang,
          gameType: game.apiType,
          topic: resolvedTopic,
          difficulty: userLevel >= 5 ? "hard" : userLevel >= 3 ? "medium" : "easy",
        }),
      });

      const shuffled = [...data.challenges].sort(() => Math.random() - 0.5).slice(0, 4);
      setChallenges(shuffled);
      setIsFallback(data.source === "fallback");
      setPhase("play");
    } catch {
      setGenError("Could not connect to the server. Please check your connection.");
      setPhase("select");
    }
  };

  // ── Submit Answer ───────────────────────────────────────────────────────────
  const handleGameSubmit = async (answer: string) => {
    if (!currentChallenge || !selectedGame) return;
    setIsSubmitting(true);
    setAiFeedback(null);

    let questionContent = "";
    let correctAnswer   = "";

    if (selectedGame.id === "fix-bug") {
      questionContent = currentChallenge.buggyCode;
      correctAnswer   = currentChallenge.fixedCode;
    } else if (selectedGame.id === "output-predict") {
      questionContent = currentChallenge.code;
      correctAnswer   = currentChallenge.options[currentChallenge.correct];
    } else if (selectedGame.id === "code-puzzle") {
      questionContent = `${currentChallenge.before}_____${currentChallenge.after}`;
      correctAnswer   = currentChallenge.blank || currentChallenge.options[currentChallenge.correct];
    }

    const mappedGameType =
      selectedGame.id === "fix-bug" ? "debugging" :
      selectedGame.id === "output-predict" ? "output_prediction" : "code_puzzle";

    try {
      const result = await fetchWithAuth("/games/submit", {
        method: "POST",
        body: JSON.stringify({ gameType: mappedGameType, topic: language, question: questionContent, correctAnswer, userAnswer: answer, timeTaken: 30 }),
      });
      if (result.isCorrect) setScore(s => s + 1);
      setAiFeedback(result);
    } catch {
      setAiFeedback({ isCorrect: false, aiFeedback: null });
    } finally {
      setIsSubmitting(false);
      setAnswered(true);
    }
  };

  // ── Next Challenge ──────────────────────────────────────────────────────────
  const next = async () => {
    if (isLastChallenge) {
      const earned = Math.round((score / challenges.length) * (selectedGame?.xpReward ?? 0));
      setXpEarned(earned);
      if (earned > 0) await fetchWithAuth("/auth/award-xp", { method: "PATCH", body: JSON.stringify({ amount: earned }) });
      setPhase("result");
    } else {
      setChallengeIndex(i => i + 1);
      setAnswered(false);
      setAiFeedback(null);
    }
  };

  if (loadingUser) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  // ── Loading Screen ──────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-1">Generating {language} · {topic || "General"} Challenges...</h2>
        <p className="text-muted-foreground text-sm">Gemini AI is crafting unique questions just for you</p>
      </div>
    </div>
  );

  // ── Result Screen ───────────────────────────────────────────────────────────
  if (phase === "result") return (
    <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
      <div className="text-7xl mb-6">{score === challenges.length ? "🏆" : score > 0 ? "🎯" : "😅"}</div>
      <h2 className="text-3xl font-extrabold mb-2">Game Over!</h2>
      <p className="text-muted-foreground mb-1">You scored <strong>{score}/{challenges.length}</strong> on {selectedGame!.title}</p>
      <p className="text-xs text-muted-foreground mb-6">{language} · {topic || "General Programming"}</p>
      {xpEarned > 0 && (
        <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-6 py-3 rounded-2xl text-xl font-bold mb-6">
          <Zap className="w-5 h-5" /> +{xpEarned} XP Earned!
        </div>
      )}
      <div className="flex gap-4">
        <button onClick={() => selectedGame && startGame(selectedGame)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border hover:bg-secondary font-bold transition-all">
          <RotateCcw className="w-4 h-4" /> New Questions
        </button>
        <button onClick={() => { setPhase("select"); setSelectedGame(null); setChallenges([]); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all">
          <Trophy className="w-4 h-4" /> More Games
        </button>
      </div>
    </div>
  );

  // ── Play Screen ─────────────────────────────────────────────────────────────
  if (phase === "play") return (
    <div className="animate-in fade-in duration-300 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-extrabold">{selectedGame!.title}</h2>
          <p className="text-xs text-muted-foreground">
            {language} · {topic || "General"} · Challenge {challengeIndex + 1}/{challenges.length} · Score: {score}
          </p>
        </div>
        <button onClick={() => { setPhase("select"); setChallenges([]); }} className="text-xs text-muted-foreground hover:text-foreground border border-border px-3 py-1.5 rounded-lg">
          Exit Game
        </button>
      </div>

      <div className="h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(challengeIndex / challenges.length) * 100}%` }} />
      </div>

      {isFallback && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
          ⚡ AI is busy — playing with curated questions. Try again for fresh AI-generated ones!
        </div>
      )}

      {isSubmitting ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">AI is evaluating your answer...</p>
        </div>
      ) : (
        <>
          {selectedGame!.id === "fix-bug" && currentChallenge && (
            <DebuggingChallenge key={challengeIndex} question={{ content: currentChallenge.buggyCode, instruction: currentChallenge.instruction, concept: currentChallenge.concept, hint: currentChallenge.hint }} onSubmit={handleGameSubmit} />
          )}
          {selectedGame!.id === "output-predict" && currentChallenge && (
            <OutputPrediction key={challengeIndex} question={{ content: currentChallenge.code }} options={currentChallenge.options} onSubmit={handleGameSubmit} />
          )}
          {selectedGame!.id === "code-puzzle" && currentChallenge && (
            <CodePuzzle key={challengeIndex} question={{ content: `${currentChallenge.before}_____${currentChallenge.after}`, instruction: currentChallenge.instruction, options: currentChallenge.options, correct: currentChallenge.correct }} onSubmit={handleGameSubmit} />
          )}

          {answered && aiFeedback && (
            <div className={`mt-6 p-6 rounded-2xl border ${aiFeedback.isCorrect ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}`}>
              <div className="flex items-center gap-3 mb-4">
                {aiFeedback.isCorrect ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                <h3 className={`text-lg font-bold ${aiFeedback.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {aiFeedback.isCorrect ? "Correct! Excellent work." : "Incorrect — let's learn from this."}
                </h3>
              </div>
              {aiFeedback.isCorrect && currentChallenge?.explanation && (
                <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                  <p className="text-sm font-semibold text-emerald-400 mb-1">Why this is correct:</p>
                  <p className="text-sm text-foreground">{currentChallenge.explanation}</p>
                </div>
              )}
              {!aiFeedback.isCorrect && aiFeedback.aiFeedback && (
                <div className="space-y-3">
                  <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-semibold text-rose-400 mb-1">What went wrong:</p>
                    <p className="text-sm text-foreground">{aiFeedback.aiFeedback.explanation}</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-semibold text-emerald-400 mb-1">Step-by-step Solution:</p>
                    <p className="text-sm text-foreground">{aiFeedback.aiFeedback.stepByStep}</p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm font-semibold text-primary mb-1">Concept to Practice:</p>
                    <p className="text-sm text-foreground">{aiFeedback.aiFeedback.whereYouLacked}</p>
                  </div>
                </div>
              )}
              <button onClick={next} className="mt-5 w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                {isLastChallenge ? "See Results 🏆" : "Next Challenge"} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ── Select Screen ───────────────────────────────────────────────────────────
  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">🎮 Game Zone</h1>
        <p className="text-muted-foreground text-sm flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-primary" />
          Gemini AI generates unique challenges for ANY language and topic — every session is different!
        </p>
      </div>

      {genError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          ⚠️ {genError}
        </div>
      )}

      {/* Config Panel */}
      <div className="mb-8 bg-card border border-border rounded-2xl p-6 space-y-6">
        {/* Language Input */}
        <div>
          <label className="text-sm font-bold mb-2 block">🌐 Programming Language</label>
          <div className="relative" ref={langRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={langInput}
                onChange={e => { setLangInput(e.target.value); setShowLangDropdown(true); }}
                onFocus={() => setShowLangDropdown(true)}
                placeholder="Type any language (e.g. Haskell, Elixir, Zig...)"
                className="w-full pl-9 pr-9 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all"
              />
              {langInput && (
                <button onClick={() => { setLangInput(""); setShowLangDropdown(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showLangDropdown && (
              <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                {langInput.trim() && !POPULAR_LANGUAGES.map(l => l.toLowerCase()).includes(langInput.toLowerCase()) && (
                  <button onClick={() => selectLanguage(langInput.trim())} className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/10 text-primary font-semibold border-b border-border">
                    ✨ Use "{langInput.trim()}" (custom)
                  </button>
                )}
                {filteredLangs.length === 0 && !langInput.trim() && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Type to search or enter any language</p>
                )}
                {filteredLangs.map(lang => (
                  <button key={lang} onClick={() => selectLanguage(lang)} className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-all ${language === lang ? "text-primary font-bold" : "text-foreground"}`}>
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Popular quick-picks */}
          <div className="flex flex-wrap gap-2 mt-3">
            {["JavaScript", "Python", "Java", "C++", "TypeScript", "Go", "Rust"].map(lang => (
              <button key={lang} onClick={() => selectLanguage(lang)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${language === lang ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Picker */}
        <div>
          <label className="text-sm font-bold mb-2 block">📚 Topic <span className="text-muted-foreground font-normal">(optional — leave blank for mixed)</span></label>
          {/* Custom topic input */}
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Binary Trees, Decorators, Concurrency, Regex..."
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-all mb-3"
          />
          {/* Preset topics by category */}
          <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
            {Object.entries(TOPICS_BY_CATEGORY).map(([cat, topics]) => (
              <div key={cat}>
                <p className="text-xs font-bold text-muted-foreground mb-1.5">{cat}</p>
                <div className="flex flex-wrap gap-1.5">
                  {topics.map(t => (
                    <button key={t} onClick={() => setTopic(topic === t ? "" : t)}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${topic === t ? "border-primary bg-primary/10 text-primary font-bold" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary pill */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Playing:</span>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-semibold">{language}</span>
          {topic && <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">{topic}</span>}
          {!topic && <span className="text-xs bg-white/5 text-muted-foreground border border-border px-3 py-1 rounded-full">Mixed Topics</span>}
        </div>
      </div>

      {/* Game Cards */}
      <h2 className="text-lg font-bold mb-4">Choose a Game Mode</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {GAME_TYPES.map(game => {
          const locked = userLevel < game.minLevel;
          return (
            <div key={game.id} className={`relative bg-card border-2 rounded-2xl p-6 transition-all ${locked ? "border-border opacity-60" : "border-border hover:border-primary/50 hover:shadow-lg"}`}>
              {locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 rounded-2xl z-10">
                  <span className="text-2xl mb-1">🔒</span>
                  <p className="text-sm font-bold text-muted-foreground">Requires Level {game.minLevel}</p>
                </div>
              )}
              <div className="text-5xl mb-4">{game.icon}</div>
              <h3 className="text-xl font-extrabold mb-2">{game.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-500"><Zap className="w-3 h-3" /> +{game.xpReward} XP max</span>
              </div>
              {!locked && (
                <button onClick={() => startGame(game)} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> Generate & Play
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
