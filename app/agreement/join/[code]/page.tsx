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
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4" />
          <div className="h-4 bg-gray-100 rounded w-full mb-2" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (error && !agreement) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Agreement Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            No agreement exists with code <strong>{code}</strong>. Please check
            the code and try again.
          </p>
          <a href="/" className="btn-primary inline-block">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-stripe-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-stripe-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stripe-slate mb-2">
            Join Founders Agreement
          </h1>
          <p className="text-gray-600">
            You&apos;ve been invited to join the founders agreement for:
          </p>
          <p className="text-xl font-semibold text-stripe-purple mt-2">
            {agreement.companyName}
          </p>
        </div>

        {/* Current founders */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Current founders:</p>
          <div className="flex flex-wrap gap-2">
            {agreement.founders.map((founder) => (
              <span
                key={founder.id}
                className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm border"
              >
                <span className="w-5 h-5 rounded-full bg-stripe-purple text-white text-xs flex items-center justify-center">
                  {founder.name.charAt(0)}
                </span>
                {founder.name}
              </span>
            ))}
          </div>
        </div>

        {agreement.founders.length >= 4 ? (
          <div className="text-center text-amber-600 bg-amber-50 p-4 rounded-lg">
            This agreement already has the maximum number of founders (4).
          </div>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="founderName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Name *
              </label>
              <input
                id="founderName"
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-stripe-purple"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label
                htmlFor="founderEmail"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Email *
              </label>
              <input
                id="founderEmail"
                type="email"
                value={founderEmail}
                onChange={(e) => setFounderEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-stripe-purple"
                placeholder="co-founder@example.com"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isJoining || !founderName || !founderEmail}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? "Joining..." : "Join & Start Interview"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
