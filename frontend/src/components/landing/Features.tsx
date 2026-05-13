"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Play, ShieldCheck, Code, Trophy } from "lucide-react";

const features = [
  {
    icon: <Play className="w-6 h-6 text-blue-400" />,
    title: "Smart Video Player",
    description: "Paste a YouTube link and we instantly generate a structured course timeline.",
    colSpan: "md:col-span-2"
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
    title: "Timeline Quizzes",
    description: "Popups appear at crucial moments to test your knowledge while you watch.",
    colSpan: "md:col-span-1"
  },
  {
    icon: <Code className="w-6 h-6 text-orange-400" />,
    title: "Coding Games",
    description: "Unlock mini-games, bug fixes, and output prediction tasks after lessons.",
    colSpan: "md:col-span-1"
  },
  {
    icon: <Trophy className="w-6 h-6 text-yellow-400" />,
    title: "Reward System",
    description: "Earn XP, badges, and coins to unlock premium avatars and unique site themes.",
    colSpan: "md:col-span-2"
  }
];

export function Features() {
  return (
    <section id="features" className="py-32 px-6 relative z-20">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center md:text-left md:flex justify-between items-end gap-8"
        >
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Everything you need to <span className="text-gradient">master code</span>
            </h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed">
              We've engineered an interactive learning ecosystem designed for maximum retention. From passive watching to active problem solving in seconds.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 perspective-[1000px]">
          {features.map((feature, index) => (
            <TiltCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TiltCard({ feature, index }: { feature: any, index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Dynamic 3D shadow opposite to tilt direction
  const shadowX = useTransform(mouseXSpring, [-0.5, 0.5], ["30px", "-30px"]);
  const shadowY = useTransform(mouseYSpring, [-0.5, 0.5], ["30px", "-30px"]);

  // Dynamic Glare tracking mouse position
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.15) 0%, transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`glass-card rounded-[2rem] flex flex-col justify-between group relative ${feature.colSpan}`}
    >
      {/* 3D Physical Shadow plane floating behind the card */}
      <motion.div 
        className="absolute inset-2 bg-black/50 blur-3xl rounded-[2rem] pointer-events-none"
        style={{ x: shadowX, y: shadowY, transform: "translateZ(-40px)" }}
      />
      
      {/* Dynamic Glare Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-[2rem] z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: glareBackground }}
      />

      <div 
        style={{ transform: "translateZ(40px)", transformStyle: "preserve-3d" }} 
        className="p-8 md:p-10 h-full w-full flex flex-col justify-between relative z-20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/10 transition-colors duration-500 pointer-events-none" />
        
        <div 
          style={{ transform: "translateZ(20px)" }}
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:bg-white/10 transition-all duration-300 shadow-xl"
        >
          {feature.icon}
        </div>
        
        <div style={{ transform: "translateZ(30px)" }}>
          <h3 className="text-2xl font-semibold mb-3 text-foreground">{feature.title}</h3>
          <p className="text-muted-foreground leading-relaxed font-light text-lg">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
