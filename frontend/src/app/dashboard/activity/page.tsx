"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { 
  Activity, Flame, Clock, Award, CheckCircle2, 
  TrendingUp, RefreshCw, Terminal, Plus, Sparkles, BookOpen, Layers
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from "recharts";

// Curated colors for popular coding languages
const LANG_COLORS: Record<string, string> = {
  javascript: "#f1e05a",
  python: "#3572A5",
  typescript: "#3178c6",
  cpp: "#f34b7d",
  java: "#b07219",
  html: "#e34c26",
  css: "#563d7c",
  ruby: "#701516",
  go: "#00ADD8",
  rust: "#dea584",
  unknown: "#6b7280"
};

export default function ActivityPage() {
  const { user: contextUser, refreshUser } = useAuth();
  const { permission } = usePushNotifications();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalCodingTimeMinutes: 0,
    totalLinesWritten: 0,
    languageBreakdown: [],
    dailyBreakdown: []
  });
  const [logs, setLogs] = useState<any[]>([]);

  // Simulation Form states
  const [simLang, setSimLang] = useState("javascript");
  const [simDuration, setSimDuration] = useState(30); // 30 minutes
  const [simLines, setSimLines] = useState(120);
  const [simulating, setSimulating] = useState(false);
  const [simMsg, setSimMsg] = useState("");

  const fetchAllData = async () => {
    try {
      const [statsData, logsData] = await Promise.all([
        fetchWithAuth("/activity/stats"),
        fetchWithAuth("/activity/logs")
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      console.error("Failed to load activity logs:", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchAllData().finally(() => setLoading(false));
  }, []);

  const handleSimulateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimMsg("");

    try {
      const timeInSeconds = simDuration * 60;
      const data = await fetchWithAuth("/activity/log", {
        method: "POST",
        body: JSON.stringify({
          timeSpent: timeInSeconds,
          language: simLang,
          linesWritten: simLines
        })
      });

      setSimMsg(`Logged successfully! Awarded +${data.xpGain} XP & +${data.coinsGain} Coins! ⚔️`);
      
      // Update local states instantly
      await fetchAllData();
      // Synchronize global context User levels
      await refreshUser();

      // Trigger standard HTML5 fallback confirmation
      if (Notification.permission === "granted") {
        new Notification("Activity Logged! 🧑‍💻", {
          body: `Registered ${simDuration} mins of ${simLang} coding. Claimed XP!`,
          icon: "/next.svg"
        });
      }

      // Reset lines typed randomly for next simulation
      setSimLines(Math.floor(Math.random() * 200) + 50);

    } catch (err: any) {
      setSimMsg(err.message || "Simulation failed");
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Calculate statistics metrics
  const quizzes = contextUser?.quizzesTaken || 0;
  const correct = contextUser?.correctAnswers || 0;
  const accuracy = quizzes > 0 ? Math.round((correct / quizzes) * 100) : 0;

  // Custom tooltips for recharts area graph
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-950/95 border border-border p-3 rounded-xl shadow-xl backdrop-blur-md">
          <p className="text-xs text-muted-foreground font-bold">{payload[0].payload.date}</p>
          <p className="text-sm font-extrabold text-primary mt-1">
            {payload[0].value} mins spent
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Activity & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track daily coding habits, analyze language distribution, and claim XP rewards.
          </p>
        </div>
        
        {/* Quick notification test bar */}
        {permission !== "granted" && (
          <div className="text-xs font-bold text-amber-500 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 flex items-center gap-2">
            🔔 Enable notifications in Settings for real-time alerts.
          </div>
        )}
      </div>

      {/* Grid Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Coding time card */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-primary/10 blur-xl rounded-full group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground">Total Coding Time</h3>
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Terminal className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">{stats.totalCodingTimeMinutes}</span>
            <span className="text-muted-foreground font-semibold text-sm">Minutes</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Log code daily to dynamically increase XP levels!</p>
        </div>

        {/* Lines Written */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-emerald-500/10 blur-xl rounded-full group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground">Lines of Code</h3>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">{stats.totalLinesWritten}</span>
            <span className="text-muted-foreground font-semibold text-sm">Typed</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Total keystrokes logged by CodeQuest simulators.</p>
        </div>

        {/* Streak card */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-amber-500/10 blur-xl rounded-full group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground">Active Streak</h3>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">{contextUser?.streakDays || 0}</span>
            <span className="text-muted-foreground font-semibold text-sm">Days Active</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Maintain your learning habit to stay high on the boards.</p>
        </div>

        {/* Accuracy card */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group shadow-sm">
          <div className="absolute top-[-10%] right-[-10%] w-24 h-24 bg-blue-500/10 blur-xl rounded-full group-hover:scale-125 transition-all duration-500" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-muted-foreground">Quiz Accuracy</h3>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-foreground">{accuracy}%</span>
            <span className="text-muted-foreground font-semibold text-sm">Correct Ratio</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{contextUser?.correctAnswers || 0} correct out of {contextUser?.quizzesTaken || 0} attempts.</p>
        </div>

      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GitHub-style Heatmap calendar Grid (Last 30 Days) */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg">Contribution Matrix</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your daily learning density in the past 30 days.</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <span>Less</span>
              <div className="w-3.5 h-3.5 rounded bg-secondary" />
              <div className="w-3.5 h-3.5 rounded bg-primary/30" />
              <div className="w-3.5 h-3.5 rounded bg-primary/60" />
              <div className="w-3.5 h-3.5 rounded bg-primary" />
              <span>More</span>
            </div>
          </div>

          {/* Grid Render */}
          <div className="grid grid-flow-col grid-rows-5 gap-2.5 p-4 bg-secondary/20 rounded-xl border border-border justify-start overflow-x-auto">
            {/* Generate last 30 grid boxes */}
            {Array.from({ length: 30 }).map((_, idx) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - idx));
              const dateString = d.toISOString().split("T")[0];
              
              // Find matching daily log activity
              const dailyMatch = stats.dailyBreakdown?.find((item: any) => item.date === dateString);
              const minutesSpent = dailyMatch ? dailyMatch.timeSpentMinutes : 0;

              // Opacity density color resolves
              let bgClass = "bg-secondary";
              if (minutesSpent > 0 && minutesSpent <= 10) bgClass = "bg-primary/20 hover:scale-110";
              else if (minutesSpent > 10 && minutesSpent <= 30) bgClass = "bg-primary/55 hover:scale-110";
              else if (minutesSpent > 30) bgClass = "bg-primary hover:scale-110";

              return (
                <div 
                  key={idx}
                  title={`${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${minutesSpent} mins active`}
                  className={`w-7 h-7 rounded-md cursor-pointer transition-all duration-300 relative group flex items-center justify-center font-bold text-[9px] ${bgClass}`}
                >
                  <span className="opacity-0 group-hover:opacity-100 text-white transition-opacity duration-300 absolute">
                    {minutesSpent}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time spent Area Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Coding Habit Trend</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Chronological minutes spent coding this week.</p>
          </div>

          <div className="flex-1 w-full min-h-[250px] relative">
            {stats.dailyBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--color-primary, #4F46E5)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="dayName" 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.4)" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="timeSpentMinutes" 
                    stroke="var(--color-primary, #4F46E5)" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="url(#colorTime)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                No time logs recorded. Run simulations below to see graphs!
              </div>
            )}
          </div>
        </div>

        {/* Language Breakdown Pie chart */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <h3 className="font-bold text-lg">Language Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Focus breakdown across all environments.</p>
          </div>

          <div className="flex-1 w-full min-h-[220px] relative flex items-center justify-center">
            {stats.languageBreakdown?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.languageBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="timeSpent"
                  >
                    {stats.languageBreakdown.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={LANG_COLORS[entry.language] || LANG_COLORS.unknown} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${Math.round(value / 60)} mins`, "Time"]}
                    contentStyle={{ backgroundColor: "#0a0a0a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "10px" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    formatter={(value: any, entry: any) => (
                      <span className="text-[10px] text-muted-foreground font-bold capitalize">
                        {entry.payload.language} ({entry.payload.percentage}%)
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                No language records parsed yet.
              </div>
            )}
          </div>
        </div>

        {/* Simulation Sandbox Panel */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            Developer Simulation Quest
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            Simulate a real terminal coding session to dynamically log coding hours, test local FCM notifications, and claim levels/coins!
          </p>

          <form onSubmit={handleSimulateSession} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Select Language */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Coding Language</label>
                <select
                  value={simLang}
                  onChange={(e) => setSimLang(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                >
                  <option value="javascript">JavaScript 🧑‍💻</option>
                  <option value="python">Python 🐍</option>
                  <option value="typescript">TypeScript 🟦</option>
                  <option value="cpp">C++ 🛠️</option>
                  <option value="rust">Rust 🦀</option>
                </select>
              </div>

              {/* Coding duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Duration (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={simDuration}
                  onChange={(e) => setSimDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>

              {/* Lines written */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Lines of Code</label>
                <input
                  type="number"
                  min={1}
                  value={simLines}
                  onChange={(e) => setSimLines(parseInt(e.target.value, 10))}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                />
              </div>

            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              {simMsg && (
                <span className="text-xs font-bold text-green-500 animate-pulse">
                  {simMsg}
                </span>
              )}
              <button
                type="submit"
                disabled={simulating}
                className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {simulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Log Simulated Session 🚀
              </button>
            </div>
          </form>
        </div>

        {/* Live Feed Activity History Logs */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Active Learning Logs
          </h2>
          
          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-3.5 pr-1">
            {logs.length > 0 ? (
              logs.map((log: any) => {
                const isCode = log.actionType === "coding_session";
                return (
                  <div 
                    key={log._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border hover:border-primary/20 transition-all"
                  >
                    <div>
                      <span className="text-xs font-extrabold capitalize text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {isCode ? `${log.details.language} Session` : log.actionType.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-muted-foreground block mt-1">
                        {isCode 
                          ? `${Math.round(log.details.timeSpent / 60)} mins coding • ${log.details.linesWritten || 0} lines` 
                          : `${log.details.topic || "Completed task"}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                      +{isCode ? Math.max(10, Math.floor(log.details.timeSpent / 6)) : 50} XP
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-muted-foreground text-center py-8">
                No activity logs. Start coding above to see feeds!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
