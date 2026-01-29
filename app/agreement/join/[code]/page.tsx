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
      <div className="max-w-md mx-auto px-6 py-16">
        <div className="card animate-pulse">
          <div className="h-5 bg-stripe-border rounded w-2/3 mb-3" />
          <div className="h-3 bg-stripe-gray-50 rounded w-full mb-2" />
          <div className="h-3 bg-stripe-gray-50 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="card">
          <h1 className="text-lg font-semibold text-red-600 mb-2">
            Agreement not found
          </h1>
          <p className="text-sm text-stripe-gray-500 mb-5">
            No agreement exists with code <strong>{code}</strong>. Please check
            the code and try again.
          </p>
          <a href="/" className="btn-primary inline-block">
            Go home
          </a>
        </div>
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="card">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-stripe-purple/8 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-stripe-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-stripe-slate mb-1">
            Join founders agreement
          </h1>
          <p className="text-sm text-stripe-gray-500">
            You&apos;ve been invited to join the founders agreement for:
          </p>
          <p className="text-lg font-semibold text-stripe-purple mt-2">
            {agreement.companyName}
          </p>
        </div>

        {/* Current founders */}
        <div className="bg-stripe-gray-50 border border-stripe-border rounded-md p-4 mb-6">
          <p className="text-xs font-medium text-stripe-gray-500 uppercase tracking-wider mb-2">
            Current founders
          </p>
          <div className="flex flex-wrap gap-2">
            {agreement.founders.map((founder) => (
              <span
                key={founder.id}
                className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md text-sm border border-stripe-border"
              >
                <span className="w-5 h-5 rounded-full bg-stripe-purple text-white text-[10px] font-medium flex items-center justify-center">
                  {founder.name.charAt(0)}
                </span>
                <span className="text-stripe-slate">{founder.name}</span>
              </span>
            ))}
          </div>
        </div>

        {agreement.founders.length >= 4 ? (
          <div className="text-center text-sm text-amber-700 bg-amber-50 border border-amber-100 p-4 rounded-md">
            This agreement already has the maximum number of founders (4).
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label
                htmlFor="founderName"
                className="block text-sm font-medium text-stripe-gray-700 mb-1.5"
              >
                Your name
              </label>
              <input
                id="founderName"
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                required
                className="input-stripe"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="founderEmail"
                className="block text-sm font-medium text-stripe-gray-700 mb-1.5"
              >
                Your email
              </label>
              <input
                id="founderEmail"
                type="email"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                required
                className="input-stripe"
                placeholder="co-founder@example.com"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || !founderName || !founderEmail}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join & start interview"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
