"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  Play, Save, Plus, Terminal, RefreshCw, FolderGit2, Trash2,
  CheckCircle, Loader2, Sparkles, FileCode, Sliders, LayoutGrid
} from "lucide-react";

// Default codes for different languages
const DEFAULT_TEMPLATES: Record<string, string> = {
  javascript: `// CodeQuest JavaScript Sandbox ⚡\n\nconsole.log("Hello, CodeQuest!");\n\nfunction greet(name) {\n    return "Welcome, " + name + "! Ready to level up?";\n}\n\nconsole.log(greet("Developer"));\n`,
  python: `# CodeQuest Python Sandbox 🐍\n\ndef greet(name):\n    return f"Welcome, {name}! Ready to level up?"\n\nprint("Hello, CodeQuest!")\nprint(greet("Developer"))\n`,
  typescript: `// CodeQuest TypeScript Sandbox 🟦\n\nconst greet = (name: string): string => {\n    return \`Welcome, \${name}! Ready to level up?\`;\n};\n\nconsole.log(greet("TypeScript Master"));\n`,
  cpp: `// CodeQuest C++ Sandbox 🛠️\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeQuest!" << endl;\n    return 0;\n}\n`
};

const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

export default function CodeEditorPage() {
  const { refreshUser } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  
  // Editor States
  const [code, setCode] = useState(DEFAULT_TEMPLATES.javascript);
  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("Untitled Quest");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState("on");
  
  // Status states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["// Terminal Console initialized. Press 'Run Code' to execute."]);
  
  // Modals
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState("");
  const [newProjLang, setNewProjLang] = useState("javascript");
  const [creating, setCreating] = useState(false);

  // GitHub Integration States
  const { user: contextUser } = useAuth();
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [githubPAT, setGithubPAT] = useState("");
  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [pushingToGitHub, setPushingToGitHub] = useState(false);
  const [githubError, setGithubError] = useState("");

  const handleConnectGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubPAT.trim()) return;
    setConnectingGitHub(true);
    setGithubError("");

    try {
      await fetchWithAuth("/auth/github-token", {
        method: "PATCH",
        body: JSON.stringify({ token: githubPAT.trim() })
      });
      await refreshUser();
      setShowGitHubModal(false);
      setGithubPAT("");
      // Immediately push code if project exists
      if (currentProject) {
        pushProject(currentProject._id);
      } else {
        alert("🎉 GitHub authorized successfully! Select or create a snippet to sync.");
      }
    } catch (err: any) {
      setGithubError(err.message || "Failed to authorize Personal Access Token.");
    } finally {
      setConnectingGitHub(false);
    }
  };

  const pushProject = async (id: string) => {
    setPushingToGitHub(true);
    setTerminalOutput((prev: string[]) => [...prev, `[System] Initiating commit workflow to GitHub...`]);

    try {
      const data = await fetchWithAuth(`/projects/${id}/push-github`, {
        method: "POST"
      });

      // Update in state
      setProjects((prev: any[]) => prev.map(p => p._id === id ? { ...p, githubLink: data.githubLink } : p));
      if (currentProject?._id === id) {
        setCurrentProject((prev: any) => ({ ...prev, githubLink: data.githubLink }));
      }
      
      await refreshUser();
      
      setTerminalOutput((prev: string[]) => [
        ...prev,
        `🎉 Code committed successfully to GitHub!`,
        `🐙 Direct Link: ${data.githubLink}`,
        `⚔️ Earned +50 XP bonus for active repository versioning!`
      ]);
    } catch (err: any) {
      setTerminalOutput((prev: string[]) => [...prev, `❌ GitHub Sync Failed: ${err.message || err}`]);
    } finally {
      setPushingToGitHub(false);
    }
  };

  const handlePushToGitHub = () => {
    if (!currentProject) {
      alert("Please save or open a snippet first!");
      return;
    }

    if (!contextUser?.githubToken) {
      setShowGitHubModal(true);
      return;
    }

    pushProject(currentProject._id);
  };

  // Load user projects
  const loadProjects = async () => {
    try {
      const data = await fetchWithAuth("/projects");
      setProjects(data);
      if (data.length > 0 && !currentProject) {
        // Load the most recent project on start
        selectProject(data[0]);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProjects().finally(() => setLoading(false));
  }, []);

  // Update editor values when project is loaded
  const selectProject = (proj: any) => {
    setCurrentProject(proj);
    setCode(proj.code);
    setLanguage(proj.language);
    setTitle(proj.title);
    setTerminalOutput([`// Project [${proj.title}] loaded successfully.`]);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    setCreating(true);

    try {
      const defaultCode = DEFAULT_TEMPLATES[newProjLang] || "";
      const proj = await fetchWithAuth("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: newProjTitle.trim(),
          language: newProjLang,
          code: defaultCode
        })
      });

      setShowNewModal(false);
      setNewProjTitle("");
      await loadProjects();
      selectProject(proj);
    } catch (err) {
      console.error("Error creating project:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveProject = async () => {
    if (!currentProject) return;
    setSaving(true);
    try {
      const updated = await fetchWithAuth(`/projects/${currentProject._id}`, {
        method: "PUT",
        body: JSON.stringify({
          code,
          title,
          language
        })
      });
      // Update projects list title or timestamp
      setProjects(prev => prev.map(p => p._id === currentProject._id ? updated : p));
      setCurrentProject(updated);
    } catch (err) {
      console.error("Error saving project:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetchWithAuth(`/projects/${id}`, {
        method: "DELETE"
      });
      if (currentProject?._id === id) {
        setCurrentProject(null);
        setCode(DEFAULT_TEMPLATES.javascript);
        setLanguage("javascript");
        setTitle("Untitled Quest");
      }
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  // Run Code logic
  const handleRunCode = async () => {
    setRunning(true);
    setTerminalOutput([`[System] Connecting to secure sandbox compiler...`]);

    try {
      const data = await fetchWithAuth("/projects/execute", {
        method: "POST",
        body: JSON.stringify({
          language,
          code
        })
      });

      const outputs: string[] = [];
      if (data.stdout) {
        outputs.push(...data.stdout.split("\n").filter((line: string) => line !== ""));
      }
      if (data.stderr) {
        outputs.push(...data.stderr.split("\n").map((line: string) => `❌ ${line}`));
      }
      if (outputs.length === 0) {
        outputs.push("// Process completed with no output returns.");
      }
      
      outputs.push(`[Process] Completed with exit code ${data.exitCode} (elapsed ${data.runTime || 40}ms)`);

      setTerminalOutput(outputs);

      // Award gamified XP points for practicing code!
      await fetchWithAuth("/auth/award-xp", {
        method: "PATCH",
        body: JSON.stringify({ amount: 10 })
      });
      await refreshUser();
      
      setTerminalOutput(prev => [
        ...prev, 
        `🎉 Quest Cleared! Earned +10 XP for active compiler runs.`
      ]);

    } catch (err: any) {
      setTerminalOutput([`❌ Compiler Connection Crash: ${err.message || err}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
      
      {/* ── LEFT PROJECTS SIDEBAR ── */}
      <aside className="w-full md:w-64 bg-card border border-border rounded-2xl p-4 flex flex-col shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-primary" />
            Snippet Workspace
          </h2>
          <button 
            onClick={() => setShowNewModal(true)}
            className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
            title="Create New Project"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[150px] md:min-h-0">
          {projects.length > 0 ? (
            projects.map((proj) => (
              <div 
                key={proj._id}
                onClick={() => selectProject(proj)}
                className={`group flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  currentProject?._id === proj._id
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-secondary/20 border-border hover:bg-secondary/40 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileCode className="w-4 h-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{proj.title}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj._id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/15 text-muted-foreground hover:text-destructive rounded transition-all shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-xs text-muted-foreground text-center py-8">
              No saved snippet projects. Click '+' to start!
            </div>
          )}
        </div>
      </aside>

      {/* ── MIDDLE & RIGHT MAIN WORKSPACE ── */}
      <main className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden min-h-[450px]">
        {/* Editor controls navbar */}
        <div className="h-14 bg-secondary/30 border-b border-border flex items-center justify-between px-4 shrink-0 flex-wrap gap-2 py-2 md:py-0">
          <div className="flex items-center gap-3">
            <input 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-border focus:border-primary/50 text-sm font-bold focus:outline-none px-1 text-foreground"
              placeholder="Project Name..."
            />
            {currentProject && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Cloud Saved
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Editor Customizations */}
            <div className="flex items-center gap-2 text-xs bg-secondary/50 border border-border rounded-xl px-2.5 py-1 text-muted-foreground">
              <Sliders className="w-3.5 h-3.5" />
              <select value={fontSize} onChange={e => setFontSize(parseInt(e.target.value, 10))} className="bg-transparent border-none outline-none font-bold text-foreground capitalize cursor-pointer">
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
              </select>
              <select value={wordWrap} onChange={e => setWordWrap(e.target.value)} className="bg-transparent border-none outline-none font-bold text-foreground capitalize cursor-pointer ml-1">
                <option value="on">wrap</option>
                <option value="off">no-wrap</option>
              </select>
            </div>

            {/* Language dropdown */}
            <select
              value={language}
              onChange={(e) => {
                const lang = e.target.value;
                setLanguage(lang);
                // If there's no project code loaded yet, populate default template
                if (!currentProject) {
                  setCode(DEFAULT_TEMPLATES[lang] || "");
                }
              }}
              className="bg-secondary border border-border text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/50 font-bold text-foreground cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="typescript">TypeScript</option>
              <option value="cpp">C++</option>
            </select>

            {/* Save code */}
            {currentProject && (
              <button
                onClick={handleSaveProject}
                disabled={saving}
                className="bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Snippet
              </button>
            )}

            {/* Push to GitHub */}
            {currentProject && (
              currentProject.githubLink ? (
                <a
                  href={currentProject.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-secondary/80 hover:bg-secondary text-primary border border-primary/30 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="View committed code on GitHub"
                >
                  <GithubIcon className="w-3.5 h-3.5" />
                  View on GitHub
                </a>
              ) : (
                <button
                  onClick={handlePushToGitHub}
                  disabled={pushingToGitHub}
                  className="bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-70 cursor-pointer"
                  title="Commit this project snippet to your GitHub repo"
                >
                  {pushingToGitHub ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GithubIcon className="w-3.5 h-3.5" />}
                  Export to GitHub
                </button>
              )
            )}

            {/* Run Code */}
            <button
              onClick={handleRunCode}
              disabled={running}
              className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm shadow-primary/20 disabled:opacity-70 cursor-pointer"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Run Code
            </button>
          </div>
        </div>

        {/* Dynamic Split Editor Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 min-h-0">
          
          {/* Monaco Editor Component */}
          <div className="lg:col-span-2 border-r border-border min-h-[250px] lg:min-h-0">
            <Editor
              height="100%"
              language={language}
              theme={theme}
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                fontSize: fontSize,
                fontFamily: "Fira Code, Menlo, Monaco, Courier New, monospace",
                minimap: { enabled: false },
                wordWrap: wordWrap as any,
                lineNumbers: "on",
                automaticLayout: true,
                padding: { top: 15 }
              }}
            />
          </div>

          {/* Interactive Output Terminal */}
          <div className="bg-neutral-950 flex flex-col justify-between p-4 min-h-[150px] lg:min-h-0">
            <div className="space-y-3 font-mono text-xs overflow-y-auto max-h-[280px] lg:max-h-none flex-1 pr-1">
              <div className="text-muted-foreground flex items-center gap-2 border-b border-white/5 pb-2 shrink-0">
                <Terminal className="w-4 h-4 text-primary" />
                <span>Sandbox Output Terminal</span>
              </div>
              <div className="space-y-1.5 font-mono">
                {terminalOutput.map((out, index) => {
                  let colorClass = "text-neutral-300";
                  if (out.startsWith("❌")) colorClass = "text-destructive font-bold";
                  else if (out.startsWith("🎉")) colorClass = "text-green-400 font-bold animate-pulse";
                  else if (out.startsWith("[System]")) colorClass = "text-indigo-400";
                  else if (out.startsWith("[Compiler]")) colorClass = "text-amber-500/80";
                  else if (out.startsWith("//")) colorClass = "text-neutral-500 italic";

                  return (
                    <div key={index} className={`leading-relaxed whitespace-pre-wrap ${colorClass}`}>
                      {out}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Badge award tip */}
            <div className="text-[10px] bg-secondary/10 border border-border rounded-lg p-2.5 text-muted-foreground shrink-0 mt-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 animate-bounce shrink-0" />
              <span>Tip: Practice compiling dynamic algorithms here to unlock the legendary level badges!</span>
            </div>
          </div>

        </div>
      </main>

      {/* ── CREATE NEW SNAPSHOT MODAL ── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProject} className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Initialize Snippet Quest
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Configure your Monaco-powered developer quest snippet.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Project Name</label>
                <input 
                  required
                  placeholder="e.g. DFS Tree Traversal"
                  value={newProjTitle}
                  onChange={e => setNewProjTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Environment Environment</label>
                <select
                  value={newProjLang}
                  onChange={e => setNewProjLang(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground appearance-none cursor-pointer"
                >
                  <option value="javascript">JavaScript 🧑‍💻</option>
                  <option value="python">Python 🐍</option>
                  <option value="typescript">TypeScript 🟦</option>
                  <option value="cpp">C++ 🛠️</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => setShowNewModal(false)}
                className="bg-secondary border border-border hover:bg-secondary/80 font-bold px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Snippet
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── AUTHORIZE GITHUB MODAL ── */}
      {showGitHubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConnectGitHub} className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-neutral-900 border border-white/5 rounded-2xl text-primary">
                <GithubIcon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold flex items-center gap-1.5">
                  Link GitHub Account
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Securely commit Monaco snippets to your cloud repository.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase flex justify-between items-center">
                  <span>GitHub Personal Access Token (PAT)</span>
                  <a 
                    href="https://github.com/settings/tokens/new?scopes=repo&description=CodeQuest-Snippets-Token" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-bold text-[10px] normal-case"
                  >
                    Generate Token ↗
                  </a>
                </label>
                <input 
                  type="password"
                  required
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={githubPAT}
                  onChange={e => setGithubPAT(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground font-mono text-sm"
                />
                <p className="text-[10px] text-muted-foreground leading-normal mt-1.5">
                  🛡️ Securely encrypted. Generate a classic token with the <strong>'repo'</strong> scope to allow dynamic project commit pushing.
                </p>
              </div>

              {githubError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3 font-semibold">
                  ❌ {githubError}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button 
                type="button" 
                onClick={() => { setShowGitHubModal(false); setGithubError(""); }}
                className="bg-secondary border border-border hover:bg-secondary/80 font-bold px-4 py-2 rounded-xl text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={connectingGitHub}
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2 rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {connectingGitHub && <Loader2 className="w-4 h-4 animate-spin" />}
                Connect Account 🐙
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
