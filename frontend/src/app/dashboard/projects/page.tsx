"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { PlaySquare, RefreshCw, FolderGit2, Calendar, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CardSkeleton } from "@/components/Skeleton";

export default function ProjectsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithAuth("/courses")
      .then((data) => setCourses(data))
      .catch((err) => console.error("Error loading courses:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header skeletal */}
        <div className="space-y-2">
          <div className="w-56 h-8 bg-neutral-900 border border-white/5 rounded-xl" />
          <div className="w-80 h-4 bg-neutral-900 border border-white/5 rounded-lg" />
        </div>
        
        {/* Responsive grid matching actual items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Coding Projects</h1>
          <p className="text-neutral-400 mt-2">
            Explore interactive quests generated from your imported video playlists.
          </p>
        </div>
        <Link 
          href="/dashboard" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all self-start flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-600/25 text-sm"
        >
          Create New Project
        </Link>
      </div>

      {courses.length === 0 ? (
        /* Empty State */
        <div className="bg-neutral-900/60 border border-white/5 rounded-3xl p-12 text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-6">
            <FolderGit2 className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No projects created yet</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Import a YouTube playlist link on your Overview panel to convert it into an interactive coding quest with quizzes instantly!
          </p>
          <Link 
            href="/dashboard" 
            className="text-indigo-400 font-semibold text-sm hover:underline flex items-center gap-1.5"
          >
            Go to Overview <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* Dynamic Grid List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div 
              key={course._id}
              className="bg-neutral-900 border border-white/5 hover:border-indigo-500/30 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Aspect Ratio Video Thumbnail Wrapper */}
                <div className="aspect-video bg-neutral-950 relative overflow-hidden">
                  <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80"}
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 scale-90 group-hover:scale-100 transition-transform duration-300">
                      <PlaySquare className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Active Quest
                  </span>
                  <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-neutral-500 text-xs line-clamp-2">
                    {course.description || "No description provided. Click below to dive in."}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 pb-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-500 bg-neutral-950/20 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(course.createdAt).toLocaleDateString()}</span>
                </div>
                <Link
                  href={`/dashboard/courses/${course._id}`}
                  className="font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group/btn"
                >
                  Start Project 
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
