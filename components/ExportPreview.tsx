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
  const [companyName, setCompanyName] = useState<string>("founders_agreement");
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
      if (data.agreement?.companyName) {
        setCompanyName(data.agreement.companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase());
      }
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
    a.download = `${companyName}_agreement.${fileExtensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  if (error || !exports) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
        <p className="text-red-400">{error || "Failed to load export preview"}</p>
      </div>
    );
  }

  const tabs: Array<{ id: ExportTab; label: string; icon: React.ReactNode }> = [
    {
      id: "markdown",
      label: "Summary",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "yaml",
      label: "Data",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: "legal",
      label: "Legal",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
  ];

  const currentContent =
    activeTab === "yaml"
      ? exports.yaml
      : activeTab === "markdown"
        ? exports.markdown
        : exports.legalDocument;

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Export Preview</h2>
        <button
          onClick={() => downloadFile(activeTab)}
          className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 bg-slate-900 rounded-lg border border-white/10 overflow-auto">
        <pre className="p-4 text-sm text-slate-300 font-mono whitespace-pre-wrap">
          {currentContent}
        </pre>
      </div>

      {/* Download all */}
      <div className="mt-3 pt-3 border-t border-white/10 flex justify-end gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => downloadFile(tab.id)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-colors"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
