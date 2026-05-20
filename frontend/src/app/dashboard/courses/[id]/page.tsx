"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import {
  Loader2, PlayCircle, CheckCircle, ChevronLeft,
  BrainCircuit, ListVideo, Expand, Code2, Play,
  Terminal, RotateCcw, Zap, X, ChevronRight, Minimize
} from "lucide-react";
import Link from "next/link";

// ── Monaco Editor (lazy) ──────────────────────────────────────────────────────
let MonacoEditor: any = null;

// ── Difficulty badge helper ───────────────────────────────────────────────────
const DIFF_COLORS: Record<string, string> = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return Number(durationStr) || 0;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CoursePlayerPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"timeline" | "quiz" | "code">("timeline");
  const [theaterMode, setTheaterMode] = useState(false);

  // Quiz state
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [summary, setSummary] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [showXpToast, setShowXpToast] = useState(false);
  const [shownQuizIds, setShownQuizIds] = useState<Set<string>>(new Set());

  // Pop-up quiz overlay
  const [popupQuiz, setPopupQuiz] = useState<any>(null);
  const [popupSelected, setPopupSelected] = useState<number | null>(null);
  const [popupAnswered, setPopupAnswered] = useState(false);

  // Video time tracking
  const [currentTime, setCurrentTime] = useState(0);
  const [startSeconds, setStartSeconds] = useState(0);
  const [origin, setOrigin] = useState("");
  const [progressLoaded, setProgressLoaded] = useState(false); // FIX: wait before rendering iframe
  const playerRef = useRef<HTMLIFrameElement>(null);
  const timeRef = useRef(0);
  const lastSaveRef = useRef(0);
  const watchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Live code state
  type CodeLang = "javascript" | "python" | "html";
  const [codeLang, setCodeLang] = useState<CodeLang>("javascript");
  const [codeFullscreen, setCodeFullscreen] = useState(false);
  const [htmlPreviewUrl, setHtmlPreviewUrl] = useState("");
  const DEFAULT_CODE: Record<CodeLang, string> = {
    javascript: `// JavaScript Sandbox\nconsole.log("Hello, CodeQuest!");`,
    python: `# Python Sandbox\nprint("Hello, CodeQuest!")`,
    html: `<!DOCTYPE html>\n<html>\n<body style="font-family:sans-serif;padding:16px">\n  <h1>Hello, CodeQuest!</h1>\n</body>\n</html>`,
  };
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [codeOutput, setCodeOutput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [runningCode, setRunningCode] = useState(false);
  const [monacoLoaded, setMonacoLoaded] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const htmlPreviewRef = useRef<HTMLIFrameElement>(null);

  // Load Monaco lazily
  useEffect(() => {
    import("@monaco-editor/react").then((mod) => {
      MonacoEditor = mod.default;
      setMonacoLoaded(true);
    }).catch(() => {});
  }, []);

  // Load course
  useEffect(() => {
    async function loadCourse() {
      try {
        const data = await fetchWithAuth(`/courses/${id}`);
        setCourse(data);
      } catch (err) {
        console.error("Failed to load course:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [id]);

  // When video changes: load quizzes + resume position
  useEffect(() => {
    if (!course) return;
    setQuizzes([]);
    setSummary("");
    setSelectedOption(null);
    setActiveQuizIndex(0);
    setPopupQuiz(null);
    setShownQuizIds(new Set());
    setCurrentTime(0);
    setProgressLoaded(false); // hide iframe until we know the start time
    lastSaveRef.current = 0;
    timeRef.current = 0;

    const videoId = course.videos[currentVideoIndex]?.videoId;
    if (!videoId) { setProgressLoaded(true); return; }

    // Load quizzes (non-blocking)
    fetchWithAuth(`/ai/quizzes/${videoId}`)
      .then((data) => {
        if (data && data.length > 0) {
          setQuizzes(data);
          setSummary("Quizzes loaded! Test your knowledge below.");
        }
      })
      .catch(() => {});

    // Load saved resume position THEN show iframe (prevents double-render autoplay block)
    fetchWithAuth(`/auth/progress/${id}`)
      .then((progress: any[]) => {
        const entry = progress.find((p) => p.videoId === videoId);
        setStartSeconds(entry?.watchedSeconds ?? 0);
      })
      .catch(() => setStartSeconds(0))
      .finally(() => setProgressLoaded(true)); // NOW render the iframe once
  }, [currentVideoIndex, course]);

  // Poll YouTube iframe for current time via postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (data?.event === "infoDelivery" && data?.info?.currentTime !== undefined) {
          const t = Math.floor(data.info.currentTime);
          timeRef.current = t;
          setCurrentTime(t);
        }
      } catch {}
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Request time from iframe every 2s & track watch time
  useEffect(() => {
    if (watchIntervalRef.current) clearInterval(watchIntervalRef.current);
    watchIntervalRef.current = setInterval(() => {
      // Ask YouTube for current time
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening" }), "*"
      );
      // Save progress every 15s
      if (course && timeRef.current > 0 && timeRef.current - lastSaveRef.current >= 15) {
        const videoId = course.videos[currentVideoIndex]?.videoId;
        fetchWithAuth("/auth/save-progress", {
          method: "PATCH",
          body: JSON.stringify({ courseId: id, videoId, watchedSeconds: timeRef.current }),
        }).catch(() => {});
        fetchWithAuth("/auth/track-time", {
          method: "PATCH",
          body: JSON.stringify({ seconds: timeRef.current - lastSaveRef.current }),
        }).catch(() => {});
        lastSaveRef.current = timeRef.current;
      }
    }, 2000);
    return () => { if (watchIntervalRef.current) clearInterval(watchIntervalRef.current); };
  }, [course, currentVideoIndex, id]);

  // Quiz pop-up trigger based on video time
  useEffect(() => {
    if (!quizzes.length || popupQuiz) return;
    const due = quizzes.find(
      (q) => timeRef.current >= q.timestamp && !shownQuizIds.has(q._id)
    );
    if (due) {
      setPopupQuiz(due);
      setPopupSelected(null);
      setPopupAnswered(false);
      // Pause video
      playerRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "pauseVideo" }), "*"
      );
    }
  }, [currentTime, quizzes, shownQuizIds, popupQuiz]);

  async function handleGenerateAI(force = false) {
    if (!course || !course.videos[currentVideoIndex]) return;
    setGeneratingAI(true);
    if (force) { setQuizzes([]); setSummary(""); setActiveQuizIndex(0); setSelectedOption(null); }
    try {
      const videoId = course.videos[currentVideoIndex].videoId;
      const data = await fetchWithAuth("/ai/generate", {
        method: "POST",
        body: JSON.stringify({ courseId: course._id, videoId, force }),
      });
      setQuizzes(data.quizzes || []);
      setSummary(data.summary || "");
      setActiveTab("quiz");
    } catch (err: any) {
      setSummary("Error: " + err.message);
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleAwardXp(amount: number) {
    try {
      await fetchWithAuth("/auth/award-xp", {
        method: "PATCH",
        body: JSON.stringify({ amount }),
      });
      setXpGained((prev) => prev + amount);
      setShowXpToast(true);
      setTimeout(() => setShowXpToast(false), 2500);
    } catch {}
  }

  function handlePopupAnswer(idx: number) {
    if (popupAnswered) return;
    setPopupSelected(idx);
    setPopupAnswered(true);
    setShownQuizIds((prev) => new Set([...prev, popupQuiz._id]));
    if (idx === popupQuiz.correctAnswer) {
      handleAwardXp(popupQuiz.xpReward ?? 50);
    }
  }

  function dismissPopup() {
    setPopupQuiz(null);
    // Resume video
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "playVideo" }), "*"
    );
  }

  // Load Pyodide lazily when Python tab is selected
  async function ensurePyodide() {
    if (pyodideRef.current) return pyodideRef.current;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js";
    document.head.appendChild(script);
    await new Promise((r) => { script.onload = r; });
    const py = await (window as any).loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/" });
    pyodideRef.current = py;
    setPyodideReady(true);
    return py;
  }

  async function handleRunCode() {
    setRunningCode(true);
    setCodeOutput("");
    setCodeError("");

    try {
      if (codeLang === "javascript") {
        const result = await fetchWithAuth("/ai/run-code", {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        setCodeOutput(result.output || "");
        setCodeError(result.errors || "");

      } else if (codeLang === "python") {
        const py = await ensurePyodide();
        const logs: string[] = [];
        py.globals.set("_cq_logs", logs);
        // Redirect stdout
        await py.runPythonAsync(`
import sys, io
class _Capture(io.StringIO):
    def write(self, s):
        super().write(s)
_buf = _Capture()
sys.stdout = _buf
sys.stderr = _buf
`);
        try {
          await py.runPythonAsync(code);
          const out = await py.runPythonAsync(`_buf.getvalue()`);
          setCodeOutput(String(out));
        } catch (pyErr: any) {
          setCodeError(String(pyErr));
        } finally {
          await py.runPythonAsync(`sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__`);
        }

      } else if (codeLang === "html") {
        // HTML: update the preview state with a blob URL
        const blob = new Blob([code], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        setHtmlPreviewUrl(url);
        setCodeOutput("HTML preview updated below ↓");
      }
    } catch (err: any) {
      setCodeError(err.message);
    } finally {
      setRunningCode(false);
    }
  }

  function handleLangChange(lang: CodeLang) {
    setCodeLang(lang);
    setCode(DEFAULT_CODE[lang]);
    setCodeOutput("");
    setCodeError("");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!course) return <div className="text-center py-20 text-muted-foreground">Course not found.</div>;

  const currentVideo = course.videos[currentVideoIndex];
  const activeQuiz = quizzes[activeQuizIndex];
  // Only build src AFTER progress is loaded so iframe renders once with correct start time. Added mute=1 for reliable autoplay.
  const videoSrc = (currentVideo && progressLoaded && origin)
    ? `https://www.youtube-nocookie.com/embed/${currentVideo.videoId}?autoplay=1&mute=1&rel=0&enablejsapi=1&start=${startSeconds}&origin=${encodeURIComponent(origin)}`
    : null;

  return (
    <div className={`animate-in fade-in duration-500 flex flex-col ${theaterMode ? "fixed inset-0 z-50 bg-background p-4" : "h-[calc(100vh-100px)]"}`}>
      
      {/* XP Toast */}
      {showXpToast && (
        <div className="fixed top-6 right-6 z-[100] bg-yellow-500 text-black font-bold px-5 py-3 rounded-2xl shadow-xl animate-in slide-in-from-top-4 flex items-center gap-2">
          <Zap className="w-5 h-5" /> +{xpGained} XP Earned!
        </div>
      )}

      {/* Quiz Pop-up Overlay */}
      {popupQuiz && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Quiz Time!</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${DIFF_COLORS[popupQuiz.difficulty] ?? DIFF_COLORS.medium}`}>
                {popupQuiz.difficulty} · +{popupQuiz.xpReward} XP
              </span>
            </div>
            <p className="text-lg font-semibold mb-5 leading-snug">{popupQuiz.question}</p>
            <div className="space-y-2.5">
              {popupQuiz.options.map((opt: string, i: number) => {
                const isSelected = popupSelected === i;
                const isCorrect = i === popupQuiz.correctAnswer;
                let cls = "w-full text-left p-3.5 rounded-xl border-2 transition-all text-sm font-medium ";
                if (!popupAnswered) cls += "border-border hover:border-primary/50 hover:bg-secondary/30";
                else if (isCorrect) cls += "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400";
                else if (isSelected) cls += "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                else cls += "border-border opacity-40";
                return (
                  <button key={i} disabled={popupAnswered} onClick={() => handlePopupAnswer(i)} className={cls}>
                    {opt}
                  </button>
                );
              })}
            </div>
            {popupAnswered && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-xl text-sm text-muted-foreground border border-border">
                <span className="font-semibold text-foreground">Explanation: </span>{popupQuiz.explanation}
              </div>
            )}
            {popupAnswered && (
              <button onClick={dismissPopup} className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                <Play className="w-4 h-4" /> Resume Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Code Editor (Replit Style) */}
      {codeFullscreen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-300">
          {/* Header */}
          <div className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Code2 className="w-5 h-5" /> CodeQuest Workspace
              </div>
              <div className="w-px h-6 bg-border mx-2" />
              {(["javascript", "python", "html"] as CodeLang[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleLangChange(lang)}
                  className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-all ${
                    codeLang === lang
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {lang === "javascript" ? "JavaScript" : lang === "python" ? "Python" : "HTML/CSS"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {codeLang === "python" && !pyodideReady && (
                <span className="text-xs text-muted-foreground mr-2">Python runtime loading...</span>
              )}
              <button
                onClick={handleRunCode}
                disabled={runningCode}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
              >
                {runningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Code
              </button>
              <button
                onClick={() => { setCode(DEFAULT_CODE[codeLang]); setCodeOutput(""); setCodeError(""); }}
                className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-secondary"
                title="Reset Code"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-border mx-2" />
              <button
                onClick={() => setCodeFullscreen(false)}
                className="text-muted-foreground hover:text-foreground flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary text-sm font-bold"
              >
                <Minimize className="w-4 h-4" /> Exit
              </button>
            </div>
          </div>

          {/* Editor + Console split */}
          <div className="flex-1 flex min-h-0">
            {/* Editor Side */}
            <div className="flex-1 border-r border-border bg-[#1e1e1e]">
              {monacoLoaded && MonacoEditor ? (
                <MonacoEditor
                  height="100%"
                  language={codeLang === "html" ? "html" : codeLang}
                  theme="vs-dark"
                  value={code}
                  onChange={(val: string | undefined) => setCode(val ?? "")}
                  options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, padding: { top: 16 } }}
                />
              ) : (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-full bg-zinc-900 text-zinc-100 font-mono text-sm p-6 resize-none focus:outline-none"
                  spellCheck={false}
                />
              )}
            </div>

            {/* Console / Output Side */}
            <div className="w-[450px] xl:w-[500px] flex flex-col bg-card shrink-0">
              <div className="h-10 border-b border-border flex items-center px-4 bg-secondary/20">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {codeLang === "html" ? "Live Preview" : "Console Output"}
                </span>
              </div>
              <div className="flex-1 min-h-0 bg-black/40 overflow-auto p-4">
                {codeLang === "html" ? (
                  <iframe
                    src={htmlPreviewUrl || "about:blank"}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0 bg-white rounded-md"
                    title="HTML Preview"
                  />
                ) : (
                  <div className="font-mono text-sm space-y-2">
                    {codeOutput || codeError ? (
                      <>
                        {codeOutput && <pre className="text-green-400 whitespace-pre-wrap">{codeOutput}</pre>}
                        {codeError && <pre className="text-red-400 whitespace-pre-wrap">{codeError}</pre>}
                      </>
                    ) : (
                      <span className="text-muted-foreground/50 italic">Waiting for output...</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      {!theaterMode && (
        <div className="mb-4 flex items-center gap-4">
          <Link href="/dashboard/courses" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight truncate">{course.title}</h1>
          {xpGained > 0 && (
            <span className="ml-auto text-xs font-bold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" /> {xpGained} XP earned this session
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 relative">
        {/* Video Player */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="flex-1 bg-black w-full relative min-h-[300px]">
            {!progressLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : videoSrc ? (
              <iframe
                ref={playerRef}
                key={`${currentVideoIndex}-${startSeconds}`}
                src={videoSrc}
                title={currentVideo.title}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No video selected</div>
            )}
          </div>
          
          {/* Custom Video Progress Bar with Quiz Indicators */}
          {currentVideo && (
            <div className="h-2 w-full bg-secondary relative border-t border-border group/timeline">
              <div 
                className="h-full bg-primary/70 group-hover/timeline:bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, (currentTime / (parseDuration(currentVideo.duration) || 600)) * 100)}%` }}
              />
              
              {/* Quiz Markers on Timeline */}
              {quizzes.map((q, idx) => {
                const totalSec = parseDuration(currentVideo.duration) || 600;
                const pct = (q.timestamp / totalSec) * 100;
                const isPassed = currentTime >= q.timestamp;
                return (
                  <div 
                    key={q._id || idx}
                    onClick={() => {
                      try {
                        playerRef.current?.contentWindow?.postMessage(
                          JSON.stringify({ event: "command", func: "seekTo", args: [q.timestamp, true] }), "*"
                        );
                      } catch (err) {}
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-background shadow-md cursor-pointer transition-all hover:scale-125 flex items-center justify-center ${
                      isPassed ? "bg-green-500 scale-100" : "bg-yellow-500 hover:bg-yellow-400"
                    }`}
                    style={{ left: `${Math.min(98, Math.max(1, pct))}%` }}
                    title={`AI Quiz at ${Math.floor(q.timestamp / 60)}:${String(q.timestamp % 60).padStart(2, "0")}`}
                  >
                    <BrainCircuit className="w-2 h-2 text-black" />
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-4 border-t border-border flex items-center justify-between bg-card shrink-0">
            <div>
              <h2 className="text-lg font-bold line-clamp-1">{currentVideo?.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Duration: {currentVideo?.duration} · {Math.floor(currentTime / 60)}:{String(currentTime % 60).padStart(2, "0")} elapsed</p>
            </div>
            <button onClick={() => setTheaterMode(!theaterMode)} className="p-2 hover:bg-secondary rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shrink-0">
              {theaterMode ? <Minimize className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              {theaterMode ? "Exit" : "Theater"}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className={`w-full lg:w-[420px] bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden shrink-0 ${theaterMode ? "hidden lg:flex lg:w-[380px]" : ""}`}>
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["timeline", "quiz", "code"] as const).map((tab) => {
              const icons = { timeline: <ListVideo className="w-4 h-4" />, quiz: <BrainCircuit className="w-4 h-4" />, code: <Code2 className="w-4 h-4" /> };
              const labels = { timeline: "Timeline", quiz: "AI Quiz", code: "Live Code" };
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${activeTab === tab ? "border-b-2 border-primary text-primary bg-primary/5" : "text-muted-foreground hover:bg-secondary/30"}`}>
                  {icons[tab]} {labels[tab]}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <div className="p-4 space-y-3">
                <div className="px-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</p>
                    <p className="text-xs font-medium text-primary">{currentVideoIndex} / {course.videos.length} done</p>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(currentVideoIndex / course.videos.length) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-1.5 mt-2">
                  {course.videos.map((video: any, index: number) => {
                    const isActive = index === currentVideoIndex;
                    const isPast = index < currentVideoIndex;
                    return (
                      <button key={video._id || index} onClick={() => setCurrentVideoIndex(index)}
                        className={`w-full text-left p-3 rounded-xl flex gap-3 transition-all ${isActive ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-secondary/50 border border-transparent"}`}>
                        <div className="mt-0.5 shrink-0">
                          {isPast ? <CheckCircle className="w-5 h-5 text-green-500" /> : isActive ? <PlayCircle className="w-5 h-5 text-primary" /> : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center text-[10px] font-bold text-muted-foreground">{index + 1}</div>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className={`text-sm font-medium line-clamp-2 leading-snug ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{video.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{video.duration}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quiz Tab */}
            {activeTab === "quiz" && (
              <div className="p-4 h-full flex flex-col">
                {quizzes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <BrainCircuit className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground mb-6 text-sm">{summary || "Generate an AI quiz for this video to get started."}</p>
                    <button onClick={() => handleGenerateAI(false)} disabled={generatingAI}
                      className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                      {generatingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                      {generatingAI ? "Analyzing Transcript..." : "Generate AI Quiz"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-muted-foreground italic border-l-2 border-primary pl-3 bg-primary/5 p-2 rounded-r-lg flex-1 mr-2">{summary}</p>
                      <button
                        onClick={() => handleGenerateAI(true)}
                        disabled={generatingAI}
                        title="Regenerate new questions"
                        className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary border border-border hover:border-primary/40 px-2 py-1.5 rounded-lg transition-all disabled:opacity-50"
                      >
                        {generatingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        {generatingAI ? "" : "New"}
                      </button>
                    </div>
                    {activeQuiz && (
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">Q{activeQuizIndex + 1} / {quizzes.length}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DIFF_COLORS[activeQuiz.difficulty] ?? DIFF_COLORS.medium}`}>{activeQuiz.difficulty}</span>
                            <span className="text-xs font-bold bg-yellow-500/10 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-500/20">+{activeQuiz.xpReward} XP</span>
                          </div>
                        </div>
                        <p className="text-foreground font-medium text-base leading-snug mb-4">{activeQuiz.question}</p>
                        <div className="space-y-2">
                          {activeQuiz.options.map((option: string, i: number) => {
                            const isSelected = selectedOption === i;
                            const isCorrect = i === activeQuiz.correctAnswer;
                            const showResult = selectedOption !== null;
                            let cls = "w-full text-left p-3.5 rounded-xl border-2 transition-all font-medium text-sm ";
                            if (!showResult) cls += "border-border hover:border-primary/50 hover:bg-secondary/30";
                            else if (isCorrect) cls += "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                            else if (isSelected && !isCorrect) cls += "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
                            else cls += "border-border opacity-40";
                            return (
                              <button key={i} disabled={showResult} onClick={() => {
                                setSelectedOption(i);
                                if (i === activeQuiz.correctAnswer) handleAwardXp(activeQuiz.xpReward ?? 50);
                              }} className={cls}>{option}</button>
                            );
                          })}
                        </div>
                        {selectedOption !== null && activeQuiz.explanation && (
                          <div className="mt-3 p-3 bg-secondary/50 rounded-xl text-xs text-muted-foreground border border-border">
                            <span className="font-semibold text-foreground">Explanation: </span>{activeQuiz.explanation}
                          </div>
                        )}
                        {selectedOption !== null && (
                          <div className="mt-4 pt-3 border-t border-border">
                            <div className="flex gap-2">
                              {activeQuizIndex > 0 && (
                                <button onClick={() => { setSelectedOption(null); setActiveQuizIndex((p) => p - 1); }}
                                  className="flex-1 bg-secondary text-foreground px-4 py-2.5 rounded-xl font-bold hover:bg-secondary/80 transition-all text-sm">
                                  ← Prev
                                </button>
                              )}
                              <button onClick={() => { setSelectedOption(null); setActiveQuizIndex((p) => Math.min(p + 1, quizzes.length - 1)); }}
                                disabled={activeQuizIndex === quizzes.length - 1}
                                className="flex-1 bg-foreground text-background px-4 py-2.5 rounded-xl font-bold hover:bg-foreground/90 disabled:opacity-50 transition-all text-sm">
                                {activeQuizIndex === quizzes.length - 1 ? "✓ Done!" : "Next →"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Live Code Tab */}
            {activeTab === "code" && (
              <div className="flex flex-col h-full">
                {/* Language selector + reset */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border shrink-0 flex-wrap">
                  <Terminal className="w-4 h-4 text-primary shrink-0" />
                  {(["javascript", "python", "html"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleLangChange(lang)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all ${
                        codeLang === lang
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {lang === "javascript" ? "JS" : lang === "python" ? "Python" : "HTML"}
                    </button>
                  ))}
                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => setCodeFullscreen(true)}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-bold bg-primary/10 px-2 py-1 rounded-md"
                    >
                      <Expand className="w-3 h-3" /> Fullscreen
                    </button>
                    <button
                      onClick={() => { setCode(DEFAULT_CODE[codeLang]); setCodeOutput(""); setCodeError(""); }}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-0 border-b border-border" style={{ minHeight: codeLang === "html" ? "140px" : "200px" }}>
                  {monacoLoaded && MonacoEditor ? (
                    <MonacoEditor
                      height="100%"
                      language={codeLang === "html" ? "html" : codeLang}
                      theme="vs-dark"
                      value={code}
                      onChange={(val: string | undefined) => setCode(val ?? "")}
                      options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: "on", wordWrap: "on", automaticLayout: true }}
                    />
                  ) : (
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full bg-zinc-900 text-zinc-100 font-mono text-sm p-4 resize-none focus:outline-none"
                      spellCheck={false}
                    />
                  )}
                </div>

                {/* HTML live preview */}
                {codeLang === "html" && (
                  <div className="shrink-0 border-b border-border bg-white" style={{ height: "140px" }}>
                    <iframe
                      src={htmlPreviewUrl || "about:blank"}
                      sandbox="allow-scripts"
                      className="w-full h-full border-0"
                      title="HTML Preview"
                    />
                  </div>
                )}

                {/* Run button + output */}
                <div className="shrink-0 p-3 space-y-2">
                  {codeLang === "python" && !pyodideReady && (
                    <p className="text-[10px] text-muted-foreground text-center">First run loads Python runtime (~10 MB)</p>
                  )}
                  <button
                    onClick={handleRunCode}
                    disabled={runningCode}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
                  >
                    {runningCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {runningCode
                      ? (codeLang === "python" && !pyodideReady ? "Loading Python..." : "Running...")
                      : (codeLang === "html" ? "▶ Preview HTML" : "▶ Run Code")}
                  </button>

                  {(codeOutput || codeError) && (
                    <div className="bg-zinc-900 rounded-xl p-3 font-mono text-xs max-h-36 overflow-y-auto">
                      {codeOutput && <pre className="text-green-400 whitespace-pre-wrap">{codeOutput}</pre>}
                      {codeError && <pre className="text-red-400 whitespace-pre-wrap">Error: {codeError}</pre>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
