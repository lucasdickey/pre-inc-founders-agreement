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
    <div>
      {/* Dark Atlas hero */}
      <div className="atlas-hero relative overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-6 py-20 text-center">
          <p className="text-stripe-purple-light text-sm font-medium tracking-wide uppercase mb-4">
            Stripe Atlas
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight tracking-tight">
            Pre-Incorporation
            <br />
            Founders Agreement
          </h1>
          <p className="text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed">
            Align with your co-founders before you incorporate. Work through
            equity, roles, and key decisions with our guided interview.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/agreement/new"
              className="inline-flex items-center justify-center bg-stripe-purple hover:bg-stripe-purple-dark text-white px-6 py-3 rounded-md font-medium text-sm transition-all shadow-lg hover:shadow-xl"
            >
              Start New Agreement
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
            <button
              onClick={() => setShowJoin(!showJoin)}
              className="inline-flex items-center justify-center bg-white/10 hover:bg-white/15 text-white border border-white/20 px-6 py-3 rounded-md font-medium text-sm transition-all backdrop-blur-sm"
            >
              Join Existing Agreement
            </button>
          </div>

          {showJoin && (
            <form
              onSubmit={handleJoin}
              className="mt-8 flex gap-2 justify-center max-w-xs mx-auto"
            >
              <input
                type="text"
                placeholder="Enter code (e.g., ABC123)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-stripe-purple focus:bg-white/15"
                maxLength={8}
              />
              <button
                type="submit"
                className="bg-stripe-purple hover:bg-stripe-purple-dark text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-4xl mx-auto px-6 -mt-6">
        <div className="grid md:grid-cols-3 gap-5">
          <div className="card text-center">
            <div className="w-10 h-10 bg-stripe-purple/8 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-5 h-5 text-stripe-purple"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <div className="text-xs font-semibold text-stripe-purple uppercase tracking-wider mb-2">
              Step 1
            </div>
            <h3 className="font-semibold text-stripe-slate mb-1.5">
              Guided Interview
            </h3>
            <p className="text-stripe-gray-500 text-sm leading-relaxed">
              Our AI walks each founder through key questions about equity,
              roles, and expectations.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-10 h-10 bg-stripe-purple/8 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-5 h-5 text-stripe-purple"
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
            <div className="text-xs font-semibold text-stripe-purple uppercase tracking-wider mb-2">
              Step 2
            </div>
            <h3 className="font-semibold text-stripe-slate mb-1.5">
              Async Collaboration
            </h3>
            <p className="text-stripe-gray-500 text-sm leading-relaxed">
              Share a code with co-founders. Each person completes their
              interview on their own time.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-10 h-10 bg-stripe-purple/8 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-5 h-5 text-stripe-purple"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="text-xs font-semibold text-stripe-purple uppercase tracking-wider mb-2">
              Step 3
            </div>
            <h3 className="font-semibold text-stripe-slate mb-1.5">
              Export &amp; Incorporate
            </h3>
            <p className="text-stripe-gray-500 text-sm leading-relaxed">
              Download your agreement as a document. When ready, import directly
              into Atlas.
            </p>
          </div>
        </div>
      </div>

      {/* Topics covered */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="card">
          <h2 className="text-lg font-semibold text-stripe-slate mb-5">
            What we&apos;ll cover
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              {
                title: "Equity Split & Vesting",
                desc: "Who owns what percentage, vesting schedules, cliff periods",
              },
              {
                title: "IP & Contributions",
                desc: "Pre-existing IP, capital invested, sweat equity",
              },
              {
                title: "Decision Making",
                desc: "Voting rights, key decisions, deadlock resolution",
              },
              {
                title: "Exit Scenarios",
                desc: "What happens if a founder leaves or the company is sold",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-stripe-green/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-stripe-green"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-stripe-slate">
                    {item.title}
                  </h4>
                  <p className="text-sm text-stripe-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-stripe-gray-500 mt-8">
          This tool provides a framework for founder discussions. It is not legal
          advice.
          <br />
          Please consult an attorney before finalizing any agreements.
        </p>
      </div>
    </div>
  );
}
