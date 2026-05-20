import { useState } from "react";
import { Code, ChevronRight } from "lucide-react";

interface Question {
  content: string;
  instruction?: string;
  options?: string[];
  correct?: number;
}

export function CodePuzzle({ question, onSubmit }: { question: Question; onSubmit: (answer: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const hasOptions = question.options && question.options.length > 0;

  const handleSubmit = () => {
    if (!selected) return;
    setSubmitted(true);
    onSubmit(selected);
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <Code className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-lg">Code Puzzle</h3>
      </div>

      {question.instruction && (
        <p className="text-sm text-muted-foreground bg-background/40 p-3 rounded-xl border border-white/5">
          📋 {question.instruction}
        </p>
      )}

      {/* Code with blank highlighted */}
      <div className="bg-background/80 p-4 rounded-xl border border-white/5 font-mono text-sm">
        <pre className="whitespace-pre-wrap text-muted-foreground">
          {question.content.split("_____").map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={`px-3 py-0.5 rounded border ${selected ? "border-primary/60 bg-primary/10 text-primary" : "border-white/20 bg-white/5 text-white/50"}`}>
                  {selected || "______"}
                </span>
              )}
            </span>
          ))}
        </pre>
      </div>

      {/* Options */}
      {hasOptions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.options!.map((opt, idx) => (
            <button
              key={idx}
              disabled={submitted}
              onClick={() => setSelected(opt)}
              className={`p-3 rounded-xl border font-mono text-sm text-left transition-all ${
                selected === opt
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-black/20 hover:bg-white/5 text-muted-foreground"
              }`}
            >
              <span className="text-white/30 mr-2">{String.fromCharCode(65 + idx)}.</span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          className="w-full h-24 bg-background/50 border border-white/10 rounded-xl p-4 font-mono text-sm focus:outline-none focus:border-primary transition-all resize-none text-foreground"
          placeholder="Type the missing piece..."
          value={selected || ""}
          onChange={e => setSelected(e.target.value)}
          disabled={submitted}
        />
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white px-4 py-3 rounded-xl font-semibold transition-all flex justify-center items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit Answer <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
