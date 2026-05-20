"use client";

import { useEffect, useState } from "react";
import { Plus, PlaySquare, Loader2, Sparkles, Clock, Trophy, TrendingUp, BookOpen } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";
import Link from "next/link";

function formatWatchTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [userData, coursesData] = await Promise.all([
          fetchWithAuth("/auth/me"),
          fetchWithAuth("/courses"),
        ]);
        setUser(userData);
        setCourses(coursesData);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl) return;

    setLoading(true);
    setMessage("");

    try {
      const data = await fetchWithAuth("/courses", {
        method: "POST",
        body: JSON.stringify({ playlistUrl }),
      });
      setMessage("✅ " + data.message);
      setPlaylistUrl("");
      // Refresh courses list
      const coursesData = await fetchWithAuth("/courses");
      setCourses(coursesData);
      setTimeout(() => {
        window.location.href = "/dashboard/courses";
      }, 1500);
    } catch (err: any) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const xpToNextLevel = user ? 500 - (user.xp % 500) : 500;
  const levelProgress = user ? ((user.xp % 500) / 500) * 100 : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {user ? `Welcome back, ${user.username}! 👋` : "Welcome to CodeQuest Dashboard"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Track your progress, take AI quizzes, and turn any YouTube playlist into an interactive course.
        </p>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total XP"
          value={statsLoading ? "..." : `${user?.xp?.toLocaleString() ?? 0} XP`}
          icon={<Sparkles className="w-5 h-5 text-yellow-500" />}
          accent="yellow"
        />
        <StatCard
          title="Current Level"
          value={statsLoading ? "..." : `Level ${user?.level ?? 1}`}
          icon={<Trophy className="w-5 h-5 text-primary" />}
          accent="primary"
          sub={`${xpToNextLevel} XP to next level`}
        />
        <StatCard
          title="Courses Enrolled"
          value={statsLoading ? "..." : `${courses.length}`}
          icon={<BookOpen className="w-5 h-5 text-blue-500" />}
          accent="blue"
        />
        <StatCard
          title="Watch Time"
          value={statsLoading ? "..." : formatWatchTime(user?.watchTime ?? 0)}
          icon={<Clock className="w-5 h-5 text-green-500" />}
          accent="green"
        />
      </div>

      {/* XP Progress Bar */}
      {user && (
        <div className="glass-card border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Level {user.level} Progress</span>
            </div>
            <span className="text-xs text-muted-foreground">{user.xp % 500} / 500 XP</span>
          </div>
          <div className="w-full bg-secondary/50 h-3 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{xpToNextLevel} XP needed to reach Level {user.level + 1}</p>
        </div>
      )}

      {/* Create Course Form */}
      <div className="glass-card border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold mb-2">Create New Course</h2>
          <p className="text-muted-foreground mb-6">
            Paste a YouTube Playlist URL below. Our AI will analyze the videos, build an interactive timeline, and generate custom pop-up quizzes!
          </p>
          
          <form onSubmit={handleCreateCourse} className="flex gap-4">
            <div className="relative flex-1">
              <PlaySquare className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="w-full bg-background/50 backdrop-blur-md border border-white/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-foreground"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-70 disabled:active:scale-100 neon-glow"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? "Generating..." : "Generate Course"}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg text-sm font-medium ${message.startsWith('❌') ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* Recent Courses */}
      {courses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Courses</h2>
            <Link href="/dashboard/courses" className="text-sm text-primary hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.slice(0, 3).map((course) => (
              <Link
                key={course._id}
                href={`/dashboard/courses/${course._id}`}
                className="neon-border-card rounded-xl overflow-hidden hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all group"
              >
                <div className="aspect-video bg-secondary relative overflow-hidden">
                  <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80"}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlaySquare className="w-10 h-10 text-white" />
                  </div>
                </div>
                <div className="p-4 bg-background/50 backdrop-blur-sm border-t border-white/5">
                  <p className="font-semibold text-sm line-clamp-2">{course.title}</p>
                  <p className="text-xs text-primary mt-1">Tap to resume →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, accent, sub }: { title: string; value: string; icon: React.ReactNode; accent?: string; sub?: string }) {
  const accentMap: Record<string, string> = {
    yellow: "bg-yellow-500/10 text-yellow-500",
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-500",
    green: "bg-green-500/10 text-green-500",
  };
  const bg = accentMap[accent ?? "primary"] ?? "bg-secondary text-foreground";

  return (
    <div className="glass-card border border-white/10 p-5 rounded-2xl shadow-xl flex items-center justify-between hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:border-primary/30 transition-all">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`h-11 w-11 ${bg} rounded-xl flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  );
}
