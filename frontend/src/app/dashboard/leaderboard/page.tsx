"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { Trophy, Zap, Clock, Target, Medal, Loader2 } from "lucide-react";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [users, setUsers]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe]         = useState<any>(null);
  const [tab, setTab]       = useState<"xp" | "watch" | "quiz">("xp");

  useEffect(() => {
    Promise.all([
      fetchWithAuth("/auth/users"),
      fetchWithAuth("/auth/me"),
    ]).then(([all, self]) => {
      setUsers(all);
      setMe(self);
    }).finally(() => setLoading(false));
  }, []);

  const sorted = [...users].sort((a, b) => {
    if (tab === "xp")    return (b.xp || 0) - (a.xp || 0);
    if (tab === "watch") return (b.watchTime || 0) - (a.watchTime || 0);
    return (b.quizzesTaken || 0) - (a.quizzesTaken || 0);
  });

  const myRank = sorted.findIndex(u => u._id === me?._id) + 1;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">🏆 Leaderboard</h1>
        <p className="text-muted-foreground text-sm">
          {myRank > 0 ? `You are ranked #${myRank} globally!` : "Complete activities to appear on the leaderboard!"}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-secondary p-1 rounded-xl mb-8 gap-1">
        {[
          { key: "xp",    label: "Top XP",     icon: Zap },
          { key: "watch", label: "Watch Time",  icon: Clock },
          { key: "quiz",  label: "Most Quizzes",icon: Target },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-4 mb-10">
          {/* 2nd place */}
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">{sorted[1].avatar || "🧑‍💻"}</span>
            <div className="w-24 bg-zinc-400/20 border border-zinc-400/30 rounded-t-2xl flex flex-col items-center py-4" style={{ height: "120px" }}>
              <span className="text-2xl">🥈</span>
              <span className="font-bold text-sm mt-auto">{sorted[1].username}</span>
            </div>
          </div>
          {/* 1st place */}
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">{sorted[0].avatar || "🧑‍💻"}</span>
            <div className="w-28 bg-yellow-500/20 border border-yellow-500/30 rounded-t-2xl flex flex-col items-center py-4" style={{ height: "160px" }}>
              <span className="text-3xl">🥇</span>
              <span className="font-bold text-sm mt-auto">{sorted[0].username}</span>
            </div>
          </div>
          {/* 3rd place */}
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-2">{sorted[2].avatar || "🧑‍💻"}</span>
            <div className="w-24 bg-orange-500/20 border border-orange-500/30 rounded-t-2xl flex flex-col items-center py-4" style={{ height: "90px" }}>
              <span className="text-2xl">🥉</span>
              <span className="font-bold text-sm mt-auto">{sorted[2].username}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full Ranking List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="divide-y divide-border">
          {sorted.map((u, i) => {
            const isMe = u._id === me?._id;
            const statValue = tab === "xp"
              ? `${u.xp || 0} XP`
              : tab === "watch"
              ? `${Math.round((u.watchTime || 0) / 60)} mins`
              : `${u.quizzesTaken || 0} quizzes`;

            return (
              <div
                key={u._id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  isMe ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-secondary/30"
                }`}
              >
                {/* Rank */}
                <div className="w-10 text-center font-extrabold text-lg shrink-0">
                  {i < 3 ? MEDALS[i] : <span className="text-muted-foreground">#{i + 1}</span>}
                </div>
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl">{u.avatar || "🧑‍💻"}</span>
                  <div className="min-w-0">
                    <div className="font-bold truncate flex items-center gap-1">
                      {u.username}
                      {isMe && <span className="text-xs text-primary font-bold">(You)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">Level {u.level}</div>
                  </div>
                </div>
                {/* Stat */}
                <div className="font-bold text-sm tabular-nums text-right">{statValue}</div>
              </div>
            );
          })}
          {sorted.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No users yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
