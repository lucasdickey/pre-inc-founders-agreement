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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-[600px] bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !agreement) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <h1 className="text-xl font-bold text-red-600 mb-2">
            Agreement Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "This agreement doesn't exist or has been removed."}
          </p>
          <a href="/" className="btn-primary inline-block">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  if (!founderId || !currentFounder) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card">
          <h1 className="text-xl font-bold mb-2">Session Expired</h1>
          <p className="text-gray-600 mb-4">
            Your session for this agreement has expired. Please rejoin using the
            agreement code.
          </p>
          <a
            href={`/agreement/join/${agreement.code}`}
            className="btn-primary inline-block"
          >
            Rejoin Agreement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stripe-slate">
            {agreement.companyName}
          </h1>
          <p className="text-gray-600">Pre-Incorporation Founders Agreement</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-gray-600">Join Code:</span>
            <span className="font-mono font-bold text-stripe-purple">
              {agreement.code}
            </span>
            <button
              onClick={copyJoinCode}
              className="text-gray-500 hover:text-stripe-purple"
              title="Copy code"
            >
              {copied ? (
                <svg
                  className="w-4 h-4 text-green-500"
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
                  className="w-4 h-4"
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
              {showExport ? "Back to Chat" : "View Export"}
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        {/* Main content */}
        <div>
          {showExport && allComplete ? (
            <ExportPreview agreementId={agreementId} />
          ) : currentFounder.interviewCompleted ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h2 className="text-xl font-bold mb-2">
                Your Interview is Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                {allComplete
                  ? "All founders have completed their interviews. You can now export your agreement."
                  : "Waiting for other founders to complete their interviews."}
              </p>
              {allComplete && (
                <button
                  onClick={() => setShowExport(true)}
                  className="btn-primary"
                >
                  View & Export Agreement
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
        <div className="space-y-6">
          <FounderStatus
            founders={agreement.founders}
            currentFounderId={founderId}
          />

          {agreement.founders.length < 4 && (
            <div className="card bg-stripe-purple/5 border-stripe-purple/20">
              <h3 className="font-semibold mb-2">Invite Co-Founders</h3>
              <p className="text-sm text-gray-600 mb-3">
                Share this code with your co-founders so they can join and
                complete their own interview.
              </p>
              <div className="bg-white rounded-lg p-3 text-center">
                <span className="font-mono text-2xl font-bold text-stripe-purple">
                  {agreement.code}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Or share:{" "}
                <span className="font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                  /agreement/join/{agreement.code}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
