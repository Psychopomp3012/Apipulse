"use client";

import Link from "next/link";
import { ArrowRight, Code2, Database, Zap } from "lucide-react";
import { useState } from "react";

const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const multiplier = 15; 
    const xRot = ((y / rect.height) - 0.5) * -multiplier;
    const yRot = ((x / rect.width) - 0.5) * multiplier;
    
    setTilt({ x: xRot, y: yRot });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: isHovering 
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovering ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      className={className}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary/5"
    >
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 hidden dark:block opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.15), transparent 40%)`
        }}
      />
      <div className="relative z-10 max-w-4xl px-4 text-center pt-24">
        <div className="inline-block p-1 px-3 mb-6 rounded-full glass text-sm font-medium text-primary animate-pulse">
          Introducing ApiPulse 1.0
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          A Complete Suite of <br />
          <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#3b82f6,45%,#fff,55%,#8b5cf6)] animate-shimmer">
            Powerful APIs
          </span>
        </h1>
        <p className="text-xl text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Access a robust collection of APIs to supercharge your applications. Sign up, get your API key, and integrate powerful features in minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/docs"
            className="relative rounded-full p-[2px] transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-gradient-to-br from-blue-400 via-blue-200 to-indigo-400 dark:from-slate-500 dark:via-slate-200 dark:to-slate-600"
          >
            <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-full text-lg font-bold w-full h-full relative z-10">
              Read Documentation <ArrowRight className="h-5 w-5" />
            </div>
          </Link>
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 glass hover:bg-white/20 dark:hover:bg-black/30 px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 active:scale-95"
          >
            View Pricing
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 px-4 pb-20 w-full">
        {[
          { icon: <Zap className="h-6 w-6 text-yellow-500" />, title: "Fast & Reliable", desc: "Optimized endpoints built to deliver data quickly and consistently to your applications." },
          { icon: <Code2 className="h-6 w-6 text-blue-500" />, title: "Developer First", desc: "Stunning and Dev-friendly documentation and easy-to-use SDKs." },
          { icon: <Database className="h-6 w-6 text-purple-500" />, title: "Detailed Analytics", desc: "Track your API requests, monitor usage limits, and get insights into your integration performance." }
        ].map((feature, i) => (
          <TiltCard key={i} className="glass p-8 rounded-3xl z-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-6">
              {feature.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
          </TiltCard>
        ))}
      </div>
    </div>
  );
}
