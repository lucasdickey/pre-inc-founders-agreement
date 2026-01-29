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
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-stripe-slate mb-6">
          Pre-Incorporation
          <br />
          Founders Agreement
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Align with your co-founders before you incorporate. Our conversational
          tool helps you work through equity, roles, and key decisions together.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="/agreement/new" className="btn-primary inline-block">
            Start New Agreement
          </a>
          <button
            onClick={() => setShowJoin(!showJoin)}
            className="btn-secondary"
          >
            Join Existing Agreement
          </button>
        </div>

        {showJoin && (
          <form
            onSubmit={handleJoin}
            className="mt-6 flex gap-2 justify-center max-w-xs mx-auto"
          >
            <input
              type="text"
              placeholder="Enter code (e.g., ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              maxLength={8}
            />
            <button type="submit" className="btn-primary px-4 py-2">
              Join
            </button>
          </form>
        )}
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="w-12 h-12 bg-stripe-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-stripe-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">1. Guided Interview</h3>
          <p className="text-gray-600 text-sm">
            Our AI walks each founder through key questions about equity, roles,
            and expectations.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-stripe-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-stripe-purple"
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
          <h3 className="font-semibold text-lg mb-2">2. Async Collaboration</h3>
          <p className="text-gray-600 text-sm">
            Share a code with co-founders. Each person completes their interview
            on their own time.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-stripe-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-stripe-purple"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">3. Export & Incorporate</h3>
          <p className="text-gray-600 text-sm">
            Download your agreement as a document. When ready, import directly
            into Atlas.
          </p>
        </div>
      </div>

      {/* Topics covered */}
      <div className="card">
        <h2 className="text-2xl font-bold text-stripe-slate mb-6 text-center">
          What We&apos;ll Cover
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Equity Split & Vesting</h4>
              <p className="text-sm text-gray-600">
                Who owns what percentage, vesting schedules, cliff periods
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">IP & Contributions</h4>
              <p className="text-sm text-gray-600">
                Pre-existing IP, capital invested, sweat equity
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Decision Making</h4>
              <p className="text-sm text-gray-600">
                Voting rights, key decisions, deadlock resolution
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Exit Scenarios</h4>
              <p className="text-sm text-gray-600">
                What happens if a founder leaves or the company is sold
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-sm text-gray-500 mt-12">
        This tool provides a framework for founder discussions. It is not legal
        advice.
        <br />
        Please consult an attorney before finalizing any agreements.
      </p>
    </div>
  );
}
