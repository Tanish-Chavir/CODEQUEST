"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "rect" | "circle" | "text";
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  let shapeClass = "rounded-2xl";
  if (variant === "circle") shapeClass = "rounded-full animate-pulse";
  if (variant === "text") shapeClass = "rounded-lg h-3 w-3/4 animate-pulse";

  return (
    <div 
      className={`bg-neutral-900 border border-white/5 relative overflow-hidden shrink-0 select-none ${shapeClass} ${className}`}
    >
      {/* Wave shimmer reflection overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border p-5 rounded-3xl flex flex-col gap-3 shadow-xl">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-1.5">
          <Skeleton variant="text" className="w-1/2 h-3" />
          <Skeleton variant="text" className="w-1/3 h-2" />
        </div>
      </div>
      <Skeleton className="w-full h-16 rounded-xl mt-1" />
      <div className="flex justify-between items-center mt-1">
        <Skeleton variant="text" className="w-1/4 h-2.5" />
        <Skeleton className="w-16 h-6 rounded-lg" />
      </div>
    </div>
  );
}

export function RosterSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((idx) => (
        <div key={idx} className="p-4 bg-secondary/10 border border-border/50 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton variant="circle" className="w-9 h-9" />
            <div className="space-y-1.5 flex-1 max-w-xs">
              <Skeleton variant="text" className="w-3/4 h-3.5" />
              <Skeleton variant="text" className="w-1/2 h-2.5" />
            </div>
          </div>
          <Skeleton className="w-20 h-6 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
