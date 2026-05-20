"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function IntroScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let playAttempted = false;

    const playSound = async () => {
      if (!audioRef.current || playAttempted) return;
      try {
        audioRef.current.volume = 0.5;
        await audioRef.current.play();
        playAttempted = true;
      } catch (e) {
        console.log("Audio autoplay blocked by browser. Awaiting user interaction...");
      }
    };

    // Try playing immediately
    playSound();

    // If blocked, try playing on any user interaction
    const handleInteraction = () => playSound();
    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for exit animation
    }, 4500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 overflow-hidden"
        >
          {/* A placeholder for a startup sound */}
          <audio ref={audioRef} autoPlay src="https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3" preload="auto" />

          {/* Cinematic Background Lines */}
          <div className="absolute inset-0 opacity-20">
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-1/3 w-[1px] bg-gradient-to-b from-transparent via-primary to-transparent" 
            />
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.2 }}
              className="absolute left-2/3 w-[1px] bg-gradient-to-b from-transparent via-purple-500 to-transparent" 
            />
          </div>

          <div className="relative flex flex-col items-center justify-center">
            {/* Pulsing Outer Rings */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.5, 0], scale: [0.5, 2, 3] }}
              transition={{ duration: 3, ease: "easeOut", times: [0, 0.4, 1] }}
              className="absolute w-64 h-64 border-[1px] border-primary/40 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.3, 0], scale: [0.5, 1.5, 2.5] }}
              transition={{ duration: 3, delay: 0.2, ease: "easeOut", times: [0, 0.4, 1] }}
              className="absolute w-80 h-80 border-[1px] border-purple-500/30 rounded-full"
            />

            {/* Glowing Core */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.8, 0.4], scale: [0.5, 1.2, 1] }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="absolute z-0 w-32 h-32 bg-primary/40 blur-[60px] rounded-full"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1],
                delay: 0.5
              }}
              className="z-10 flex items-center gap-2"
            >
              <div className="text-5xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
                Code
              </div>
              <div className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary via-purple-500 to-pink-500 drop-shadow-2xl">
                Quest
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              transition={{ delay: 1.5, duration: 1, ease: "easeInOut" }}
              className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent mt-6 max-w-xs z-10"
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="mt-6 flex gap-4 text-zinc-400 tracking-[0.3em] text-xs md:text-sm font-medium uppercase z-10"
            >
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}>Learn</motion.span>
              <span>&bull;</span>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}>Play</motion.span>
              <span>&bull;</span>
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2, delay: 0.6 }}>Master</motion.span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
