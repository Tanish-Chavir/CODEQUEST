"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api";
import { BookOpen, Play, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await fetchWithAuth("/courses");
        setCourses(data);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  const handleDeleteCourse = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this course? This will permanently remove all progress data for this course.")) return;
    try {
      await fetchWithAuth(`/courses/${courseId}`, {
        method: "DELETE",
      });
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
    } catch (err: any) {
      alert("Failed to delete course: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
        <p className="text-muted-foreground mt-2">Resume your learning journey or browse your generated courses.</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl shadow-sm">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">You haven't generated any YouTube courses yet.</p>
          <Link href="/dashboard" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium hover:bg-primary/90 transition-all">
            Generate your first course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
              {/* Thumbnail linked to course */}
              <Link href={`/dashboard/courses/${course._id}`} className="aspect-video bg-secondary relative overflow-hidden block cursor-pointer">
                <img 
                  src={course.thumbnail || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80"} 
                  alt={course.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white ml-2 animate-pulse" />
                </div>
              </Link>
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{course.title}</h3>
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                  <button 
                    onClick={(e) => handleDeleteCourse(course._id, e)}
                    className="text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/20 hover:border-destructive/30 transition-all flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                  <Link href={`/dashboard/courses/${course._id}`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1 text-primary">
                    Resume <Play className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
