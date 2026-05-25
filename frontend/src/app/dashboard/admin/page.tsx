"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  Users, FolderGit2, BookOpen, Search, ShieldCheck, ShieldAlert,
  RefreshCw, Terminal, Eye, Code2, Award, Calendar, Layers, Star,
  LineChart, BarChart4, PieChart, Activity, Zap
} from "lucide-react";
import Link from "next/link";

type TabType = "users" | "projects" | "logs" | "analytics";

export default function AdminPanelPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [loading, setLoading] = useState(true);

  // Datasets
  const [usersList, setUsersList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);

  // Search/Filter terms
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Fetch admin dashboards
  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [users, projects, logs] = await Promise.all([
        fetchWithAuth("/auth/users"),
        fetchWithAuth("/projects/admin/all"),
        fetchWithAuth("/activity/admin/logs")
      ]);
      setUsersList(users);
      setProjectsList(projects);
      setLogsList(logs);
    } catch (err) {
      console.error("Failed to load administration datasets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  // If loading user or verification
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-neutral-400 font-semibold">Authorizing developer console credentials...</p>
      </div>
    );
  }

  // Strict route security guard check
  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
          <ShieldAlert className="w-16 h-16" />
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-white">Developer Console Restricted</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            You do not possess the required administrator clearance tokens to access this route. Normal user operations are strictly monitored.
          </p>
        </div>
        <Link 
          href="/dashboard" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-xs"
        >
          Return to Overview
        </Link>
      </div>
    );
  }

  // Filter lists based on query (applicable to active tabs)
  const filteredUsers = usersList.filter(u => 
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projectsList.filter(p => 
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logsList.filter(l => 
    l.activityType?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.language?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.userId?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── STATS COMPUTATIONS FOR ANALYTICS TAB ──
  
  // 1. Calculate Active Users (users logged in or active in the last 7 days)
  const activeUsersCount = usersList.filter(u => {
    if (!u.lastLogin) return false;
    const daysSinceLogin = (new Date().getTime() - new Date(u.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLogin <= 7;
  }).length;

  // 2. Sum Total Lines of Code
  const totalLinesOfCode = logsList.reduce((acc, log) => acc + (log.linesWritten || 0), 0);

  // 3. Project Language Breakdown data
  const languageCounts: { [key: string]: number } = {};
  projectsList.forEach(p => {
    const lang = (p.language || "unknown").toLowerCase();
    languageCounts[lang] = (languageCounts[lang] || 0) + 1;
  });

  const languageColors: { [key: string]: string } = {
    javascript: "#f59e0b",
    typescript: "#3b82f6",
    python: "#10b981",
    cpp: "#ec4899",
    html: "#f97316",
    css: "#06b6d4",
    fallback: "#a3a3a3"
  };

  // 4. Activity Logs Type breakdown
  const codingLogsCount = logsList.filter(l => l.activityType === "coding").length;
  const quizLogsCount = logsList.filter(l => l.activityType === "quiz").length;
  const commitLogsCount = logsList.filter(l => l.activityType === "commit").length;
  const totalLogs = logsList.length || 1;

  // Percentage calculations
  const codingPct = Math.round((codingLogsCount / totalLogs) * 100);
  const quizPct = Math.round((quizLogsCount / totalLogs) * 100);
  const commitPct = Math.round((commitLogsCount / totalLogs) * 100);

  // 5. Weekly actions trend (calculating last 7 days of platform activities)
  const getWeeklyTrend = () => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const labels = ["", "", "", "", "", "", ""];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - (6 - i));
      labels[i] = d.toLocaleDateString(undefined, { weekday: 'short' });
      
      // Filter log timestamps
      const dateStr = d.toDateString();
      counts[i] = logsList.filter(l => new Date(l.timestamp).toDateString() === dateStr).length;
    }
    return { counts, labels };
  };

  const trendData = getWeeklyTrend();
  const maxTrendVal = Math.max(...trendData.counts, 5);

  // Generate SVG coordinates for a smooth curve
  const svgWidth = 500;
  const svgHeight = 150;
  const points = trendData.counts.map((val, idx) => {
    const x = (idx / 6) * (svgWidth - 40) + 20;
    const y = svgHeight - ((val / maxTrendVal) * (svgHeight - 40) + 20);
    return { x, y };
  });

  const dPath = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // Curve coordinates
    const prev = points[idx - 1];
    const cpX1 = prev.x + (p.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (p.x - prev.x) / 2;
    const cpY2 = p.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
  }, "");

  // Path to close and fill the area underneath the curve
  const fillPath = points.length > 0 
    ? `${dPath} L ${points[points.length - 1].x} ${svgHeight - 10} L ${points[0].x} ${svgHeight - 10} Z`
    : "";

  return (
    <div className="space-y-8 max-w-7xl mx-auto select-none">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
            Developer Administration Console
          </h1>
          <p className="text-neutral-400 mt-2 text-xs leading-relaxed">
            Monitor registered student directories, live compiler logs, versioned Git commits, and code snippet repositories.
          </p>
        </div>

        <button 
          onClick={loadAdminData}
          className="bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 hover:text-white px-4 py-2 rounded-xl transition-all self-start flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95 shadow-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {/* OVERALL STATISTICS METRIC STRIPS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-card border border-border p-5 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Registered Developers</p>
            <h3 className="text-2xl font-black mt-0.5">{usersList.length}</h3>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Monaco Snippets</p>
            <h3 className="text-2xl font-black mt-0.5">{projectsList.length}</h3>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Platform Diagnostics Logs</p>
            <h3 className="text-2xl font-black mt-0.5">{logsList.length}</h3>
          </div>
        </div>

      </div>

      {/* DASHBOARD TAB HEADERS & DIRECT SEARCH BARS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        
        {/* Switch controls */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1.5 border border-white/5 rounded-2xl self-start">
          <button
            onClick={() => { setActiveTab("users"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "users" 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Users Directory
          </button>
          <button
            onClick={() => { setActiveTab("projects"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "projects" 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Code Snippets
          </button>
          <button
            onClick={() => { setActiveTab("logs"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === "logs" 
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Platform Compiler Logs
          </button>
          <button
            onClick={() => { setActiveTab("analytics"); setSearchQuery(""); }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "analytics" 
                ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/20" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Platform Analytics
          </button>
        </div>

        {/* Dynamic Search queries (Hide on analytics tab) */}
        {activeTab !== "analytics" && (
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder={
                activeTab === "users" ? "Search usernames or emails..." :
                activeTab === "projects" ? "Search snippet titles or languages..." :
                "Search operations type or languages..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-600/50"
            />
          </div>
        )}

      </div>

      {/* CORE DATA DISPLAY COMPONENT */}
      
      {/* ── 4. DETAILED INTERACTIVE ANALYTICS TAB ── */}
      {activeTab === "analytics" ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* ANALYTICS HIGHLIGHT METRIC ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-card border border-border p-5 rounded-3xl shadow-xl flex flex-col gap-1.5 relative overflow-hidden">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Students</span>
              <h2 className="text-3xl font-black text-white">{usersList.length}</h2>
              <span className="text-[9px] text-indigo-400 font-semibold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded self-start mt-1">Platform Capacity</span>
              <div className="absolute right-3 bottom-3 text-neutral-800 pointer-events-none">
                <Users className="w-12 h-12" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-xl flex flex-col gap-1.5 relative overflow-hidden">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active (7 Days)</span>
              <h2 className="text-3xl font-black text-emerald-400">{activeUsersCount}</h2>
              <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded self-start mt-1">
                {usersList.length > 0 ? Math.round((activeUsersCount / usersList.length) * 100) : 0}% Active Rate
              </span>
              <div className="absolute right-3 bottom-3 text-neutral-800 pointer-events-none">
                <Activity className="w-12 h-12" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-xl flex flex-col gap-1.5 relative overflow-hidden">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Saved Projects</span>
              <h2 className="text-3xl font-black text-white">{projectsList.length}</h2>
              <span className="text-[9px] text-amber-500 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded self-start mt-1">Monaco Workspaces</span>
              <div className="absolute right-3 bottom-3 text-neutral-800 pointer-events-none">
                <FolderGit2 className="w-12 h-12" />
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-3xl shadow-xl flex flex-col gap-1.5 relative overflow-hidden">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Total Lines Written</span>
              <h2 className="text-3xl font-black text-purple-400">{totalLinesOfCode}</h2>
              <span className="text-[9px] text-purple-400 font-semibold bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded self-start mt-1">Cumulative Codebase</span>
              <div className="absolute right-3 bottom-3 text-neutral-800 pointer-events-none">
                <Code2 className="w-12 h-12" />
              </div>
            </div>

          </div>

          {/* TWO COLUMN GRID CHARTS LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Platform operations Wave Line Graph */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <LineChart className="w-4 h-4 text-indigo-500" />
                  Weekly Platform Activity Volume
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Chronological summary of compiler runs, code saves, and git commits.</p>
              </div>

              {/* Responsive custom SVG line chart */}
              <div className="w-full bg-neutral-950/60 border border-white/5 p-4 rounded-2xl flex items-center justify-center relative min-h-[200px]">
                <svg className="w-full h-full max-h-[160px]" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                  <defs>
                    <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2={svgWidth - 20} y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="20" y1="56.6" x2={svgWidth - 20} y2="56.6" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="20" y1="93.3" x2={svgWidth - 20} y2="93.3" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="20" y1="130" x2={svgWidth - 20} y2="130" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                  {/* Shaded Area */}
                  {fillPath && <path d={fillPath} fill="url(#glowGrad)" />}
                  
                  {/* Main Line path */}
                  {dPath && (
                    <path 
                      d={dPath} 
                      fill="none" 
                      stroke="#6366f1" 
                      strokeWidth="2.5" 
                      strokeLinecap="round"
                    />
                  )}

                  {/* Active Dots & Text labels */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="3.5" 
                        fill="#6366f1" 
                        stroke="#0a0a0a" 
                        strokeWidth="1.5"
                      />
                      {/* Count label above node */}
                      <text 
                        x={p.x} 
                        y={p.y - 8} 
                        fill="#8f93a2" 
                        fontSize="8" 
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {trendData.counts[idx]}
                      </text>
                      {/* Weekday indicator label */}
                      <text 
                        x={p.x} 
                        y={svgHeight - 2} 
                        fill="#64748b" 
                        fontSize="8" 
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {trendData.labels[idx]}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Chart 2: Language breakdown Horizontal Grid Bars */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  <BarChart4 className="w-4 h-4 text-emerald-500" />
                  Monaco Sandbox Projects by Language
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Language preferences of student code bases created on CodeQuest.</p>
              </div>

              <div className="bg-neutral-950/60 border border-white/5 p-4 rounded-2xl space-y-4 min-h-[200px] flex flex-col justify-center">
                {Object.keys(languageCounts).length > 0 ? (
                  Object.entries(languageCounts).map(([lang, count]) => {
                    const maxVal = Math.max(...Object.values(languageCounts), 1);
                    const pct = Math.round((count / maxVal) * 100);
                    const col = languageColors[lang] || languageColors.fallback;

                    return (
                      <div key={lang} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="uppercase text-neutral-300">{lang}</span>
                          <span className="text-muted-foreground">{count} projects ({Math.round((count / projectsList.length) * 100)}%)</span>
                        </div>
                        <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden border border-white/5 relative">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.15)]"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: col,
                              boxShadow: `0 0 10px ${col}40`
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center italic text-xs text-neutral-500 py-6">No program languages registered in active projects.</p>
                )}
              </div>
            </div>

          </div>

          {/* LOWER ANALYSIS ROW - CIRCULAR DIAGNOSTICS & SYSTEM LOGS SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Donut percentage rings */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4">
              <h4 className="font-extrabold text-xs text-neutral-300 flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-purple-500" />
                Operations Diagnostics Shares
              </h4>
              
              <div className="bg-neutral-950/60 border border-white/5 p-4 rounded-2xl space-y-4 flex flex-col justify-center flex-1">
                
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-semibold text-neutral-400">Compiler Runs</span>
                  </div>
                  <span className="text-[10px] font-black text-indigo-400">{codingLogsCount} ({codingPct}%)</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-[10px] font-semibold text-neutral-400">Quizzes Solved</span>
                  </div>
                  <span className="text-[10px] font-black text-purple-400">{quizLogsCount} ({quizPct}%)</span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-semibold text-neutral-400">GitHub Commits</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400">{commitLogsCount} ({commitPct}%)</span>
                </div>

                {/* Combined full horizontal comparison track */}
                <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden flex border border-white/5 mt-2">
                  <div style={{ width: `${codingPct}%` }} className="bg-indigo-500 h-full" title="Compiler runs" />
                  <div style={{ width: `${quizPct}%` }} className="bg-purple-500 h-full" title="Quizzes" />
                  <div style={{ width: `${commitPct}%` }} className="bg-emerald-500 h-full" title="GitHub commits" />
                </div>

              </div>
            </div>

            {/* Quick stats on student levels */}
            <div className="bg-card border border-border p-6 rounded-3xl shadow-xl flex flex-col gap-4 md:col-span-2">
              <h4 className="font-extrabold text-xs text-neutral-300 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Student Learning Leaderboard Rankings
              </h4>

              <div className="bg-neutral-950/60 border border-white/5 p-4 rounded-2xl overflow-y-auto max-h-[170px] space-y-2.5 scrollbar-none flex-1">
                {usersList.length > 0 ? (
                  [...usersList]
                    .sort((a, b) => (b.xp || 0) - (a.xp || 0))
                    .slice(0, 5)
                    .map((dev, idx) => (
                      <div key={dev._id} className="flex items-center justify-between p-2 rounded-xl bg-secondary/10 border border-white/5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-extrabold text-neutral-500">#{idx + 1}</span>
                          <span className="text-base">{dev.avatar || "👨‍💻"}</span>
                          <div>
                            <span className="text-[10px] font-bold text-neutral-200">@{dev.username}</span>
                            <span className="text-[8px] text-muted-foreground block">Lvl {dev.level || 1} • {dev.coins || 0} Coins</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                          {dev.xp || 0} XP
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-center italic text-[10px] text-neutral-500 py-6">No leader ranks available in directory.</p>
                )}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ORIGINAL GRID DIRECTORY VIEWS (USERS, PROJECTS, LOGS) */
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          
          {/* ── 1. USERS DIRECTORY VIEW ── */}
          {activeTab === "users" && (
            <div className="overflow-x-auto select-text">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950 border-b border-border text-muted-foreground font-black text-[10px] uppercase tracking-wider select-none">
                    <th className="py-4 px-6">Developer Details</th>
                    <th className="py-4 px-6">Access Clearance</th>
                    <th className="py-4 px-6">Learning Rank</th>
                    <th className="py-4 px-6">Platform Coins</th>
                    <th className="py-4 px-6">Technical Expertise</th>
                    <th className="py-4 px-6 text-center">Git Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((dev) => (
                      <tr key={dev._id} className="hover:bg-secondary/10 transition-colors">
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-xl shadow-inner select-none">
                              {dev.avatar || "👨‍💻"}
                            </span>
                            <div>
                              <h4 className="font-extrabold text-foreground">{dev.fullName || dev.username}</h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5">@{dev.username} • {dev.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6">
                          <span className={`inline-block font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border ${
                            dev.role === "admin" 
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-500" 
                              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                          }`}>
                            {dev.role}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-semibold">
                          <div className="flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span>Lvl {dev.level || 1} ({dev.xp || 0} XP)</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 font-bold text-yellow-500 select-none">
                          🪙 {dev.coins || 0}
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1 max-w-xs select-none">
                            {dev.techSkills && dev.techSkills.length > 0 ? (
                              dev.techSkills.map((skill: string) => (
                                <span key={skill} className="bg-neutral-900 border border-white/5 px-2 py-0.5 rounded-full text-[9px] font-semibold text-neutral-400">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="text-neutral-500 italic text-[10px]">No skills defined</span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-center select-none">
                          <span className={`inline-block font-bold px-2 py-0.5 rounded text-[9px] uppercase ${
                            dev.githubUsername 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-neutral-900 border border-white/5 text-neutral-500"
                          }`}>
                            {dev.githubUsername ? `@${dev.githubUsername}` : "Not Connected"}
                          </span>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr className="select-none">
                      <td colSpan={6} className="py-12 text-center text-muted-foreground font-semibold">
                        No developers matched your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ── 2. CODE SNIPPETS / PROJECTS VIEW ── */}
          {activeTab === "projects" && (
            <div className="p-6 space-y-4">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((p) => {
                  const isExpanded = expandedProject === p._id;
                  const author = p.userId || { username: "unknown", email: "N/A", avatar: "👨‍💻" };
                  
                  return (
                    <div key={p._id} className="bg-secondary/15 border border-border/60 rounded-2xl overflow-hidden hover:border-border transition-colors">
                      
                      {/* Snippet Row Header */}
                      <div 
                        onClick={() => setExpandedProject(isExpanded ? null : p._id)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none gap-4 flex-wrap"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-lg shadow-inner">
                            {author.avatar}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-foreground flex items-center gap-2">
                              {p.title}
                              <span className="text-[9px] uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                                {p.language}
                              </span>
                            </h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Author: @{author.username} ({author.email})</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-neutral-500">
                            Updated: {new Date(p.updatedAt).toLocaleDateString()}
                          </span>
                          <button className="p-1.5 rounded-lg bg-neutral-900 border border-white/5 text-muted-foreground hover:text-white transition-all cursor-pointer">
                            {isExpanded ? <Layers className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanding Code Preview */}
                      {isExpanded && (
                        <div className="border-t border-border/40 p-4 bg-neutral-950 select-text">
                          <div className="mb-3 text-[10px] text-muted-foreground flex justify-between select-none">
                            <span>Snippet Preview Description: {p.description || "Workspace workspace files"}</span>
                            {p.githubLink && (
                              <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-0.5 font-bold">
                                GitHub Commit <Layers className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <pre className="bg-neutral-950 p-4 rounded-xl text-[11px] font-mono leading-relaxed text-neutral-300 overflow-x-auto whitespace-pre border border-white/5 scrollbar-none max-h-80">
                            {p.code || `// Empty project workspace`}
                          </pre>
                        </div>
                      )}

                    </div>
                  );
                })
              ) : (
                <p className="text-center py-12 text-muted-foreground font-semibold">No community code snippets matched your search.</p>
              )}
            </div>
          )}

          {/* ── 3. PLATFORM SYSTEM COMPILER LOGS ── */}
          {activeTab === "logs" && (
            <div className="overflow-x-auto select-text">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-950 border-b border-border text-muted-foreground font-black text-[10px] uppercase tracking-wider select-none">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Platform Student</th>
                    <th className="py-4 px-6">Operation Action</th>
                    <th className="py-4 px-6">Target Language</th>
                    <th className="py-4 px-6">Session Duration</th>
                    <th className="py-4 px-6 text-right">Written Lines</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => {
                      const student = log.userId || { username: "unknown", email: "N/A", avatar: "👨‍💻" };
                      
                      // Style label based on operations
                      let typeColor = "bg-neutral-900 text-neutral-400 border-white/5";
                      if (log.activityType === "coding") typeColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
                      if (log.activityType === "quiz") typeColor = "bg-purple-500/10 border-purple-500/20 text-purple-400";
                      if (log.activityType === "commit") typeColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";

                      return (
                        <tr key={log._id} className="hover:bg-secondary/10 transition-colors">
                          
                          <td className="py-4 px-6 font-mono text-[10px] text-muted-foreground select-none">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>

                          <td className="py-4 px-6 font-semibold">
                            <div className="flex items-center gap-2">
                              <span>{student.avatar}</span>
                              <div>
                                <span className="text-foreground font-bold">@{student.username}</span>
                                <span className="text-[10px] text-muted-foreground block font-medium">{student.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6 select-none">
                            <span className={`inline-block font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase border ${typeColor}`}>
                              {log.activityType || "execution"}
                            </span>
                          </td>

                          <td className="py-4 px-6 font-mono text-[10px] uppercase text-muted-foreground select-none">
                            {log.language || "N/A"}
                          </td>

                          <td className="py-4 px-6 font-bold select-none text-indigo-400">
                            {log.timeSpent ? `${Math.round(log.timeSpent / 60)} min` : "N/A"}
                          </td>

                          <td className="py-4 px-6 text-right font-mono font-bold select-none text-neutral-400">
                            {log.linesWritten || 0}
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr className="select-none">
                      <td colSpan={6} className="py-12 text-center text-muted-foreground font-semibold">
                        No system compilation operations logged.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
