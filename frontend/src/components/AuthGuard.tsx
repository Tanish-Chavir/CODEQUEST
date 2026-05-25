"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { RefreshCw } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  // Premium loading view while resolving session
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center text-white">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-indigo-600/30 blur-[20px] animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center text-indigo-500 shadow-xl">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg tracking-wide">Syncing Session</h3>
            <p className="text-xs text-neutral-500 mt-1">Connecting to CodeQuest servers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Prevents flashing dashboard content prior to redirecting
  }

  return <>{children}</>;
}
