import { useState } from "react";
import { Terminal, ChevronRight } from "lucide-react";

interface Question {
  content: string;
}

export function OutputPrediction({ question, options, onSubmit }: { question: Question; options: string[]; onSubmit: (answer: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="neon-border-card p-6 rounded-2xl space-y-4">
      <div className="flex items-center gap-2">
        <Terminal className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-lg text-emerald-500">Output Prediction</h3>
      </div>

      <p className="text-sm text-muted-foreground">What does this code output? Choose the correct answer.</p>

      <div className="bg-background/80 p-4 rounded-xl border border-white/5 font-mono text-sm text-muted-foreground">
        <pre className="whitespace-pre-wrap">{question.content}</pre>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {options.map((opt, idx) => (
          <button
            key={idx}
            disabled={submitted}
            onClick={() => setSelected(opt)}
            className={`p-3 rounded-xl border font-mono text-sm text-left transition-all ${
              selected === opt
                ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                : "border-white/10 bg-black/20 hover:bg-white/5 text-muted-foreground"
            }`}
          >
            <span className="text-white/30 mr-2">{String.fromCharCode(65 + idx)}.</span>
            {opt}
          </button>
        ))}
      </div>

      {selected && !submitted && (
        <button
          onClick={() => { setSubmitted(true); onSubmit(selected); }}
          className="mt-4 w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white px-4 py-3 rounded-xl font-semibold transition-all flex justify-center items-center gap-2"
        >
          Confirm Answer <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
