"use client";

import type { Founder } from "@/types/agreement";

interface FounderStatusProps {
  founders: Founder[];
  currentFounderId?: string;
}

// Get 2-letter initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function FounderStatus({
  founders,
  currentFounderId,
}: FounderStatusProps) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-4">
      <h3 className="text-sm font-semibold text-white mb-3">Founders</h3>
      <div className="space-y-2">
        {founders.map((founder) => (
          <div
            key={founder.id}
            className={`flex items-center gap-2 p-2 rounded-xl text-sm ${
              founder.id === currentFounderId
                ? "bg-violet-500/10 border border-violet-500/20"
                : "bg-white/5"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0 ${
                founder.interviewCompleted
                  ? "bg-green-500"
                  : founder.id === currentFounderId
                    ? "bg-gradient-to-br from-violet-500 to-indigo-500"
                    : "bg-slate-600"
              }`}
            >
              {getInitials(founder.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm text-white">
                {founder.name}
                {founder.id === currentFounderId && (
                  <span className="text-xs text-violet-400 ml-1">(You)</span>
                )}
              </p>
            </div>
            <div className="flex-shrink-0">
              {founder.interviewCompleted ? (
                <span className="inline-flex items-center gap-1 text-green-400 text-xs whitespace-nowrap">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Done
                </span>
              ) : founder.interviewData?.messages &&
                founder.interviewData.messages.length > 0 ? (
                <span className="text-amber-400 text-xs whitespace-nowrap">In Progress</span>
              ) : (
                <span className="text-slate-500 text-xs whitespace-nowrap">Not Started</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {founders.length < 4 && (
        <p className="text-xs text-slate-500 mt-3">
          {4 - founders.length} more can join
        </p>
      )}
    </div>
  );
}
