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
      <h3 className="font-semibold mb-4">Founders</h3>
      <div className="space-y-3">
        {founders.map((founder) => (
          <div
            key={founder.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              founder.id === currentFounderId
                ? "bg-stripe-purple/10 border border-stripe-purple/20"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                  founder.interviewCompleted
                    ? "bg-green-500"
                    : founder.id === currentFounderId
                      ? "bg-stripe-purple"
                      : "bg-gray-400"
                }`}
              >
                {founder.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {founder.name}
                  {founder.id === currentFounderId && (
                    <span className="text-xs text-stripe-purple ml-2">
                      (You)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {founder.email}
                  {founder.email === "jamie@example.com" && (
                    <span className="ml-1 text-xs text-amber-600">(Demo)</span>
                  )}
                </p>
              </div>
            </div>
            <div>
              {founder.interviewCompleted ? (
                <span className="inline-flex items-center gap-1 text-green-600 text-sm">
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Complete
                </span>
              ) : founder.interviewData?.messages &&
                founder.interviewData.messages.length > 0 ? (
                <span className="text-amber-600 text-sm">In Progress</span>
              ) : (
                <span className="text-gray-400 text-sm">Not Started</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {founders.length < 4 && (
        <p className="text-sm text-gray-500 mt-4">
          Up to {4 - founders.length} more founder
          {4 - founders.length !== 1 ? "s" : ""} can join
        </p>
      )}
    </div>
  );
}
