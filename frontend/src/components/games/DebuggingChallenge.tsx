import { useState } from "react";
import { Bug, ChevronRight, Lightbulb } from "lucide-react";

interface Question {
  content: string;
  instruction?: string;
  concept?: string;
  hint?: string;
}

export function DebuggingChallenge({ question, onSubmit }: { question: Question; onSubmit: (answer: string) => void }) {
  const [code, setCode] = useState(question.content || "");
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="glass-card border border-rose-500/30 p-6 rounded-2xl space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Bug className="w-24 h-24 text-rose-500" />
      </div>

      <div className="flex items-center gap-2 relative z-10">
        <Bug className="w-5 h-5 text-rose-500" />
        <h3 className="font-bold text-lg text-rose-500">Debugging Challenge</h3>
        {question.concept && (
          <span className="ml-auto text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded-lg">
            {question.concept}
          </span>
        )}
      </div>

      {question.instruction && (
        <p className="text-sm text-muted-foreground relative z-10 bg-background/40 p-3 rounded-xl border border-white/5">
          📋 {question.instruction}
        </p>
      )}

      <p className="text-sm text-muted-foreground relative z-10">
        Find and fix the bug in the code below.
      </p>

      <div className="relative z-10 mt-2">
        <textarea
          className="w-full h-48 bg-black/40 border border-rose-500/20 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-rose-500/50 transition-all text-rose-200 resize-none"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitted}
        />
      </div>

      {!submitted && (
        <div className="flex gap-2 relative z-10">
          <button
            onClick={() => setShowHint(h => !h)}
            className="px-4 py-2 rounded-xl border border-white/10 text-muted-foreground text-sm hover:text-white hover:border-white/30 transition-all flex items-center gap-1"
          >
            <Lightbulb className="w-4 h-4" /> Hint
          </button>
          <button
            onClick={() => { setSubmitted(true); onSubmit(code); }}
            className="flex-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white px-4 py-2 rounded-xl font-semibold transition-all flex justify-center items-center gap-2"
          >
            Run & Verify <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showHint && (question as any).hint && (
        <div className="relative z-10 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          💡 {(question as any).hint}
        </div>
      )}
    </div>
  );
}
