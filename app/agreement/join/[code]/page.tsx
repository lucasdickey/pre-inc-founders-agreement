"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Agreement } from "@/types/agreement";

export default function JoinAgreement() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [founderName, setFounderName] = useState("");
  const [founderEmail, setFounderEmail] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchAgreement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const fetchAgreement = async () => {
    try {
      const response = await fetch(`/api/agreement?code=${code}`);
      if (!response.ok) {
        throw new Error("Agreement not found");
      }
      const data = await response.json();
      setAgreement(data.agreement);

      // Check if this user already exists in the agreement
      const existingFounderId = sessionStorage.getItem(
        `founder_${data.agreement.id}`
      );
      if (existingFounderId) {
        const existingFounder = data.agreement.founders.find(
          (f: { id: string }) => f.id === existingFounderId
        );
        if (existingFounder) {
          // Redirect to agreement page
          router.push(`/agreement/${data.agreement.id}`);
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find agreement");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreement) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(founderEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if email already exists
    const existingFounder = agreement.founders.find(
      (f) => f.email.toLowerCase() === founderEmail.toLowerCase()
    );
    if (existingFounder) {
      // Store their ID and redirect
      sessionStorage.setItem(`founder_${agreement.id}`, existingFounder.id);
      router.push(`/agreement/${agreement.id}`);
      return;
    }

    // Check if max founders reached
    if (agreement.founders.length >= 4) {
      setError("This agreement already has the maximum number of founders (4).");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch("/api/agreement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementId: agreement.id,
          action: "addFounder",
          founderName,
          founderEmail,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to join agreement");
      }

      const data = await response.json();

      // Store founder ID
      sessionStorage.setItem(`founder_${agreement.id}`, data.founderId);

      // Redirect to agreement page
      router.push(`/agreement/${agreement.id}`);
    } catch {
      setError("Failed to join agreement. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        </div>
        <div className="max-w-md w-full mx-auto px-4">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
            <div className="h-8 bg-white/10 rounded w-2/3 mx-auto mb-4" />
            <div className="h-4 bg-white/5 rounded w-full mb-2" />
            <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="relative min-h-[calc(100vh-60px)] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        </div>
        <div className="max-w-md w-full mx-auto px-4 text-center">
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
            <h1 className="text-xl font-bold text-red-400 mb-2">
              Agreement Not Found
            </h1>
            <p className="text-slate-400 mb-6">
              No agreement exists with code <strong className="text-white">{code}</strong>. Please check the code and try again.
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:scale-105 transition-transform"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="relative min-h-[calc(100vh-60px)] overflow-hidden flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-600/15 blur-[100px]" />

        {/* Fading grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-join" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <radialGradient id="grid-mask-join" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="fade-mask-join">
              <rect width="100%" height="100%" fill="url(#grid-mask-join)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-join)" mask="url(#fade-mask-join)" />
        </svg>
      </div>

      <div className="max-w-md w-full mx-auto px-4 py-12 animate-fade-in">
        <div className="relative p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-600/5 to-transparent" />
          <div className="relative">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Join Founders Agreement
              </h1>
              <p className="text-slate-400">
                You&apos;ve been invited to join:
              </p>
              <p className="text-xl font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mt-1">
                {agreement.companyName}
              </p>
            </div>

            {/* Current founders */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-slate-400 mb-3">Current founders:</p>
              <div className="flex flex-wrap gap-2">
                {agreement.founders.map((founder) => (
                  <span
                    key={founder.id}
                    className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm text-white"
                  >
                    <span className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-xs flex items-center justify-center">
                      {founder.name.charAt(0)}
                    </span>
                    {founder.name}
                  </span>
                ))}
              </div>
            </div>

            {agreement.founders.length >= 4 ? (
              <div className="text-center text-amber-400 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                This agreement already has the maximum number of founders (4).
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-5">
                <div>
                  <label
                    htmlFor="founderName"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    id="founderName"
                    type="text"
                    value={founderName}
                    onChange={(e) => setFounderName(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="founderEmail"
                    className="block text-sm font-medium text-slate-300 mb-2"
                  >
                    Your Email *
                  </label>
                  <input
                    id="founderEmail"
                    type="email"
                    value={founderEmail}
                    onChange={(e) => setFounderEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                    placeholder="co-founder@example.com"
                  />
                </div>

                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isJoining || !founderName || !founderEmail}
                  className="w-full relative px-6 py-4 rounded-xl font-semibold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600" />
                  <span className="relative">{isJoining ? "Joining..." : "Join & Start Interview"}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
