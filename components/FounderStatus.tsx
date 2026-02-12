"use client";

import type { Founder } from "@/types/agreement";

interface FounderStatusProps {
  founders: Founder[];
  currentFounderId?: string;
}

export default function FounderStatus({
  founders,
  currentFounderId,
}: FounderStatusProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-stripe-slate mb-3">
        Founders
      </h3>
      <div className="space-y-2">
        {founders.map((founder) => (
          <div
            key={founder.id}
            className={`flex items-center justify-between p-3 rounded-md ${
              founder.id === currentFounderId
                ? "bg-stripe-purple/5 border border-stripe-purple/15"
                : "bg-stripe-gray-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                  founder.interviewCompleted
                    ? "bg-stripe-green"
                    : founder.id === currentFounderId
                      ? "bg-stripe-purple"
                      : "bg-stripe-gray-200"
                }`}
              >
                {founder.interviewCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  founder.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-stripe-slate">
                  {founder.name}
                  {founder.id === currentFounderId && (
                    <span className="text-[11px] text-stripe-purple ml-1.5 font-normal">
                      (You)
                    </span>
                  )}
                </p>
                <p className="text-xs text-stripe-gray-500">
                  {founder.email}
                  {founder.email === "jamie@example.com" && (
                    <span className="ml-1 text-[10px] text-amber-600">(Demo)</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {founder.interviewCompleted ? (
                <span className="text-[11px] font-medium text-stripe-green">
                  Complete
                </span>
              ) : founder.interviewData?.messages &&
                founder.interviewData.messages.length > 0 ? (
                <span className="text-[11px] font-medium text-amber-600">
                  In Progress
                </span>
              ) : (
                <span className="text-[11px] text-stripe-gray-200">
                  Not Started
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {founders.length < 4 && (
        <p className="text-xs text-stripe-gray-500 mt-3">
          Up to {4 - founders.length} more founder
          {4 - founders.length !== 1 ? "s" : ""} can join
        </p>
      )}
    </div>
  );
}
