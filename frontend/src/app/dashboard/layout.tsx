"use client";

import { ReactNode, useEffect, useState } from "react";
import { Code, LayoutDashboard, Library, Settings, LogOut, Sparkles, Star, Gamepad2, Trophy, ShieldCheck, Flame } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    fetchWithAuth("/auth/me")
      .then((data) => setUser(data))
      .catch(() => {
        localStorage.removeItem("token");
        router.push("/");
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Navigation */}
      <aside className="group w-20 hover:w-64 transition-all duration-300 ease-in-out border-r border-border bg-card/50 flex flex-col overflow-hidden relative z-50">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <Code className="w-6 h-6 text-primary shrink-0" />
            <span className="font-bold text-lg tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">CodeQuest</span>
          </Link>
        </div>

        {/* User XP Badge */}
        {user && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-primary/10 border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-yellow-500 shrink-0" />
              <span className="text-xs font-bold text-primary">Level {user.level}</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${((user.xp % 500) / 500) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{user.xp % 500} / 500 XP to next level</p>
          </div>
        )}
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <NavLink href="/dashboard"            icon={<LayoutDashboard className="w-6 h-6 shrink-0" />} label="Dashboard"    active={pathname === "/dashboard"} />
          <NavLink href="/dashboard/courses"    icon={<Library        className="w-6 h-6 shrink-0" />} label="My Courses"   active={pathname?.startsWith("/dashboard/courses")} />
          <NavLink href="/dashboard/games"      icon={<Gamepad2       className="w-6 h-6 shrink-0" />} label="Game Zone 🎮" active={pathname?.startsWith("/dashboard/games")} />
          <NavLink href="/dashboard/leaderboard"icon={<Trophy         className="w-6 h-6 shrink-0" />} label="Leaderboard"  active={pathname?.startsWith("/dashboard/leaderboard")} />

          <div className="pt-3 pb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1">Account</p>
          </div>
          <NavLink href="/dashboard/settings"   icon={<Settings       className="w-6 h-6 shrink-0" />} label="Settings"     active={pathname === "/dashboard/settings"} />
          {user?.role === "admin" && (
            <NavLink href="/dashboard/admin"      icon={<ShieldCheck    className="w-6 h-6 shrink-0" />} label="Admin Panel"  active={pathname?.startsWith("/dashboard/admin")} />
          )}
        </div>

        {/* User info + Logout */}
        <div className="p-4 border-t border-border space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-xl shrink-0">
                {user.avatar || user.username?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                <p className="text-sm font-bold truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all overflow-hidden whitespace-nowrap"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string, icon: ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all overflow-hidden whitespace-nowrap ${
        active 
          ? "bg-primary/10 text-primary font-semibold border border-primary/20" 
          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
      }`}
    >
      {icon}
      <span className="font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">{label}</span>
    </Link>
  );
}
