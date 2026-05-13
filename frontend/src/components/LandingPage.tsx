"use client";

import { useState, useEffect } from "react";
import { Code, Sun, Moon } from "lucide-react";
import { AuthModal } from "./AuthModal";

import { motion, useScroll, useSpring } from "framer-motion";

// New Premium Components
import { Hero } from "./landing/Hero";
import { Features } from "./landing/Features";
import { CoursesPreview } from "./landing/CoursesPreview";
import { TechStack } from "./landing/TechStack";
import { ContactFooter } from "./landing/ContactFooter";
import { ScrollWalletAnimation } from "./landing/ScrollWalletAnimation";

export function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    setMounted(true);
    // Check system/saved preference
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved ? saved === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleAuthSuccess = (userData: any) => {
    setUser(userData);
    console.log("Logged in:", userData);
    window.location.href = "/dashboard";
  };

  if (!mounted) return null;

  return (
    <div className="relative overflow-x-clip selection:bg-primary/30 min-h-screen bg-background">
      {/* Scroll Progress Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400 z-[60] origin-left neon-glow"
        style={{ scaleX }}
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={handleAuthSuccess} 
      />

      <div className="relative z-10">
        {/* Glass Navigation */}
        <nav className="fixed w-full flex items-center justify-between p-6 lg:px-12 backdrop-blur-xl bg-background/50 z-50 border-b border-white/5 top-0">
          <div className="flex items-center gap-2">
            <Code className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">CodeQuest</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#quests" className="hover:text-primary transition-colors">Quests</a>
            <a href="#stack" className="hover:text-primary transition-colors">Tech Stack</a>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-full neon-border-card flex items-center justify-center text-muted-foreground hover:text-primary transition-colors border"
              aria-label="Toggle theme"
            >
              <motion.div
                key={isDark ? "moon" : "sun"}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </motion.button>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground hidden sm:block">Welcome, {user.username}</span>
                <a href="/dashboard" className="glass-card text-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-white/10 transition-all">
                  Dashboard
                </a>
              </div>
            ) : (
              <>
                <button onClick={() => setIsAuthOpen(true)} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden sm:block">Log in</button>
                <button onClick={() => setIsAuthOpen(true)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-lg hover:shadow-primary/25 transition-all active:scale-95 neon-glow">
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>

        {/* Premium Sections */}
        <Hero onAuthOpen={() => setIsAuthOpen(true)} />
        <ScrollWalletAnimation />
        <Features />
        <div id="quests"><CoursesPreview /></div>
        <div id="stack"><TechStack /></div>
        <ContactFooter />
      </div>
    </div>
  );
}
