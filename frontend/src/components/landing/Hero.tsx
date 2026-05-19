"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion";
import { Play, ChevronRight, Code, Cpu, Database, Cloud } from "lucide-react";

import { StarryBackground } from "./StarryBackground";

const TITLE_TEXT = "Master Code with Interactive AI";
const DESCRIPTIONS = [
  "Turn any YouTube tutorial into an interactive course. Watch, learn, take quizzes, play games, and earn rewards along your journey.",
  "Master complex algorithms with our timeline-based interactive quizzes that pop up exactly when you need them.",
  "Build your coding streak. Unlock premium themes, avatars, and exclusive coding mini-games as you progress."
];

export function Hero({ onAuthOpen }: { onAuthOpen: () => void }) {
  const [descIndex, setDescIndex] = useState(0);

  // Parallax mouse effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  // Interactive Scroll Animation
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, 150]);
  const indicatorOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 10; // More sensitive parallax multiplier
      const y = (e.clientY - innerHeight / 2) / 10;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    const interval = setInterval(() => {
      setDescIndex((prev) => (prev + 1) % DESCRIPTIONS.length);
    }, 4000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [mouseX, mouseY]);

  return (
    <section className="relative min-h-[95vh] flex items-center justify-center pt-24 pb-32 px-6 overflow-hidden">
      {/* Starry Background Particles */}
      <StarryBackground mouseX={springX} mouseY={springY} />

      {/* Floating Gradient Orbs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-primary/20 blur-[100px] pointer-events-none z-0" 
      />
      <motion.div 
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-blue-500/20 blur-[120px] pointer-events-none z-0" 
      />

      {/* Interactive Parallax Content */}
      <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-20 max-w-5xl mx-auto text-center space-y-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-primary text-sm font-medium border border-primary/20"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          CodeQuest — Gamified AI Learning
        </motion.div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] text-center max-w-4xl mx-auto flex flex-wrap justify-center gap-x-4 gap-y-2 text-foreground">
          {TITLE_TEXT.split(" ").map((word, wordIndex) => (
            <div key={wordIndex} className="inline-flex overflow-hidden">
              <motion.span
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: wordIndex * 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
                className={word === "AI" ? "text-gradient neon-glow-text" : ""}
              >
                {word}
              </motion.span>
            </div>
          ))}
        </h1>

        {/* Typing Description */}
        <div className="h-24 max-w-2xl mx-auto relative flex justify-center items-start pt-4">
          <motion.p
            key={descIndex}
            initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground absolute w-full font-light"
          >
            {DESCRIPTIONS[descIndex]}
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
        >
          <button 
            onClick={onAuthOpen}
            className="group relative w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-medium text-lg overflow-hidden neon-glow transition-all active:scale-95"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 flex items-center gap-2">
              Start Learning Free
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          
          <button className="group w-full sm:w-auto flex items-center justify-center gap-2 neon-border-card text-foreground px-8 py-4 rounded-full font-medium text-lg hover:bg-white/5 transition-all active:scale-95 border border-border/50">
            <Play className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            Watch Demo
          </button>
        </motion.div>
      </motion.div>

      {/* Animated Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        style={{ opacity: indicatorOpacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20"
      >
        <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase">Scroll</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1"
        >
          <motion.div 
            animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FloatingElement({ icon, top, left, right, bottom, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      style={{ top, left, right, bottom }}
      className="absolute"
    >
      <motion.div
        animate={{ 
          y: [0, -20, 0], 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{ duration: 3 + delay * 0.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-xl"
      >
        {icon}
      </motion.div>
    </motion.div>
  );
}
