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
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const storedFounderId = sessionStorage.getItem(`founder_${agreementId}`);
    if (storedFounderId) {
      setFounderId(storedFounderId);
    }
    fetchAgreement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  // Handle Escape key to close mobile sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSidebar) {
        setShowSidebar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSidebar]);

  const fetchAgreement = async () => {
    try {
      const response = await fetch(`/api/agreement?id=${agreementId}`);
      if (!response.ok) throw new Error("Agreement not found");
      const data = await response.json();
      setAgreement(data.agreement);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agreement");
    } finally {
      setLoading(false);
    }
  };

  const currentFounder = agreement?.founders.find((f) => f.id === founderId);
  const allComplete = agreement?.founders.every((f) => f.interviewCompleted);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 top-[60px] bg-slate-950 flex items-center justify-center">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 animate-pulse">
          <div className="h-8 bg-white/10 rounded w-48 mb-4" />
          <div className="h-4 bg-white/5 rounded w-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !agreement) {
    return (
      <div className="fixed inset-0 top-[60px] bg-slate-950 flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center max-w-md">
          <h1 className="text-xl font-bold text-red-400 mb-2">Agreement Not Found</h1>
          <p className="text-slate-400 mb-6">{error || "This agreement doesn't exist."}</p>
          <a href="/" className="inline-block px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  // Session expired
  if (!founderId || !currentFounder) {
    return (
      <div className="fixed inset-0 top-[60px] bg-slate-950 flex items-center justify-center p-4">
        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-center max-w-md">
          <h1 className="text-xl font-bold text-white mb-2">Session Expired</h1>
          <p className="text-slate-400 mb-6">Please rejoin using the agreement code.</p>
          <a href={`/agreement/join/${agreement.code}`} className="inline-block px-6 py-3 rounded-xl font-semibold text-white bg-violet-600 hover:bg-violet-500">
            Rejoin Agreement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-[60px] bg-slate-950 flex flex-col">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-cyan-500/15 blur-[100px]" />
        <svg className="absolute inset-0 w-full h-full opacity-50" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-ag" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-ag)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              {agreement.companyName}
            </h1>
            <p className="text-sm text-slate-400">Pre-Incorporation Founders Agreement</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden p-2 rounded-lg bg-white/10 border border-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {allComplete && (
              <button
                onClick={() => setShowExport(!showExport)}
                className="px-4 py-2 rounded-lg font-medium text-white bg-violet-600 hover:bg-violet-500 text-sm transition-colors"
              >
                {showExport ? "Back to Chat" : "View Export"}
              </button>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="flex-1 grid md:grid-cols-[1fr_260px] gap-4 min-h-0">
          {/* Chat area */}
          <div className="flex flex-col min-h-0">
            {showExport && allComplete ? (
              <ExportPreview agreementId={agreementId} />
            ) : currentFounder.interviewCompleted ? (
              <div className="p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Interview Complete!</h2>
                <p className="text-slate-400 text-sm mb-4">
                  {allComplete ? "All founders done. Export your agreement." : "Waiting for other founders."}
                </p>
                {allComplete && (
                  <button onClick={() => setShowExport(true)} className="px-4 py-2 rounded-lg font-medium text-white bg-violet-600 hover:bg-violet-500 text-sm">
                    View & Export
                  </button>
                )}
              </div>
            ) : (
              <Chat
                agreementId={agreementId}
                founderId={founderId}
                initialMessages={currentFounder.interviewData?.messages || []}
                currentTopic={currentFounder.interviewData?.currentTopic}
                onComplete={fetchAgreement}
              />
            )}
          </div>

          {/* Sidebar - hidden on mobile unless toggled */}
          <div className={`space-y-3 flex-shrink-0 ${showSidebar ? 'fixed md:relative inset-0 top-[60px] z-50 bg-slate-950/95 backdrop-blur-sm p-4 md:p-0 md:bg-transparent' : 'hidden md:block'}`}>
            {/* Mobile close button */}
            {showSidebar && (
              <button
                onClick={() => setShowSidebar(false)}
                className="md:hidden absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-slate-300 hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            <FounderStatus founders={agreement.founders} currentFounderId={founderId} />

            {agreement.founders.length < 4 && (
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-1">Invite Co-Founders</h3>
                <p className="text-xs text-slate-400 mb-2">Share this link</p>
                <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/agreement/join/${agreement.code}`}
                    className="flex-1 text-xs font-mono text-slate-300 bg-transparent border-none outline-none truncate"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/agreement/join/${agreement.code}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {copied && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-green-300">Link copied to clipboard</span>
          </div>
        </div>
      )}
    </div>
  );
}
