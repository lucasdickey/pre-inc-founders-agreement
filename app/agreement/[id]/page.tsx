"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Chat from "@/components/Chat";
import FounderStatus from "@/components/FounderStatus";
import ExportPreview from "@/components/ExportPreview";
import type { Agreement } from "@/types/agreement";

export default function AgreementPage() {
  const params = useParams();
  const agreementId = params.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [founderId, setFounderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Get founder ID from session storage
    const storedFounderId = sessionStorage.getItem(`founder_${agreementId}`);
    if (storedFounderId) {
      setFounderId(storedFounderId);
    }

    fetchAgreement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  const fetchAgreement = async () => {
    try {
      const response = await fetch(`/api/agreement?id=${agreementId}`);
      if (!response.ok) {
        throw new Error("Agreement not found");
      }
      const data = await response.json();
      setAgreement(data.agreement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agreement");
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (agreement?.code) {
      navigator.clipboard.writeText(agreement.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentFounder = agreement?.founders.find((f) => f.id === founderId);
  const allComplete = agreement?.founders.every((f) => f.interviewCompleted);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-5 bg-stripe-border rounded w-1/4 mb-3" />
          <div className="h-3 bg-stripe-gray-50 rounded w-1/3 mb-6" />
          <div className="h-[600px] bg-white rounded-lg border border-stripe-border" />
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="card">
          <h1 className="text-lg font-semibold text-red-600 mb-2">
            Agreement not found
          </h1>
          <p className="text-sm text-stripe-gray-500 mb-5">
            {error || "This agreement doesn't exist or has been removed."}
          </p>
          <a href="/" className="btn-primary inline-block">
            Go home
          </a>
        </div>
      </div>
    );
  }

  if (!founderId || !currentFounder) {
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="card">
          <h1 className="text-lg font-semibold text-stripe-slate mb-2">
            Session expired
          </h1>
          <p className="text-sm text-stripe-gray-500 mb-5">
            Your session for this agreement has expired. Please rejoin using the
            agreement code.
          </p>
          <a
            href={`/agreement/join/${agreement.code}`}
            className="btn-primary inline-block"
          >
            Rejoin agreement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
        <div>
          <h1 className="text-xl font-semibold text-stripe-slate">
            {agreement.companyName}
          </h1>
          <p className="text-sm text-stripe-gray-500">
            Pre-Incorporation Founders Agreement
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-stripe-border rounded-md px-3 py-1.5 flex items-center gap-2">
            <span className="text-xs text-stripe-gray-500">Join code:</span>
            <span className="font-mono text-sm font-semibold text-stripe-purple">
              {agreement.code}
            </span>
            <button
              onClick={copyJoinCode}
              className="text-stripe-gray-500 hover:text-stripe-purple transition-colors ml-1"
              title="Copy code"
            >
              {copied ? (
                <svg
                  className="w-3.5 h-3.5 text-stripe-green"
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
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>

          {allComplete && (
            <button
              onClick={() => setShowExport(!showExport)}
              className="btn-primary"
            >
              {showExport ? "Back to chat" : "View export"}
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-5">
        {/* Main content */}
        <div>
          {showExport && allComplete ? (
            <ExportPreview agreementId={agreementId} />
          ) : currentFounder.interviewCompleted ? (
            <div className="card text-center py-12">
              <div className="w-12 h-12 bg-stripe-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-stripe-green"
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
              <h2 className="text-lg font-semibold text-stripe-slate mb-2">
                Your interview is complete
              </h2>
              <p className="text-sm text-stripe-gray-500 mb-6">
                {allComplete
                  ? "All founders have completed their interviews. You can now export your agreement."
                  : "Waiting for other founders to complete their interviews."}
              </p>
              {allComplete && (
                <button
                  onClick={() => setShowExport(true)}
                  className="btn-primary"
                >
                  View &amp; export agreement
                </button>
              )}
            </div>
          ) : (
            <Chat
              agreementId={agreementId}
              founderId={founderId}
              initialMessages={currentFounder.interviewData?.messages || []}
              currentTopic={currentFounder.interviewData?.currentTopic}
              onComplete={() => {
                fetchAgreement();
              }}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <FounderStatus
            founders={agreement.founders}
            currentFounderId={founderId}
          />

          {agreement.founders.length < 4 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-stripe-slate mb-2">
                Invite co-founders
              </h3>
              <p className="text-xs text-stripe-gray-500 mb-3">
                Share this code with your co-founders so they can join and
                complete their own interview.
              </p>
              <div className="bg-stripe-gray-50 border border-stripe-border rounded-md p-3 text-center">
                <span className="font-mono text-xl font-bold text-stripe-purple">
                  {agreement.code}
                </span>
              </div>
              <p className="text-[11px] text-stripe-gray-500 mt-2 text-center font-mono break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}
                /agreement/join/{agreement.code}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
