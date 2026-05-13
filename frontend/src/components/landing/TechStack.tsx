"use client";

import { motion } from "framer-motion";
import { Terminal, Database, Cloud, Cpu, Layout, Layers } from "lucide-react";

const TECHNOLOGIES = [
  { name: "React & Next.js", icon: <Layout className="w-8 h-8 text-cyan-400" />, delay: 0 },
  { name: "AI & Machine Learning", icon: <Cpu className="w-8 h-8 text-purple-400" />, delay: 0.1 },
  { name: "System Architecture", icon: <Layers className="w-8 h-8 text-blue-500" />, delay: 0.2 },
  { name: "Database Design", icon: <Database className="w-8 h-8 text-emerald-400" />, delay: 0.3 },
  { name: "Cloud Deployment", icon: <Cloud className="w-8 h-8 text-pink-400" />, delay: 0.4 },
  { name: "Advanced Algorithms", icon: <Terminal className="w-8 h-8 text-orange-400" />, delay: 0.5 },
];

export function TechStack() {
  return (
    <section className="py-24 px-6 relative z-20">
      <div className="max-w-6xl mx-auto text-center">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-16"
        >
          Master the Modern <span className="text-gradient">Stack</span>
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-6">
          {TECHNOLOGIES.map((tech, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: tech.delay }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="neon-border-card flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/5"
            >
              <div className="p-2 rounded-xl bg-white/5">
                {tech.icon}
              </div>
              <span className="font-medium text-foreground">{tech.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
