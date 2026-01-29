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
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="card">
        <h1 className="text-2xl font-bold text-stripe-slate mb-2">
          Start Your Agreement
        </h1>
        <p className="text-gray-600 mb-6">
          Enter your details to begin. You&apos;ll be able to invite co-founders
          afterward.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Jane Smith"
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
              placeholder="founder@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="companyName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Company Name (working title is fine)
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-stripe-purple"
              placeholder="Acme Inc"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !founderName || !founderEmail}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creating..." : "Start Interview"}
          </button>
        </form>
      </div>
    </div>
  );
}
