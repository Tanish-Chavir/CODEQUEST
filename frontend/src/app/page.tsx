"use client";

import { useState } from "react";
import { IntroScreen } from "@/components/IntroScreen";
import { LandingPage } from "@/components/LandingPage";

export default function Home() {
  const [introFinished, setIntroFinished] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {!introFinished && <IntroScreen onComplete={() => setIntroFinished(true)} />}
      
      {/* Once intro finishes or while it fades out, the landing page is present in the DOM */}
      <div
        className={`transition-opacity duration-1000 ${
          introFinished ? "opacity-100" : "opacity-0 overflow-hidden h-screen"
        }`}
      >
        <LandingPage />
      </div>
    </main>
  );
}
