"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAgreement() {
  const router = useRouter();
  const [founderName, setFounderName] = useState("");
  const [founderEmail, setFounderEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          founderName,
          founderEmail,
          companyName: companyName || "Untitled Company",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create agreement");
      }

      const data = await response.json();

      // Store founder ID in session storage
      sessionStorage.setItem(
        `founder_${data.agreement.id}`,
        data.founderId
      );

      // Redirect to agreement page
      router.push(`/agreement/${data.agreement.id}`);
    } catch {
      setError("Failed to create agreement. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-12">
      <div className="mb-6">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-stripe-gray-500 hover:text-stripe-slate transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </a>
      </div>

      <div className="card">
        <h1 className="text-xl font-semibold text-stripe-slate mb-1">
          Start your agreement
        </h1>
        <p className="text-sm text-stripe-gray-500 mb-6">
          Enter your details to begin. You&apos;ll be able to invite co-founders
          afterward.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Jane Smith"
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
              placeholder="founder@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-stripe-gray-700 mb-1.5"
            >
              Company name
              <span className="text-stripe-gray-500 font-normal ml-1">
                (working title is fine)
              </span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="input-stripe"
              placeholder="Acme Inc"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !founderName || !founderEmail}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Start interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
