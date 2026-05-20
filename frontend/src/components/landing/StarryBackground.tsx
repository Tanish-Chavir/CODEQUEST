"use client";

import { useEffect, useState } from "react";
import { motion, MotionValue, useTransform } from "framer-motion";

interface StarryBackgroundProps {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}

export function StarryBackground({ mouseX, mouseY }: StarryBackgroundProps) {
  const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate random stars on client side to avoid hydration mismatches
    const generatedStars = Array.from({ length: 50 }).map((_, i) => {
      const duration = Math.random() * 20 + 20; // 20s to 40s
      return {
        id: i,
        x: Math.random() * 100, // percentage
        y: Math.random() * 100, // percentage
        size: Math.random() * 2 + 1, // 1px to 3px
        duration,
        delay: -Math.random() * duration, // Start at different times
      };
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    setStars(generatedStars);
  }, []);

  // Map mouse movement to slight parallax shift
  const xShift = useTransform(mouseX, [-50, 50], [10, -10]);
  const yShift = useTransform(mouseY, [-50, 50], [10, -10]);

  return (
    <motion.div 
      style={{ x: xShift, y: yShift }} 
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.4)]"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: 0.6,
          }}
          animate={{
            y: ["0%", "-2000%"], // Move upwards
            opacity: [0, 0.8, 0], // Glow softly and fade
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "linear",
            delay: star.delay,
          }}
        />
      ))}
    </motion.div>
  );
}
