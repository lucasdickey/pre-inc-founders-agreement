"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      router.push(`/agreement/join/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-60px)] overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Animated gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-600/30 to-indigo-600/30 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-600/20 blur-[100px] animate-float-delayed" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 blur-[80px] animate-float-slow" />

        {/* Vercel-style fading grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Grid pattern */}
            <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            {/* Radial fade mask */}
            <radialGradient id="grid-mask" cx="50%" cy="30%" r="60%" fx="50%" fy="30%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="70%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="fade-mask">
              <rect width="100%" height="100%" fill="url(#grid-mask)" />
            </mask>
            {/* Glow effect at intersections */}
            <radialGradient id="glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.15)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0)" />
            </radialGradient>
          </defs>
          {/* Main grid with fade */}
          <rect width="100%" height="100%" fill="url(#grid)" mask="url(#fade-mask)" />
          {/* Accent glow spots */}
          <circle cx="30%" cy="25%" r="200" fill="url(#glow)" className="animate-pulse" style={{ animationDuration: '4s' }} />
          <circle cx="70%" cy="60%" r="150" fill="url(#glow)" className="animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </svg>

        {/* Horizontal fade lines - Vercel style */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-[20%] left-0 right-0 h-px opacity-20"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.5) 20%, rgba(139,92,246,0.5) 80%, transparent 100%)'
            }}
          />
          <div
            className="absolute top-[60%] left-0 right-0 h-px opacity-10"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(6,182,212,0.5) 30%, rgba(6,182,212,0.5) 70%, transparent 100%)'
            }}
          />
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-4 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-300">Now available in Stripe Atlas</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            <span className="text-white">Pre-Incorporation</span>
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
              Founders Agreement
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 animate-fade-in-delay-1">
            Align with your co-founders before you incorporate. Work through equity,
            roles, and key decisions—together.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay-2">
            <a
              href="/agreement/new"
              className="group relative px-8 py-4 rounded-full font-semibold text-white overflow-hidden transition-transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative">Start New Agreement</span>
            </a>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="px-8 py-4 rounded-full font-semibold text-white border border-white/20 hover:bg-white/5 backdrop-blur-sm transition-all"
            >
              Join Existing
            </button>
          </div>

          {showJoin && (
            <form
              onSubmit={handleJoin}
              className="mt-8 flex gap-2 justify-center max-w-sm mx-auto animate-fade-in"
            >
              <input
                type="text"
                placeholder="Enter code (e.g., ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent backdrop-blur-sm"
                maxLength={8}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-xl hover:bg-slate-100 transition-colors"
              >
                Join
              </button>
            </form>
          )}
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              step: "01",
              title: "Guided Interview",
              description: "AI walks each founder through key questions about equity, roles, and expectations.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              )
            },
            {
              step: "02",
              title: "Async Collaboration",
              description: "Share a link with co-founders. Each person completes their interview on their own time.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              )
            },
            {
              step: "03",
              title: "Export & Incorporate",
              description: "Download your agreement. When ready, import directly into Atlas.",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )
            }
          ].map((item, i) => (
            <div
              key={item.step}
              className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="absolute top-6 right-6 text-4xl font-bold text-white/5 group-hover:text-white/10 transition-colors">
                {item.step}
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Topics covered */}
        <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/5 to-transparent" />
          <div className="relative">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">
              What We&apos;ll Cover
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { title: "Equity Split & Vesting", desc: "Who owns what, vesting schedules, cliff periods" },
                { title: "IP & Contributions", desc: "Pre-existing IP, capital invested, sweat equity" },
                { title: "Decision Making", desc: "Voting rights, key decisions, deadlock resolution" },
                { title: "Exit Scenarios", desc: "What happens if a founder leaves or company is sold" }
              ].map((topic, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{topic.title}</h4>
                    <p className="text-sm text-slate-400">{topic.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-sm text-slate-500 mt-12">
          This tool provides a framework for founder discussions. Not legal advice.
          <br />
          Please consult an attorney before finalizing agreements.
        </p>
      </div>
    </div>
  );
}
