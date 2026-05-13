"use client";

import { useRef, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Code2, Sparkles, Layout } from "lucide-react";

export function ScrollWalletAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  // --- Interactive Mouse Parallax ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 40; 
      const y = (e.clientY - innerHeight / 2) / 40;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);


  // --- Folder 3D Rotation & Scaling ---
  const folderRotateX = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [40, 15, -10, -30]);
  const folderRotateY = useTransform(smoothProgress, [0, 1], [-20, 20]);
  const folderRotateZ = useTransform(smoothProgress, [0, 1], [-5, 5]);
  const folderScale = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0.5, 0.75, 0.75, 0.5]); // Scaled down even more
  const folderOpacity = useTransform(smoothProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  // --- Cards Animation Logic (Cycling + 360 Spin) ---
  // The folder is positioned near the BOTTOM of the screen (`justify-end pb-32`)
  // so the cards have massive space to fly UP without hitting the navbar.
  
  // Card 1
  const card1Y = useTransform(smoothProgress, [0.05, 0.15, 0.3, 0.4], [50, -180, -180, -500]);
  const card1RotateY = useTransform(smoothProgress, [0.05, 0.15, 0.3, 0.4], [360, 0, 0, 0]); // Horizontal 360 degree spin!
  const card1Opacity = useTransform(smoothProgress, [0.05, 0.15, 0.3, 0.4], [0, 1, 1, 0]);
  const card1Scale = useTransform(smoothProgress, [0.05, 0.15, 0.3, 0.4], [0.5, 0.85, 0.85, 0.6]);

  // Card 2
  const card2Y = useTransform(smoothProgress, [0.3, 0.45, 0.6, 0.7], [50, -180, -180, -500]);
  const card2RotateY = useTransform(smoothProgress, [0.3, 0.45, 0.6, 0.7], [360, 0, 0, 0]); // Horizontal 360 degree spin!
  const card2Opacity = useTransform(smoothProgress, [0.3, 0.45, 0.6, 0.7], [0, 1, 1, 0]);
  const card2Scale = useTransform(smoothProgress, [0.3, 0.45, 0.6, 0.7], [0.5, 0.85, 0.85, 0.6]);

  // Card 3
  const card3Y = useTransform(smoothProgress, [0.6, 0.75, 0.9, 1], [50, -180, -180, -500]);
  const card3RotateY = useTransform(smoothProgress, [0.6, 0.75, 0.9, 1], [360, 0, 0, 0]); // Horizontal 360 degree spin!
  const card3Opacity = useTransform(smoothProgress, [0.6, 0.75, 0.9, 1], [0, 1, 1, 0]);
  const card3Scale = useTransform(smoothProgress, [0.6, 0.75, 0.9, 1], [0.5, 0.85, 0.85, 0.6]);

  return (
    <section 
      ref={containerRef} 
      className="relative h-[600vh] w-full"
    >
      {/* Positioned explicitly at the bottom of the screen to give cards max space up top */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-end pb-12 sm:pb-24 perspective-[2000px]">
        
        {/* Ambient Lighting */}
        <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] pointer-events-none z-0" />
        <motion.div 
          className="absolute bottom-[20%] left-[20%] w-[400px] h-[400px] bg-blue-500/20 rounded-full mix-blend-screen filter blur-[120px] opacity-70 pointer-events-none"
        />

        {/* 3D Scene Container */}
        <motion.div 
          style={{ 
            rotateX: folderRotateX, 
            rotateY: folderRotateY, 
            rotateZ: folderRotateZ,
            scale: folderScale,
            opacity: folderOpacity,
            x: springX,
            y: springY
          }}
          className="relative w-[320px] h-[220px] sm:w-[400px] sm:h-[260px] preserve-3d z-10"
        >
          {/* REAL FOLDER SHAPE - BACK PANEL */}
          <div className="absolute inset-0 transform translate-z-[-30px] preserve-3d">
             {/* The Folder Tab */}
             <div className="absolute bottom-[100%] left-0 w-32 h-10 rounded-t-2xl glass-card bg-blue-600/20 border-t border-x border-blue-400/30 backdrop-blur-xl flex items-center px-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                <span className="text-[10px] font-bold text-blue-200/70 tracking-widest uppercase">Quests</span>
             </div>
             {/* The Main Back Panel */}
             <div className="absolute inset-0 rounded-b-3xl rounded-tr-3xl glass-card bg-gradient-to-br from-blue-600/30 via-blue-900/40 to-black/50 border border-blue-400/20 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 rounded-inherit" />
             </div>
          </div>
          
          {/* CARDS CONTAINER */}
          <div className="absolute inset-x-0 top-0 bottom-4 perspective-[1500px] pointer-events-none preserve-3d">
            
            {/* CARD 1 */}
            <motion.div 
              style={{ y: card1Y, opacity: card1Opacity, scale: card1Scale, rotateY: card1RotateY }}
              className="absolute w-full h-[240px] left-0 bottom-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-600/20 backdrop-blur-3xl border border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-6 text-center transform-gpu z-10 pointer-events-auto cursor-pointer"
              whileHover={{ scale: 1.15, rotateX: 10, z: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4 neon-border-card shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                <Code2 className="w-7 h-7 text-purple-200" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Interactive Code</h3>
              <p className="text-sm text-white/80 font-medium leading-relaxed">Turn passive videos into active coding environments instantly.</p>
            </motion.div>

            {/* CARD 2 */}
            <motion.div 
              style={{ y: card2Y, opacity: card2Opacity, scale: card2Scale, rotateY: card2RotateY }}
              className="absolute w-full h-[240px] left-0 bottom-0 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-600/20 backdrop-blur-3xl border border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-6 text-center transform-gpu z-20 pointer-events-auto cursor-pointer"
              whileHover={{ scale: 1.15, rotateX: 10, z: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4 neon-border-card shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                <Sparkles className="w-7 h-7 text-cyan-200" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">AI Generation</h3>
              <p className="text-sm text-white/80 font-medium leading-relaxed">Generate custom quizzes and code challenges dynamically.</p>
            </motion.div>

            {/* CARD 3 */}
            <motion.div 
              style={{ y: card3Y, opacity: card3Opacity, scale: card3Scale, rotateY: card3RotateY }}
              className="absolute w-full h-[240px] left-0 bottom-0 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-600/20 backdrop-blur-3xl border border-white/30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-6 text-center transform-gpu z-30 pointer-events-auto cursor-pointer"
              whileHover={{ scale: 1.15, rotateX: 10, z: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-4 neon-border-card shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                <Layout className="w-7 h-7 text-orange-200" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Gamified Quests</h3>
              <p className="text-sm text-white/80 font-medium leading-relaxed">Earn XP, unlock themes, and climb the global leaderboard.</p>
            </motion.div>

          </div>

          {/* REAL FOLDER SHAPE - FRONT PANEL */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 rounded-b-3xl glass-card bg-gradient-to-br from-blue-400/20 via-blue-600/20 to-black/40 border-t border-x border-blue-300/30 backdrop-blur-[40px] shadow-[0_-5px_30px_rgba(0,0,0,0.3)] transform translate-z-[30px] flex items-end p-6">
             <div className="w-full flex justify-between items-center opacity-90">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400/80 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />
                  <div className="w-3 h-3 rounded-full bg-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold tracking-[0.2em] text-white/90 uppercase">Engine</span>
                  <span className="text-[10px] font-medium tracking-widest text-cyan-400/90 uppercase mt-1">Ready</span>
                </div>
             </div>
             
             {/* Glossy Reflection */}
             <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-xl pointer-events-none" />
             <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-60" />
          </div>
          
        </motion.div>

        {/* Floating text to guide user */}
        <motion.div 
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: false, amount: 0.8 }}
           className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none z-20"
        >
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center"
          >
            <p className="text-[10px] text-primary/70 font-bold tracking-[0.4em] uppercase mb-3 glow-text">Scroll</p>
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
