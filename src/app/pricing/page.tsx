"use client";

import { Check } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PricingCard = ({ plan, isLoggedIn, router }: any) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setPosition({ x, y });

    const multiplier = 15;
    const xRot = ((y / rect.height) - 0.5) * -multiplier;
    const yRot = ((x / rect.width) - 0.5) * multiplier;
    setTilt({ x: xRot, y: yRot });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => { setIsFocused(false); setTilt({ x: 0, y: 0 }); }}
      style={{
        transform: isFocused
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${plan.popular ? '1.05' : '1.02'}, ${plan.popular ? '1.05' : '1.02'}, 1.02)`
          : `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(${plan.popular ? '1.05' : '1'}, ${plan.popular ? '1.05' : '1'}, 1)`,
        transition: isFocused ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out'
      }}
      className={`group relative flex flex-col rounded-3xl ${plan.popular ? 'p-[2px] shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:shadow-[0_0_30px_rgba(59,130,246,0.3)] z-10 bg-gradient-to-br from-gray-300 via-gray-50 to-gray-400 dark:from-slate-500 dark:via-slate-200 dark:to-slate-600' : 'glass p-8 border border-gray-200 dark:border-white/20 dark:bg-zinc-800/80 shadow-xl hover:border-gray-300 dark:hover:border-white/40 dark:hover:bg-zinc-700/80'}`}
    >

      {!plan.popular && (
        <div
          className={`pointer-events-none absolute -inset-px rounded-[inherit] transition-opacity duration-300 hidden dark:block ${isFocused ? 'opacity-100' : 'opacity-0'}`}
          style={{
            background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.15), transparent 40%)`
          }}
        />
      )}

      <div className={`relative z-10 flex flex-col h-full ${plan.popular ? 'bg-white dark:bg-zinc-900/90 backdrop-blur-xl p-8 rounded-[calc(1.5rem-2px)] overflow-hidden' : ''}`}>
        {plan.popular && (
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] overflow-hidden">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-slate-300/50 dark:via-gray-300/50 to-transparent animate-shimmer-slide" />
          </div>
        )}
        {plan.popular && (
          <div
            className={`pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 hidden dark:block ${isFocused ? 'opacity-100' : 'opacity-0'}`}
            style={{
              background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(99,102,241,0.3), transparent 40%)`
            }}
          />
        )}

        {plan.popular && (
          <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-1.5 rounded-full text-xs font-extrabold shadow-lg shadow-blue-500/25 tracking-wider uppercase border border-white/20">
            Most Popular
          </div>
        )}
        <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-transparent bg-clip-text bg-[linear-gradient(110deg,#3b82f6,45%,#fff,55%,#8b5cf6)] animate-shimmer' : ''}`}>
          {plan.name}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>
        <div className="mb-8">
          <span className="text-5xl font-extrabold">{plan.price}</span>
          {plan.price !== "Custom" && <span className="text-gray-500 dark:text-gray-400">/mo</span>}
        </div>
        <ul className="space-y-4 mb-8">
          {plan.features.map((feature: string, j: number) => (
            <li key={j} className="flex items-center gap-3">
              <Check className={`h-5 w-5 ${plan.popular ? 'text-blue-500' : 'text-primary'}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            if (plan.price === "Custom") {
              router.push("/contact");
            } else if (!isLoggedIn) {
              router.push("/login");
            }
          }}
          className={`w-full py-4 rounded-xl font-bold transition-all duration-300 cursor-pointer select-none ${plan.popular ? 'bg-gradient-to-r from-blue-600/60 to-indigo-600/60 backdrop-blur-md text-white border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_10px_20px_-10px_rgba(59,130,246,0.3)] dark:border-white/30 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_10px_20px_-10px_rgba(59,130,246,0.5)] hover:scale-[1.02] hover:from-blue-600/80 hover:to-indigo-600/80' : 'bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-gray-900 dark:text-white border border-black/5 dark:border-white/20'}`}
        >
          {plan.price === "Custom" ? "Contact Us" : (isLoggedIn ? "Pay" : "Get Started")}
        </button>
      </div>

      {plan.popular && (
        <svg className="pointer-events-none absolute top-[1px] left-[1px] w-[calc(100%-2px)] h-[calc(100%-2px)] z-20">
          <rect
            x="0" y="0"
            width="100%" height="100%"
            rx="23"
            fill="none"
            stroke="rgba(99, 102, 241, 1)"
            strokeWidth="2"
            pathLength="100"
            strokeDasharray="25 75"
            className="animate-svg-beam"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
};

export default function Pricing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("apipulse_token")) {
      setIsLoggedIn(true);
    }
  }, []);

  const plans = [
    { name: "Hobby", price: "$0", desc: "Perfect for testing APIs", features: ["1,000 Credits/mo", "documentation"] },
    { name: "Pro", price: "$29", desc: "For serious developers", features: ["100,000 Credits/mo", "Custom domain", "Advanced analytics", "Priority support"], popular: true },
    { name: "Enterprise", price: "Custom", desc: "For large scale operations", features: ["Custom credit limit"] }
  ];

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-500 dark:text-gray-400">Choose the plan that best fits your needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 items-start">
        {plans.map((plan, i) => (
          <PricingCard key={i} plan={plan} isLoggedIn={isLoggedIn} router={router} />
        ))}
      </div>
    </div>
  );
}
