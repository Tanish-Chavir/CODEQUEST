"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { 
  Heart, Star, MessageSquare, Plus, Check, Users, RefreshCw, 
  ExternalLink, FileCode, UserCheck, UserPlus, Award, BookOpen,
  Send, Code2, Sparkles, FolderGit2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { CardSkeleton, RosterSkeleton } from "@/components/Skeleton";

// Inline custom SVG GitHub icon to match perfectly
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: "#f1e05a",
  typescript: "#3178c6",
  python: "#3572A5",
  cpp: "#f34b7d",
  fallback: "#8b949e"
};

export default function SocialPage() {
  const { user: currentUser, refreshUser } = useAuth();
  const router = useRouter();
  const currentUserId = currentUser?.id || currentUser?._id || "";

  const [loading, setLoading] = useState(true);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [timelineProjects, setTimelineProjects] = useState<any[]>([]);

  // Expanded comments section state: projectID -> comments array
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Submit new comment form state: projectID -> text content
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [forking, setForking] = useState<string | null>(null);

  // Load all social datasets (discover users, public project timeline)
  const loadSocialFeed = async () => {
    try {
      const [devsData, projectsData] = await Promise.all([
        fetchWithAuth("/auth/users/discover"),
        fetchWithAuth("/projects/public")
      ]);
      setDevelopers(devsData);
      setTimelineProjects(projectsData);
    } catch (err) {
      console.error("Failed to load Code Social feed data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadSocialFeed();
  }, []);

  // Handle follow/unfollow developer
  const handleFollowToggle = async (devId: string) => {
    try {
      const result = await fetchWithAuth(`/auth/users/${devId}/follow`, {
        method: "POST"
      });

      // Update developers listing in state
      setDevelopers(prev => prev.map(dev => {
        if (dev._id === devId) {
          const isNowFollowing = result.isFollowing;
          const followers = isNowFollowing 
            ? [...(dev.followers || []), currentUserId]
            : (dev.followers || []).filter((id: any) => id !== currentUserId);
          return { ...dev, followers };
        }
        return dev;
      }));

      await refreshUser();
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
    }
  };

  // Handle Heart Like toggle
  const handleLikeToggle = async (projectId: string) => {
    try {
      const result = await fetchWithAuth(`/projects/${projectId}/like`, {
        method: "POST"
      });

      setTimelineProjects(prev => prev.map(p => {
        if (p._id === projectId) {
          const likes = result.isLiked 
            ? [...(p.likes || []), currentUserId]
            : (p.likes || []).filter((id: any) => id !== currentUserId);
          return { ...p, likes };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to toggle project like:", err);
    }
  };

  // Handle project star rating submission
  const handleRateProject = async (projectId: string, score: number) => {
    try {
      const result = await fetchWithAuth(`/projects/${projectId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating: score })
      });

      setTimelineProjects(prev => prev.map(p => {
        if (p._id === projectId) {
          return { ...p, ratings: result.ratings };
        }
        return p;
      }));
    } catch (err) {
      console.error("Failed to rate project snippet:", err);
    }
  };

  // Expand and load comments thread
  const toggleCommentsThread = async (projectId: string) => {
    const isExpanded = !expandedComments[projectId];
    setExpandedComments(prev => ({ ...prev, [projectId]: isExpanded }));

    if (isExpanded && !commentsMap[projectId]) {
      setCommentsLoading(prev => ({ ...prev, [projectId]: true }));
      try {
        const comments = await fetchWithAuth(`/projects/${projectId}/comments`);
        setCommentsMap(prev => ({ ...prev, [projectId]: comments }));
      } catch (err) {
        console.error("Failed to load comment thread:", err);
      } finally {
        setCommentsLoading(prev => ({ ...prev, [projectId]: false }));
      }
    }
  };

  // Submit comment
  const handleAddComment = async (e: React.FormEvent, projectId: string) => {
    e.preventDefault();
    const text = commentInputs[projectId] || "";
    if (text.trim() === "") return;

    try {
      const newComment = await fetchWithAuth(`/projects/${projectId}/comments`, {
        method: "POST",
        body: JSON.stringify({ text })
      });

      // Update comments dataset in state
      setCommentsMap(prev => ({
        ...prev,
        [projectId]: [...(prev[projectId] || []), newComment]
      }));

      // Clear input
      setCommentInputs(prev => ({ ...prev, [projectId]: "" }));
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Fork / Import public snippet to local workspace
  const handleForkSnippet = async (title: string, language: string, code: string) => {
    setForking(title);
    try {
      const forkedProject = await fetchWithAuth("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: `Fork: ${title}`,
          description: `Imported snippet from Code Social Hub.`,
          language,
          code
        })
      });

      // Set editor workspace target
      localStorage.setItem("codequest_last_editor_project_id", forkedProject._id);
      router.push("/dashboard/editor");
    } catch (err) {
      console.error("Failed to fork project snippet:", err);
      alert("Fork workspace creation failed.");
    } finally {
      setForking(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* HEADER SKELETON */}
        <div className="space-y-2">
          <div className="w-48 h-8 bg-neutral-900 border border-white/5 rounded-xl" />
          <div className="w-full max-w-xl h-4 bg-neutral-900 border border-white/5 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main feeds skeletal */}
          <div className="lg:col-span-3 space-y-6">
            <div className="w-32 h-4 bg-neutral-900 border border-white/5 rounded-lg" />
            <CardSkeleton />
            <CardSkeleton />
          </div>

          {/* Peer recommendation skeletal */}
          <div className="bg-card border border-border p-6 rounded-3xl shadow-xl space-y-4">
            <div className="w-24 h-4 bg-neutral-900 border border-white/5 rounded-lg" />
            <RosterSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER PANELS */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" />
          CodeQuest Social
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Follow recommended developers, fork Monaco code snippets directly into your sandbox, rate code algorithms, and share reviews!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Timeline main feeds column */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-1">
            <BookOpen className="w-4 h-4 text-primary" />
            Public Snippets Timeline
          </h2>

          {timelineProjects.length > 0 ? (
            timelineProjects.map((project) => {
              const likes = project.likes || [];
              const ratings = project.ratings || [];
              const isLiked = likes.includes(currentUserId);
              const author = project.userId || { username: "unknown", fullName: "Anonymous Coder", avatar: "👨‍💻", level: 1 };
              const langColor = LANGUAGE_COLORS[project.language.toLowerCase()] || LANGUAGE_COLORS.fallback;

              // Compute average rating star
              const avgRating = ratings.length > 0 
                ? (ratings.reduce((acc: number, cur: any) => acc + (cur.rating || 0), 0) / ratings.length).toFixed(1)
                : null;

              // Find active user's rating score
              const activeUserRating = ratings.find((r: any) => r.userId === currentUserId)?.rating || 0;

              return (
                <div 
                  key={project._id} 
                  className="bg-card border border-border rounded-3xl p-6 shadow-xl space-y-5 hover:border-border/80 transition-all duration-300"
                >
                  
                  {/* Timeline author and details row */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-secondary border border-border flex items-center justify-center text-2xl shadow-inner">
                        {author.avatar}
                      </div>
                      <div>
                        <h3 className="text-sm font-black flex items-center gap-1.5">
                          {author.fullName}
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded-full shrink-0">
                            Lvl {author.level}
                          </span>
                        </h3>
                        <p className="text-[11px] text-muted-foreground font-semibold">@{author.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 flex items-center gap-1 uppercase"
                        style={{ borderColor: `${langColor}30`, backgroundColor: `${langColor}10`, color: langColor }}
                      >
                        <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: langColor }} />
                        {project.language}
                      </span>
                    </div>
                  </div>

                  {/* Title and descriptions */}
                  <div className="space-y-1.5">
                    <h4 className="text-base font-black tracking-tight">{project.title}</h4>
                    <p className="text-xs text-muted-foreground leading-normal">
                      {project.description || "Sharing Monaco dynamic workspace code snippet. Run and compile inside Sandbox."}
                    </p>
                  </div>

                  {/* Mono-style syntax code block preview */}
                  <div className="bg-neutral-950 border border-white/5 rounded-2xl p-4 overflow-hidden relative group/code max-h-56 select-text">
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
                    <pre className="text-[11px] font-mono leading-relaxed text-neutral-300 overflow-x-auto whitespace-pre scrollbar-none">
                      {project.code || `// No code content\n`}
                    </pre>
                    <div className="absolute right-4 bottom-4 opacity-0 group-hover/code:opacity-100 transition-opacity flex gap-2">
                      {project.githubLink && (
                        <a
                          href={project.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-neutral-900 border border-white/5 text-muted-foreground hover:text-foreground text-[10px] font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <GithubIcon className="w-3.5 h-3.5" /> GitHub
                        </a>
                      )}
                      <button
                        onClick={() => handleForkSnippet(project.title, project.language, project.code)}
                        disabled={forking === project.title}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 text-[10px] font-bold py-1.5 px-3 rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-primary/20 disabled:opacity-75"
                      >
                        {forking === project.title ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Code2 className="w-3.5 h-3.5" />
                        )}
                        {forking === project.title ? "Forking..." : "Fork Snippet"}
                      </button>
                    </div>
                  </div>

                  {/* Interactive likes, stars ratings, and comment tabs */}
                  <div className="flex items-center justify-between border-t border-b border-border py-3 text-xs text-muted-foreground flex-wrap gap-4 select-none">
                    
                    {/* Micro-animated Like hearts */}
                    <div className="flex items-center gap-5">
                      <button
                        onClick={() => handleLikeToggle(project._id)}
                        className={`flex items-center gap-1.5 font-bold transition-all cursor-pointer group active:scale-90 ${
                          isLiked ? "text-rose-500" : "hover:text-rose-400"
                        }`}
                      >
                        <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${isLiked ? "fill-current" : ""}`} />
                        <span>{likes.length} Likes</span>
                      </button>

                      {/* Expanding comments */}
                      <button
                        onClick={() => toggleCommentsThread(project._id)}
                        className={`flex items-center gap-1.5 font-bold hover:text-primary transition-all cursor-pointer ${
                          expandedComments[project._id] ? "text-primary" : ""
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Comments</span>
                      </button>
                    </div>

                    {/* Star ratings */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold flex items-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        {avgRating ? `${avgRating} avg` : "Unrated"}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRateProject(project._id, star)}
                            className={`p-0.5 transition-all active:scale-110 cursor-pointer ${
                              star <= activeUserRating 
                                ? "text-amber-500" 
                                : "text-muted-foreground/30 hover:text-amber-500"
                            }`}
                            title={`Rate ${star} star(s)`}
                          >
                            <Star className={`w-3.5 h-3.5 ${star <= activeUserRating ? "fill-current" : ""}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Collapsible comment feeds */}
                  {expandedComments[project._id] && (
                    <div className="space-y-4 pt-2 border-t border-dashed border-border animate-fade-in select-text">
                      
                      {commentsLoading[project._id] ? (
                        <div className="flex justify-center py-4">
                          <RefreshCw className="w-5 h-5 text-muted-foreground animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {commentsMap[project._id] && commentsMap[project._id].length > 0 ? (
                            commentsMap[project._id].map((comm) => {
                              const cAuthor = comm.userId || { username: "unknown", fullName: "Anonymous", avatar: "👨‍💻", level: 1 };
                              return (
                                <div key={comm._id} className="bg-secondary/20 border border-border/40 p-3 rounded-2xl flex items-start gap-3 text-xs leading-normal">
                                  <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center text-lg shrink-0 select-none">
                                    {cAuthor.avatar}
                                  </div>
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <span className="font-extrabold text-foreground flex items-center gap-1">
                                        {cAuthor.fullName}
                                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-1.5 py-0.5 rounded-full">
                                          Lvl {cAuthor.level}
                                        </span>
                                      </span>
                                      <span className="text-[9px] text-muted-foreground font-semibold">
                                        {new Date(comm.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground text-[11px] leading-relaxed break-words">{comm.text}</p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic py-2">No feedbacks yet. Be the first to add a comment!</p>
                          )}
                        </div>
                      )}

                      {/* Comment submission form */}
                      <form 
                        onSubmit={(e) => handleAddComment(e, project._id)}
                        className="flex gap-2 bg-neutral-950 border border-white/5 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all shrink-0"
                      >
                        <input
                          type="text"
                          placeholder="Write review critique..."
                          value={commentInputs[project._id] || ""}
                          onChange={(e) => setCommentInputs(prev => ({ ...prev, [project._id]: e.target.value }))}
                          className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs px-3 text-foreground placeholder-muted-foreground"
                        />
                        <button
                          type="submit"
                          disabled={!commentInputs[project._id] || commentInputs[project._id].trim() === ""}
                          className="bg-primary hover:bg-primary/95 text-primary-foreground p-2 rounded-xl transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>

                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="bg-card border border-border rounded-3xl p-12 text-center text-xs text-muted-foreground space-y-4 max-w-xl mx-auto flex flex-col items-center">
              <FolderGit2 className="w-10 h-10 text-muted-foreground" />
              <p>No public Monaco code snippets discovered inside Code Social timeline yet.</p>
            </div>
          )}
        </div>

        {/* ── RECOMMENDED DEVELOPERS SIDEBAR ── */}
        <aside className="space-y-6 lg:col-span-1">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 pt-1 select-none">
            <Users className="w-4 h-4 text-primary" />
            Discover Peers
          </h2>

          <div className="bg-card border border-border rounded-3xl p-5 shadow-xl space-y-4">
            
            {developers.length > 0 ? (
              developers.map((dev) => {
                const followers = dev.followers || [];
                const isFollowing = followers.includes(currentUserId);

                return (
                  <div 
                    key={dev._id} 
                    className="p-3 bg-secondary/10 border border-border/40 rounded-2xl flex items-center justify-between gap-3 group/dev hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-xl shrink-0 group-hover/dev:scale-105 transition-transform duration-300">
                        {dev.avatar || "👨‍💻"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-foreground truncate">{dev.fullName || dev.username}</h4>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                          <span>Lvl {dev.level || 1}</span>
                          <span>•</span>
                          <span>{followers.length} follows</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleFollowToggle(dev._id)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isFollowing 
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20" 
                          : "bg-neutral-950 border-white/5 text-muted-foreground hover:text-foreground hover:bg-neutral-900"
                      }`}
                      title={isFollowing ? "Unfollow developer" : "Follow developer"}
                    >
                      {isFollowing ? (
                        <UserCheck className="w-3.5 h-3.5" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-[11px] text-muted-foreground italic text-center py-4">No other developers linked on the CodeQuest network yet.</p>
            )}

          </div>
        </aside>

      </div>

    </div>
  );
}
