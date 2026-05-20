"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchWithAuth } from "@/lib/api";
import {
  Download, Users, TrendingUp, Clock, AlertCircle,
  RefreshCw, Search, Trophy, Target, Activity
} from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminDashboardPage() {
  const [users, setUsers]     = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchWithAuth("/auth/users");
      setUsers(data);
      setFiltered(data);
      setLastRefresh(new Date());
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Live search filter
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(u =>
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.country?.toLowerCase().includes(q)
      )
    );
  }, [search, users]);

  const handleExport = () => {
    // Always export the LATEST fetched data — fully live
    const exportData = users.map(u => ({
      "User ID":              u._id,
      "Username":             u.username,
      "Full Name":            u.fullName || "—",
      "Email":                u.email,
      "Phone":                u.phone || "—",
      "Country":              u.country || "—",
      "Bio":                  u.bio || "—",
      "Role":                 u.role || "user",
      "Level":                u.level,
      "Total XP":             u.xp,
      "Coins":                u.coins,
      "Watch Time (Minutes)": Math.round((u.watchTime || 0) / 60),
      "Quizzes Taken":        u.quizzesTaken || 0,
      "Correct Answers":      u.correctAnswers || 0,
      "Accuracy (%)":         u.quizzesTaken > 0
                                ? Math.round(((u.correctAnswers || 0) / u.quizzesTaken) * 100)
                                : 0,
      "Streak Days":          u.streakDays || 0,
      "Total Logins":         u.loginCount || 0,
      "Last Login":           u.lastLogin ? new Date(u.lastLogin).toLocaleString("en-IN") : "—",
      "Avatar":               u.avatar || "—",
      "Joined Date":          new Date(u.createdAt).toLocaleDateString("en-IN"),
      "Last Updated":         new Date(u.updatedAt).toLocaleDateString("en-IN"),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    // Auto-size columns
    if (exportData.length > 0) {
      ws["!cols"] = Object.keys(exportData[0]).map(k => ({
        wch: Math.max(k.length, ...exportData.map(r => String((r as any)[k] ?? "").length)) + 2
      }));
    }

    // Filename includes timestamp so you always know when it was exported
    const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
    XLSX.writeFile(wb, `CodeQuest_Users_${ts}.xlsx`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-bold mb-2">Access Error</h2>
      <p className="text-muted-foreground">{error}</p>
    </div>
  );

  const totalXp         = users.reduce((s, u) => s + (u.xp || 0), 0);
  const totalWatchHours = Math.round(users.reduce((s, u) => s + (u.watchTime || 0), 0) / 3600);
  const totalQuizzes    = users.reduce((s, u) => s + (u.quizzesTaken || 0), 0);
  const avgAccuracy     = totalQuizzes > 0
    ? Math.round(users.reduce((s, u) => s + (u.correctAnswers || 0), 0) / totalQuizzes * 100)
    : 0;

  const statCards = [
    { label: "Total Users",     value: users.length,                        icon: Users,     color: "text-primary",      bg: "bg-primary/10" },
    { label: "Total XP Earned", value: totalXp.toLocaleString(),            icon: TrendingUp, color: "text-yellow-500",   bg: "bg-yellow-500/10" },
    { label: "Watch Hours",     value: `${totalWatchHours}h`,               icon: Clock,     color: "text-blue-500",     bg: "bg-blue-500/10" },
    { label: "Quiz Avg Accuracy",value: `${avgAccuracy}%`,                  icon: Target,    color: "text-green-500",    bg: "bg-green-500/10" },
  ];

  return (
    <div className="animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Admin Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Live data · Last refreshed: {lastRefresh.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold border border-border hover:bg-secondary transition-all text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, country..."
          className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Location</th>
                <th className="p-4">Level / XP</th>
                <th className="p-4">Watch Time</th>
                <th className="p-4">Quizzes</th>
                <th className="p-4">Logins</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u._id} className="hover:bg-secondary/30 transition-colors text-sm">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{u.avatar || "🧑‍💻"}</span>
                      <div>
                        <div className="font-bold">{u.username}</div>
                        <div className="text-xs text-muted-foreground">{u.fullName || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    <div>{u.email}</div>
                    <div className="text-xs">{u.phone || "—"}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.country || "—"}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 mr-1">
                      Lv.{u.level}
                    </span>
                    <span className="font-mono text-sm">{u.xp} XP</span>
                  </td>
                  <td className="p-4 text-muted-foreground">{Math.round((u.watchTime || 0) / 60)} mins</td>
                  <td className="p-4">
                    <div className="font-bold">{u.quizzesTaken || 0} taken</div>
                    <div className="text-xs text-muted-foreground">
                      {u.quizzesTaken > 0
                        ? `${Math.round(((u.correctAnswers || 0) / u.quizzesTaken) * 100)}% accuracy`
                        : "—"}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.loginCount || 0}</td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td className="p-4 text-muted-foreground text-xs">
                    {new Date(u.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length} users
        </div>
      </div>
    </div>
  );
}
