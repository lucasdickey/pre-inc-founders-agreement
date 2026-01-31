"use client";

import { useState, useRef, useEffect } from "react";
import type { ChatMessage, InterviewTopic } from "@/types/agreement";
import ReactMarkdown from "react-markdown";

interface ChatProps {
  agreementId: string;
  founderId: string;
  initialMessages?: ChatMessage[];
  currentTopic?: InterviewTopic;
  onTopicChange?: (topic: InterviewTopic) => void;
  onComplete?: () => void;
}

const TOPIC_LABELS: Record<InterviewTopic, string> = {
  introduction: "Intro",
  equity: "Equity",
  contributions: "Contributions",
  decision_making: "Decisions",
  exit_scenarios: "Exit",
  custom_terms: "Custom",
  review: "Review",
};

export default function Chat({
  agreementId,
  founderId,
  initialMessages = [],
  currentTopic = "introduction",
  onTopicChange,
  onComplete,
}: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState<InterviewTopic>(currentTopic);
  const [completedTopics, setCompletedTopics] = useState<InterviewTopic[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // Auto-focus input after new messages
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [messages, isLoading]);

  // Warn user before leaving with unsaved progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (messages.length > 0 && !completedTopics.includes("review")) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [messages, completedTopics]);

  useEffect(() => {
    if (messages.length === 0) {
      startInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, founderId, isStart: true }),
      });
      const data = await response.json();
      if (data.response) {
        setMessages([{
          role: "assistant",
          content: data.response.message,
          timestamp: new Date().toISOString(),
        }]);
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
    }
    setIsLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, founderId, message: userMessage.content }),
      });

      const data = await response.json();

      if (data.response) {
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: data.response.message,
          timestamp: new Date().toISOString(),
        }]);

        if (data.currentTopic !== topic) {
          setTopic(data.currentTopic);
          onTopicChange?.(data.currentTopic);
        }

        if (data.completedTopics) {
          setCompletedTopics(data.completedTopics);
        }

        if (data.isComplete) {
          onComplete?.();
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "I had trouble processing that. Could you try again?",
        timestamp: new Date().toISOString(),
      }]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const allTopics: InterviewTopic[] = [
    "introduction", "equity", "contributions", "decision_making", "exit_scenarios", "custom_terms", "review"
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Progress pills */}
      <div className="flex flex-wrap gap-1.5 mb-3 pb-2 border-b border-white/10">
        {allTopics.map((t) => {
          const isCompleted = completedTopics.includes(t);
          const isCurrent = t === topic;
          return (
            <div
              key={t}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isCompleted
                  ? "bg-green-500/20 text-green-400"
                  : isCurrent
                  ? "bg-violet-500/30 text-violet-300 ring-1 ring-violet-500/50"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              {isCompleted && (
                <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {TOPIC_LABELS[t]}
            </div>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-1">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Starting your interview...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
                msg.role === "user"
                  ? "bg-violet-600 text-white rounded-br-md"
                  : "bg-white/10 text-white border border-white/10 rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ul]:ml-4 [&>ul>li]:text-slate-200 [&>strong]:text-white">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 border border-white/10 rounded-2xl rounded-bl-md px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="flex gap-2 mt-3 pt-3 border-t border-white/10"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your response..."
          className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
}
