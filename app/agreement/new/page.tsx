"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

type Step = "name" | "email" | "company" | "creating";

export default function NewAgreement() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [founderName, setFounderName] = useState("");
  const [founderEmail, setFounderEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = input.trim();

    if (step === "name") {
      if (!value) return;
      setFounderName(value);
      setInput("");
      setStep("email");
    } else if (step === "email") {
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value || !emailRegex.test(value)) {
        setError("Please enter a valid email address");
        return;
      }
      setFounderEmail(value);
      setInput("");
      setStep("company");
    } else if (step === "company") {
      const company = value || "Untitled Company";
      setCompanyName(company);
      setStep("creating");

      // Create the agreement
      try {
        const response = await fetch("/api/agreement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            founderName,
            founderEmail,
            companyName: company,
          }),
        });

        if (!response.ok) throw new Error("Failed to create agreement");

        const data = await response.json();
        sessionStorage.setItem(`founder_${data.agreement.id}`, data.founderId);
        router.push(`/agreement/${data.agreement.id}`);
      } catch {
        setError("Something went wrong. Please try again.");
        setStep("company");
      }
    }
    setError(null);
  };

  const messages = [
    { role: "assistant", content: "Hey! Let's get your founders agreement started.", show: true },
    { role: "assistant", content: "What's your name?", show: true },
    { role: "user", content: founderName, show: !!founderName },
    { role: "assistant", content: `Nice to meet you, ${founderName}! What's your email?`, show: step !== "name" },
    { role: "user", content: founderEmail, show: !!founderEmail },
    { role: "assistant", content: "And what's your company called? (Working title is fine, or skip this)", show: step === "company" || step === "creating" },
    { role: "user", content: companyName, show: !!companyName && step === "creating" },
    { role: "assistant", content: "Creating your agreement...", show: step === "creating" },
  ].filter(m => m.show);

  const placeholder = {
    name: "Type your name...",
    email: "your@email.com",
    company: "Acme Inc (or press Enter to skip)",
    creating: "",
  }[step];

  return (
    <div className="relative min-h-[calc(100vh-60px)] overflow-hidden flex items-center justify-center">
      {/* Gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute top-[-30%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[50%] h-[50%] rounded-full bg-gradient-to-r from-cyan-500/15 to-blue-600/15 blur-[100px]" />

        {/* Fading grid */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-new" width="64" height="64" patternUnits="userSpaceOnUse">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
            <radialGradient id="grid-mask-new" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="fade-mask-new">
              <rect width="100%" height="100%" fill="url(#grid-mask-new)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-new)" mask="url(#fade-mask-new)" />
        </svg>
      </div>

      <div className="max-w-lg w-full mx-auto px-4 py-12">
        {/* Chat messages */}
        <div className="space-y-4 mb-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-md"
                    : "bg-white/10 text-white border border-white/10 rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.role === "assistant" && step === "creating" && msg.content.includes("Creating") && (
                  <span className="inline-flex ml-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce ml-1" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce ml-1" style={{ animationDelay: "300ms" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        {step !== "creating" && (
          <form onSubmit={handleSubmit} className="animate-fade-in">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type={step === "email" ? "email" : "text"}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                autoComplete={step === "email" ? "email" : step === "name" ? "name" : "organization"}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={step === "name" && !input.trim()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
            {step === "company" && (
              <p className="text-slate-500 text-sm mt-2">Press Enter to skip</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
