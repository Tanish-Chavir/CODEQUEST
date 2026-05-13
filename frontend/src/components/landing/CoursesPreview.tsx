"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { ChevronRight, Star } from "lucide-react";

const COURSES = [
  {
    title: "Advanced React Patterns",
    category: "Frontend",
    image: "bg-gradient-to-br from-blue-600 to-cyan-400",
    rating: 4.9,
    students: "12k+"
  },
  {
    title: "AI Integration Masterclass",
    category: "Fullstack",
    image: "bg-gradient-to-br from-purple-600 to-pink-500",
    rating: 4.8,
    students: "8k+"
  },
  {
    title: "Algorithms & Data Structures",
    category: "Computer Science",
    image: "bg-gradient-to-br from-emerald-500 to-teal-400",
    rating: 4.9,
    students: "20k+"
  }
];

export function CoursesPreview() {
  return (
    <section className="py-24 px-6 relative z-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Trending <span className="text-gradient">Quests</span></h2>
            <p className="text-muted-foreground text-lg">Jump into our most popular interactive modules.</p>
          </div>
          <button className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-[1000px]">
          {COURSES.map((course, index) => (
            <TiltCourseCard key={index} course={course} index={index} />
          ))}
        </div>
        
        <button className="md:hidden w-full mt-8 flex items-center justify-center gap-2 glass-card py-4 rounded-xl text-foreground font-medium">
          View All Quests <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}

function TiltCourseCard({ course, index }: { course: any, index: number }) {
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
      className="group relative rounded-3xl glass-card overflow-hidden cursor-pointer"
    >
      {/* 3D Physical Shadow plane floating behind the card */}
      <motion.div 
        className="absolute inset-2 bg-black/50 blur-3xl rounded-3xl pointer-events-none"
        style={{ x: shadowX, y: shadowY, transform: "translateZ(-40px)" }}
      />
      
      {/* Dynamic Glare Overlay */}
      <motion.div 
        className="absolute inset-0 pointer-events-none rounded-3xl z-10 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
        style={{ background: glareBackground }}
      />

      <div 
        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} 
        className="w-full h-full relative z-20"
      >
        {/* Course Image / Gradient Placeholder */}
        <div className={`h-48 w-full ${course.image} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
          {/* Simulated geometric pattern / glow */}
          <motion.div 
            className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/20 blur-2xl rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-muted-foreground uppercase tracking-wider shadow-sm">
              {course.category}
            </span>
            <div className="flex items-center gap-1 text-yellow-400 text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              {course.rating}
            </div>
          </div>
          
          <h3 style={{ transform: "translateZ(20px)" }} className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{course.title}</h3>
          
          <div className="flex justify-between items-center mt-6">
            <span className="text-sm text-muted-foreground">{course.students} students</span>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-md">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
