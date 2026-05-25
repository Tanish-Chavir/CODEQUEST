"use client";

import { ReactNode, useEffect, useState } from "react";
import { 
  Code, 
  LayoutDashboard, 
  Activity as ActivityIcon, 
  FolderGit2, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Users,
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Flame,
  Search,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  // Responsive states
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Restore collapse state
    const savedCollapse = localStorage.getItem("sidebar_collapsed");
    if (savedCollapse) {
      setIsCollapsed(savedCollapse === "true");
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  if (!mounted) return null;

  const baseNavItems = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/editor", label: "Code Editor", icon: <Code className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/activity", label: "Activity", icon: <ActivityIcon className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/projects", label: "Projects", icon: <FolderGit2 className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/social", label: "Code Social", icon: <Users className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/profile", label: "Profile", icon: <UserIcon className="w-5 h-5 shrink-0" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <SettingsIcon className="w-5 h-5 shrink-0" /> },
  ];

  const navItems = user?.role === "admin" 
    ? [...baseNavItems, { href: "/dashboard/admin", label: "Admin Console", icon: <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-500" /> }]
    : baseNavItems;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row relative overflow-hidden">
        
        {/* BACKGROUND NEON ACCENTS */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none z-0" />

        {/* --- DESKTOP SIDEBAR --- */}
        <aside 
          className={`hidden md:flex flex-col shrink-0 bg-neutral-900/60 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out relative z-30 ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Code className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent animate-fade-in whitespace-nowrap">
                  CodeQuest
                </span>
              )}
            </Link>
          </div>

          {/* User Level/XP Summary */}
          {user && !isCollapsed && (
            <div className="mx-4 mt-6 p-4 rounded-2xl bg-neutral-950/80 border border-white/5 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-bold text-indigo-400">Level {user.level}</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-medium">{user.xp % 500} / 500 XP</span>
              </div>
              <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${((user.xp % 500) / 500) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-md font-semibold" 
                      : "text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent"
                  }`}
                >
                  {item.icon}
                  {!isCollapsed && <span className="text-sm tracking-wide">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Footer info & Collapse Toggle */}
          <div className="p-4 border-t border-white/5 space-y-4">
            {user && !isCollapsed && (
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-indigo-500/10">
                  {user.avatar || user.username?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold truncate leading-none">{user.username}</p>
                  <p className="text-xs text-neutral-500 truncate mt-1">{user.email}</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-3.5 px-3.5 py-3 w-full rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="font-semibold text-sm tracking-wide">Logout</span>}
              </button>

              {/* Collapse toggle button */}
              <button 
                onClick={toggleCollapse}
                className="hidden md:flex items-center justify-center p-2 rounded-lg bg-neutral-950/60 hover:bg-white/5 text-neutral-400 hover:text-white border border-white/5 mt-2 transition-all self-center w-full"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </aside>

        {/* --- MOBILE DRAWERS/SIDEBAR --- */}
        <AnimatePresence>
          {isMobileOpen && (
            <>
              {/* Mobile Backdrop */}
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setIsMobileOpen(false)}
              />
              {/* Mobile Drawer */}
              <nav className="fixed inset-y-0 left-0 w-72 bg-neutral-900 border-r border-white/10 z-50 p-6 flex flex-col justify-between md:hidden animate-in slide-in-from-left duration-300">
                <div className="space-y-8">
                  {/* Brand / Close Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                        <Code className="w-5 h-5 text-white" />
                      </div>
                      <span className="font-bold text-lg">CodeQuest</span>
                    </div>
                    <button 
                      onClick={() => setIsMobileOpen(false)}
                      className="p-1 rounded-full text-neutral-400 hover:text-white bg-white/5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile XP Summary */}
                  {user && (
                    <div className="p-4 rounded-xl bg-neutral-950 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-indigo-400">Level {user.level}</span>
                        <span className="text-[10px] text-neutral-400">{user.xp % 500} / 500 XP</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${((user.xp % 500) / 500) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <Link 
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all ${
                            isActive 
                              ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-bold" 
                              : "text-neutral-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {item.icon}
                          <span className="text-sm tracking-wide">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Footer */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                  {user && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg font-bold">
                        {user.avatar || user.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold truncate leading-none">{user.username}</p>
                        <p className="text-xs text-neutral-500 truncate mt-1">{user.email}</p>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3.5 px-3.5 py-3 w-full rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <span className="font-semibold text-sm tracking-wide">Logout</span>
                  </button>
                </div>
              </nav>
            </>
          )}
        </AnimatePresence>

        {/* --- CONTENT CONTAINER WITH TOP NAV --- */}
        <div className="flex-1 flex flex-col min-w-0 z-10 relative">
          
          {/* --- TOP NAVBAR --- */}
          <header className="h-16 bg-neutral-900/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 md:px-8 relative z-20 shrink-0">
            
            <div className="flex items-center gap-4">
              {/* Mobile Trigger Toggle */}
              <button
                onClick={() => setIsMobileOpen(true)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 md:hidden transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Path Breadcrumbs / Section Title */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-400">
                <span className="font-medium">CodeQuest</span>
                <span>/</span>
                <span className="text-white capitalize font-semibold">
                  {pathname?.split("/").pop() || "overview"}
                </span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-4 md:gap-6">
              
              {/* Search Box */}
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                <input 
                  type="text"
                  placeholder="Quick search..."
                  className="bg-neutral-950/60 border border-white/5 rounded-xl py-1.5 pl-9 pr-4 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all w-48 focus:w-60"
                />
              </div>

              {/* Notification Bell */}
              <button className="relative p-2 rounded-xl bg-neutral-950/60 hover:bg-white/5 border border-white/5 text-neutral-400 hover:text-white transition-all">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-neutral-950" />
              </button>

              {/* Hot Streak Tracker (Gamification element) */}
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>3 Day Streak</span>
              </div>

              {/* User Avatar Menu */}
              {user && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-600/20">
                  {user.avatar || user.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </header>

          {/* --- MAIN CONTENT AREA --- */}
          <main className="flex-1 overflow-y-auto z-10 relative">
            <div className="max-w-6xl mx-auto p-6 md:p-8">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
