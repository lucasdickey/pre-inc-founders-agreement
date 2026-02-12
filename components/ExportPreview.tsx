"use client";

import { useState, useEffect } from "react";
import type { AgreementExport } from "@/types/agreement";

interface ExportPreviewProps {
  agreementId: string;
}

type ExportTab = "yaml" | "markdown" | "legal";

export default function ExportPreview({ agreementId }: ExportPreviewProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("markdown");
  const [exports, setExports] = useState<AgreementExport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agreementId]);

  const fetchExports = async () => {
    try {
      const response = await fetch(`/api/export?id=${agreementId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch exports");
      }
      const data = await response.json();
      setExports(data.exports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exports");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (format: ExportTab) => {
    const fileExtensions = {
      yaml: "yaml",
      markdown: "md",
      legal: "txt",
    };

    const content =
      format === "yaml"
        ? exports?.yaml
        : format === "markdown"
          ? exports?.markdown
          : exports?.legalDocument;

    if (!content) return;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `founders_agreement.${fileExtensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-5 bg-stripe-border rounded w-1/3 mb-4" />
        <div className="h-64 bg-stripe-gray-50 rounded" />
      </div>
    );
  }

  if (error || !exports) {
    return (
      <div className="card">
        <p className="text-sm text-red-600">
          {error || "Failed to load export preview"}
        </p>
      </div>
    );
  }

  const tabs: Array<{ id: ExportTab; label: string; description: string }> = [
    {
      id: "markdown",
      label: "Summary",
      description: "Human-readable overview",
    },
    {
      id: "yaml",
      label: "YAML",
      description: "For Atlas import",
    },
    {
      id: "legal",
      label: "Legal",
      description: "Formal agreement",
    },
  ];

  const currentContent =
    activeTab === "yaml"
      ? exports.yaml
      : activeTab === "markdown"
        ? exports.markdown
        : exports.legalDocument;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-stripe-slate">
          Export preview
        </h2>
        <button
          onClick={() => downloadFile(activeTab)}
          className="btn-secondary flex items-center gap-1.5"
        >
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </div>

      {/* Tabs */}
      <div className="export-tabs mb-5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`export-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            <span className="block text-[13px]">{tab.label}</span>
            <span className="block text-[11px] opacity-60">
              {tab.description}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="document-preview max-h-[500px] overflow-auto">
        {currentContent}
      </div>

      {/* Download options */}
      <div className="mt-4 pt-4 border-t border-stripe-border flex justify-end gap-1">
        <button
          onClick={() => downloadFile("yaml")}
          className="text-xs text-stripe-gray-500 hover:text-stripe-slate px-3 py-1.5 rounded-md hover:bg-stripe-gray-50 transition-colors"
        >
          Download YAML
        </button>
        <button
          onClick={() => downloadFile("markdown")}
          className="text-xs text-stripe-gray-500 hover:text-stripe-slate px-3 py-1.5 rounded-md hover:bg-stripe-gray-50 transition-colors"
        >
          Download MD
        </button>
        <button
          onClick={() => downloadFile("legal")}
          className="text-xs text-stripe-gray-500 hover:text-stripe-slate px-3 py-1.5 rounded-md hover:bg-stripe-gray-50 transition-colors"
        >
          Download Legal
        </button>
      </div>
    </div>
  );
}
