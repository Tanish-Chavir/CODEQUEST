"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  User as UserIcon, Mail, MapPin, Sparkles, Trophy, Edit3, 
  Check, RefreshCw, Calendar, BookOpen, Terminal, Settings, 
  Search, Pin, ExternalLink, Award, FileCode, Star, AlertCircle
} from "lucide-react";

// Inline custom SVG GitHub icon to match the premium theme perfectly
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const PREDEFINED_SKILLS = [
  "JavaScript", "TypeScript", "Python", "C++", "HTML/CSS",
  "React", "Next.js", "Node.js", "Express", "MongoDB",
  "SQL", "Git/GitHub", "Docker", "Algorithms", "Data Structures"
];

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  cpp: "#f34b7d",
  fallback: "#8b949e"
};

export default function ProfilePage() {
  const { user: contextUser, refreshUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "settings">("overview");

  // Project Lists Filters
  const [projectSearch, setProjectSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");

  // Local Storage Pinned IDs
  const [pinnedProjectIds, setPinnedProjectIds] = useState<string[]>([]);
  const [showPinModal, setShowPinModal] = useState(false);

  // Profile fields state
  const [formData, setFormData] = useState({
    username: "",
    fullName: "",
    phone: "",
    bio: "",
    country: "",
    avatar: "👨‍💻",
    techSkills: [] as string[]
  });

  const avatarsList = ["👨‍💻", "👩‍💻", "🤖", "🚀", "⚡", "👾", "🦊", "🐉", "🧙‍♂️", "🎯"];

  // Fetch all profile details, projects, and activities
  const loadProfileData = async () => {
    try {
      const [userData, projectsData, logsData] = await Promise.all([
        fetchWithAuth("/auth/me"),
        fetchWithAuth("/projects"),
        fetchWithAuth("/activity/logs").catch(() => [])
      ]);

      setUser(userData);
      setProjects(projectsData);
      setActivityLogs(logsData);

      setFormData({
        username: userData.username || "",
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        bio: userData.bio || "",
        country: userData.country || "",
        avatar: userData.avatar || "👨‍💻",
        techSkills: userData.techSkills || []
      });

      // Load pinned projects from local storage
      const storedPins = localStorage.getItem(`codequest_pinned_${userData._id}`);
      if (storedPins) {
        setPinnedProjectIds(JSON.parse(storedPins));
      } else {
        // Fallback: Pin top 3 projects automatically if none are set yet
        const defaultPins = projectsData.slice(0, 3).map((p: any) => p._id);
        setPinnedProjectIds(defaultPins);
        localStorage.setItem(`codequest_pinned_${userData._id}`, JSON.stringify(defaultPins));
      }

    } catch (err) {
      console.error("Failed to load user profile dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadProfileData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await fetchWithAuth("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      setUser(data);
      await refreshUser();
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("❌ Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle skills selections
  const toggleSkill = (skill: string) => {
    setFormData(prev => {
      const skills = prev.techSkills.includes(skill)
        ? prev.techSkills.filter(s => s !== skill)
        : [...prev.techSkills, skill];
      return { ...prev, techSkills: skills };
    });
  };

  // Toggle pinning of snippets
  const togglePin = (projId: string) => {
    if (!user) return;
    let newPins;
    if (pinnedProjectIds.includes(projId)) {
      newPins = pinnedProjectIds.filter(id => id !== projId);
    } else {
      if (pinnedProjectIds.length >= 6) {
        alert("Maximum of 6 pinned snippets allowed!");
        return;
      }
      newPins = [...pinnedProjectIds, projId];
    }
    setPinnedProjectIds(newPins);
    localStorage.setItem(`codequest_pinned_${user._id}`, JSON.stringify(newPins));
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Loading Developer Profile...</p>
      </div>
    );
  }

  // Calculate Level XP stats
  const currentXP = user.xp || 0;
  const levelXP = currentXP % 500;
  const levelProgressPercent = Math.min(100, Math.floor((levelXP / 500) * 100));

  // Filter projects inside Snippets tab
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(projectSearch.toLowerCase());
    const matchesLang = langFilter === "all" ? true : p.language === langFilter;
    return matchesSearch && matchesLang;
  });

  // Pick up pinned project objects
  const pinnedProjects = projects.filter(p => pinnedProjectIds.includes(p._id));

  // Construct gorgeous GitHub Contribution grid (past 12 months)
  const getHeatmapGrid = () => {
    const today = new Date();
    const gridDays: Date[] = [];
    
    // Set to 52 weeks ago, aligned to the start of the week (Sunday)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 364);
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // align to Sunday

    let tempDate = new Date(startDate);
    while (tempDate <= today) {
      gridDays.push(new Date(tempDate));
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Build frequency map from logs
    const frequencyMap: Record<string, number> = {};
    activityLogs.forEach(log => {
      const dateKey = new Date(log.timestamp).toISOString().split("T")[0];
      frequencyMap[dateKey] = (frequencyMap[dateKey] || 0) + 1;
    });

    // Group days array into weeks array (columns of 7 days)
    const columns: Date[][] = [];
    let currentColumn: Date[] = [];

    gridDays.forEach((day) => {
      currentColumn.push(day);
      if (currentColumn.length === 7) {
        columns.push(currentColumn);
        currentColumn = [];
      }
    });

    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    return { columns, frequencyMap };
  };

  const { columns: heatmapColumns, frequencyMap: heatmapFreq } = getHeatmapGrid();

  // Pick calendar block color based on log counts
  const getBlockColor = (count: number) => {
    if (!count || count === 0) return "bg-neutral-900/60 border-white/5 hover:bg-neutral-800";
    if (count <= 1) return "bg-emerald-950 border-emerald-900/20 text-emerald-400 hover:bg-emerald-900/60";
    if (count <= 3) return "bg-emerald-800 border-emerald-700/20 text-emerald-300 hover:bg-emerald-700";
    if (count <= 5) return "bg-emerald-600 border-emerald-500/20 text-emerald-200 hover:bg-emerald-500";
    return "bg-emerald-400 border-emerald-300/20 text-neutral-900 hover:bg-emerald-300";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* ── PROFILE COVER HEADER ── */}
      <div className="relative rounded-3xl h-36 bg-gradient-to-r from-neutral-950 via-indigo-950/20 to-neutral-950 border border-border overflow-hidden flex items-end p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Level {user.level} Developer
          </span>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* ── LEFT SIDEBAR (IDENTITY & SPECS) ── */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="relative -mt-20 flex flex-col items-center lg:items-start px-2">
            
            {/* Avatar Glow Ring */}
            <div className="relative group mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-indigo-500 blur-[10px] opacity-60" />
              <div className="relative w-28 h-28 rounded-full bg-neutral-950 border-4 border-card flex items-center justify-center text-6xl shadow-2xl">
                {formData.avatar}
              </div>
            </div>

            {/* Profile Identity Details */}
            <div className="text-center lg:text-left space-y-1 w-full">
              <h2 className="text-2xl font-black tracking-tight text-foreground">{formData.fullName || "Coder Companion"}</h2>
              <p className="text-sm font-semibold text-primary">@{formData.username}</p>
              
              {formData.bio ? (
                <p className="text-xs text-muted-foreground mt-3 italic leading-relaxed bg-secondary/20 border border-border/40 p-3 rounded-2xl w-full">
                  "{formData.bio}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-3 italic leading-relaxed">
                  "Exploring Monaco code dungeons & algorithms..."
                </p>
              )}
            </div>

            {/* Profile Stats / Location */}
            <div className="mt-5 space-y-2.5 text-xs text-muted-foreground w-full py-4 border-t border-b border-border">
              {formData.country && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>Located in <strong>{formData.country}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined CodeQuest in <strong>{new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</strong></span>
              </div>
            </div>

            {/* Gamified Level Progress Bar */}
            <div className="mt-5 w-full space-y-2 bg-secondary/30 border border-border p-4 rounded-2xl">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">Level {user.level}</span>
                <span className="font-medium text-muted-foreground">{levelXP} / 500 XP</span>
              </div>
              <div className="h-2 w-full bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">Gain {500 - levelXP} more XP to reach Level {user.level + 1}!</p>
            </div>

            {/* GitHub Account Link Status */}
            <div className="mt-4 w-full">
              {user.githubToken ? (
                <div className="bg-neutral-900/60 border border-white/5 p-4 rounded-2xl space-y-2 flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <GithubIcon className="w-4 h-4 text-white" />
                    <span>Linked to @{user.githubUsername}</span>
                  </div>
                  <a
                    href={`https://github.com/${user.githubUsername}/CodeQuest-Snippets`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" /> Pushed Snippets Repo
                  </a>
                </div>
              ) : (
                <div className="bg-neutral-900/40 border border-border p-4 rounded-2xl text-center space-y-3">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">Boost versioning with automatic GitHub sync uploads!</p>
                  <button
                    onClick={() => { setActiveTab("settings"); }}
                    className="w-full text-[11px] bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold py-1.5 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    Link GitHub in Settings
                  </button>
                </div>
              )}
            </div>

            {/* Technical Skills Showcase */}
            <div className="mt-5 w-full space-y-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                Highlighted Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {formData.techSkills.length > 0 ? (
                  formData.techSkills.map((skill) => (
                    <span 
                      key={skill} 
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold tracking-wide"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No highlighted skills. Add tags in the Settings tab!</p>
                )}
              </div>
            </div>

          </div>
        </aside>

        {/* ── RIGHT CONTENT CONTROLLER (TABS & DETAILS) ── */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Navigation Tab Header Links */}
          <div className="flex border-b border-border items-center gap-4 text-sm scrollbar-none overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3.5 font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "overview" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Overview
              {activeTab === "overview" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`pb-3.5 font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "projects" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="w-4 h-4" />
              Snippets & Projects
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-extrabold border border-border">
                {projects.length}
              </span>
              {activeTab === "projects" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`pb-3.5 font-bold transition-all relative flex items-center gap-2 cursor-pointer ${
                activeTab === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings Profile
              {activeTab === "settings" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* ── TAB PANELS CONTENT ── */}
          <div className="min-h-[450px]">
            
            {/* ── OVERVIEW TAB PANEL ── */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fade-in">
                
                {/* Pinned Snippets section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Pin className="w-4 h-4 text-primary" />
                      Pinned Snippet Quests
                    </h3>
                    <button
                      onClick={() => setShowPinModal(true)}
                      className="text-xs bg-secondary hover:bg-secondary/80 text-foreground border border-border py-1 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      Customize Pinned Board
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pinnedProjects.length > 0 ? (
                      pinnedProjects.map((proj) => {
                        const langColor = LANGUAGE_COLORS[proj.language.toLowerCase()] || LANGUAGE_COLORS.fallback;
                        return (
                          <div 
                            key={proj._id} 
                            className="bg-neutral-900/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-primary/30 transition-all group"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <a 
                                  href={`/dashboard/editor`}
                                  className="text-sm font-bold text-foreground hover:text-primary transition-all flex items-center gap-2"
                                  onClick={() => {
                                    // Save project key to localStorage so Monaco editor loads it automatically
                                    localStorage.setItem("codequest_last_editor_project_id", proj._id);
                                  }}
                                >
                                  <FileCode className="w-4 h-4 text-primary shrink-0" />
                                  <span className="truncate">{proj.title}</span>
                                </a>
                                {proj.githubLink && (
                                  <a 
                                    href={proj.githubLink}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                    title="View committed code on GitHub"
                                  >
                                    <GithubIcon className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                Monaco-powered gamified dynamic quest snippet in {proj.language.toUpperCase()}.
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-4 pt-3 border-t border-white/5">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: langColor }} />
                                  <span className="font-semibold text-foreground uppercase">{proj.language}</span>
                                </span>
                                <span>{proj.code ? proj.code.length : 0} chars</span>
                              </div>
                              <span className="text-[9px] bg-secondary px-2 py-0.5 rounded-md border border-border">
                                {new Date(proj.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-2 bg-neutral-900/30 border border-dashed border-border rounded-2xl p-8 text-center text-xs text-muted-foreground">
                        No pinned code snippets. Click "Customize Pinned Board" to pin your best Monaco snippets!
                      </div>
                    )}
                  </div>
                </div>

                {/* 365-day Activity calendar Heatmap Graph */}
                <div className="bg-neutral-900/60 border border-white/5 p-6 rounded-3xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {activityLogs.length} Developer Coding Acts in the past year
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Tracking code compilation logs, snippet saves, and platform runs.</p>
                  </div>

                  {/* Heatmap scrolling grid */}
                  <div className="w-full overflow-x-auto scrollbar-thin pb-2">
                    <div className="flex gap-[3.5px] min-w-[700px] h-[95px] select-none py-1">
                      
                      {/* Week columns */}
                      {heatmapColumns.map((week, weekIndex) => (
                        <div key={weekIndex} className="flex flex-col gap-[3.5px]">
                          {week.map((day, dayIndex) => {
                            const dateKey = day.toISOString().split("T")[0];
                            const count = heatmapFreq[dateKey] || 0;
                            const titleText = `${count} act(s) on ${day.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                            
                            return (
                              <div
                                key={dayIndex}
                                className={`w-[9.5px] h-[9.5px] rounded-[1.5px] transition-all cursor-pointer ${getBlockColor(count)}`}
                                title={titleText}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Legend and Labels */}
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-white/5 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5">
                      <span>Mon</span>
                      <span className="w-1.5" />
                      <span>Wed</span>
                      <span className="w-1.5" />
                      <span>Fri</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Less</span>
                      <div className="w-[9.5px] h-[9.5px] rounded-[1.5px] bg-neutral-900 border border-white/5" />
                      <div className="w-[9.5px] h-[9.5px] rounded-[1.5px] bg-emerald-950 border border-emerald-900/10" />
                      <div className="w-[9.5px] h-[9.5px] rounded-[1.5px] bg-emerald-800 border border-emerald-700/10" />
                      <div className="w-[9.5px] h-[9.5px] rounded-[1.5px] bg-emerald-600 border border-emerald-500/10" />
                      <div className="w-[9.5px] h-[9.5px] rounded-[1.5px] bg-emerald-400 border border-emerald-300/10" />
                      <span>More</span>
                    </div>
                  </div>
                </div>

                {/* Developer Activity Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-neutral-900/40 border border-border p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Daily Streak</p>
                    <p className="text-xl font-black text-foreground mt-1 flex items-center justify-center gap-1">
                      🔥 {user.streakDays ?? 0} Days
                    </p>
                  </div>
                  <div className="bg-neutral-900/40 border border-border p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Watch Time</p>
                    <p className="text-xl font-black text-foreground mt-1">
                      ⏱️ {Math.round((user.watchTime || 0) / 60)} mins
                    </p>
                  </div>
                  <div className="bg-neutral-900/40 border border-border p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Quizzes Taken</p>
                    <p className="text-xl font-black text-foreground mt-1">
                      🧠 {user.quizzesTaken ?? 0} Taken
                    </p>
                  </div>
                  <div className="bg-neutral-900/40 border border-border p-4 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Global Ranking</p>
                    <p className="text-xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1">
                      🏅 Top 1%
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ── PROJECTS / SNIPPETS TAB PANEL ── */}
            {activeTab === "projects" && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Search & Filters navbar */}
                <div className="flex flex-col md:flex-row gap-3 bg-secondary/20 border border-border/80 p-3 rounded-2xl shrink-0">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search snippet quests..."
                      value={projectSearch}
                      onChange={e => setProjectSearch(e.target.value)}
                      className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <select
                    value={langFilter}
                    onChange={e => setLangFilter(e.target.value)}
                    className="bg-neutral-950 border border-white/5 rounded-xl py-2 px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer font-bold"
                  >
                    <option value="all">All Languages 🧑‍💻</option>
                    <option value="javascript">JavaScript ⚡</option>
                    <option value="python">Python 🐍</option>
                    <option value="typescript">TypeScript 🟦</option>
                    <option value="cpp">C++ 🛠️</option>
                  </select>
                </div>

                {/* Snippets Inventory grid */}
                <div className="space-y-3">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((proj) => {
                      const isPinned = pinnedProjectIds.includes(proj._id);
                      const langColor = LANGUAGE_COLORS[proj.language.toLowerCase()] || LANGUAGE_COLORS.fallback;
                      return (
                        <div 
                          key={proj._id} 
                          className="bg-neutral-900/40 border border-border/60 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between hover:border-border transition-all gap-4 group"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <a 
                                href={`/dashboard/editor`}
                                className="text-sm font-bold text-foreground hover:text-primary transition-all flex items-center gap-2"
                                onClick={() => {
                                  localStorage.setItem("codequest_last_editor_project_id", proj._id);
                                }}
                              >
                                <FileCode className="w-4 h-4 text-primary shrink-0" />
                                <span className="truncate">{proj.title}</span>
                              </a>
                              <span className="text-[9px] bg-secondary/80 border border-border px-2 py-0.5 rounded-full font-bold uppercase text-muted-foreground">
                                {proj.language}
                              </span>
                              {isPinned && (
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0">
                                  <Pin className="w-2.5 h-2.5" /> Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate max-w-lg">
                              Monaco snippet saved securely in CodeQuest servers. Total character length: {proj.code ? proj.code.length : 0} chars.
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: langColor }} />
                              Updated {new Date(proj.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>

                            <div className="flex items-center gap-2">
                              {proj.githubLink && (
                                <a 
                                  href={proj.githubLink}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-neutral-900 border border-white/5 hover:bg-neutral-800 rounded-lg text-muted-foreground hover:text-primary transition-all cursor-pointer"
                                  title="View on GitHub"
                                >
                                  <GithubIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => togglePin(proj._id)}
                                className={`p-1.5 border rounded-lg transition-all cursor-pointer ${
                                  isPinned 
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20" 
                                    : "bg-neutral-900 border-white/5 text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                                }`}
                                title={isPinned ? "Unpin snippet" : "Pin snippet to Overview"}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-neutral-900/20 border border-dashed border-border rounded-2xl p-12 text-center text-xs text-muted-foreground space-y-2">
                      <AlertCircle className="w-6 h-6 text-muted-foreground mx-auto" />
                      <p>No snippet projects found matching '{projectSearch}'.</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── SETTINGS TAB PANEL ── */}
            {activeTab === "settings" && (
              <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in">
                
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                    <Edit3 className="w-5 h-5 text-primary" />
                    Customize Developer Settings
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Customize your gamified public developer details, skills set, and profile icons.</p>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-xs font-semibold border ${
                    message.startsWith('❌') 
                      ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {message}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  
                  {/* Select avatar */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Select Public Avatar emoji</label>
                    <div className="flex flex-wrap gap-2 p-3 bg-neutral-950/80 rounded-2xl border border-white/5">
                      {avatarsList.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setFormData({ ...formData, avatar: av })}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all cursor-pointer ${
                            formData.avatar === av 
                              ? "bg-primary text-primary-foreground scale-110 shadow-lg shadow-primary/20 border border-primary/40" 
                              : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggle technical skills selection array */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Customize Highlighted Skill Tags</label>
                    <div className="flex flex-wrap gap-2 p-4 bg-neutral-950/80 rounded-2xl border border-white/5">
                      {PREDEFINED_SKILLS.map((skill) => {
                        const isSelected = formData.techSkills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? "bg-primary/10 border-primary/30 text-primary"
                                : "bg-neutral-900 border-white/5 text-muted-foreground hover:bg-neutral-800 hover:text-foreground"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-primary" />}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid details forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5 text-muted-foreground" /> Username handle
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> Full name
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Public name"
                        className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Country / Region
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="e.g. United Kingdom"
                        className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-muted-foreground" /> Level Badge rank (Calculated)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={`Level ${user.level} Developer`}
                        className="w-full bg-neutral-950/40 border border-white/5 rounded-xl py-2.5 px-4 text-xs text-muted-foreground focus:outline-none cursor-not-allowed font-semibold"
                      />
                    </div>

                  </div>

                  {/* Bio textarea */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-muted-foreground" /> Developer mini bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Write a custom description explaining your developer motivations..."
                      rows={3}
                      className="w-full bg-neutral-950 border border-white/5 rounded-xl py-3 px-4 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-70 cursor-pointer shadow-sm shadow-primary/20"
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {saving ? "Updating Profile..." : "Save Custom Settings"}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>

        </main>

      </div>

      {/* ── CUSTOMIZE PINNED SNIPPETS MODAL ── */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div>
              <h3 className="text-base font-bold flex items-center gap-1.5">
                <Pin className="w-4 h-4 text-primary" />
                Customize Pinned Snippets
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Select up to 6 saved Monaco snippet quests to showcase on your profile overview.</p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {projects.length > 0 ? (
                projects.map((proj) => {
                  const isPinned = pinnedProjectIds.includes(proj._id);
                  return (
                    <div 
                      key={proj._id}
                      onClick={() => togglePin(proj._id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        isPinned
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/20 border-border hover:bg-secondary/40 text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{proj.title}</span>
                      </div>
                      <span className="text-[9px] bg-secondary border border-border px-2 py-0.5 rounded-full uppercase shrink-0 font-extrabold">
                        {proj.language}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No saved code snippets. Create a project in the editor first!
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="bg-primary text-primary-foreground hover:bg-primary/95 font-bold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Close & Sync Board
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
