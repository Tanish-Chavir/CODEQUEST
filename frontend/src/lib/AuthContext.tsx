"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchWithAuth } from "@/lib/api";

interface User {
  _id?: string;
  id: string;
  username: string;
  email: string;
  xp: number;
  coins: number;
  level: number;
  theme: string;
  watchTime: number;
  role: "user" | "admin";
  avatar?: string;
  streakDays?: number;
  quizzesTaken?: number;
  correctAnswers?: number;
  githubToken?: string;
  githubUsername?: string;
  techSkills?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchWithAuth("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to recover user session:", error);
      // Clean invalid token
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (token: string, userData: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    setUser(userData);
    setLoading(false);
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    setUser(null);
    setLoading(false);
  };

  const refreshUser = async () => {
    try {
      const data = await fetchWithAuth("/auth/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
