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
  introduction: "Getting Started",
  equity: "Equity & Vesting",
  contributions: "Contributions",
  decision_making: "Decision Making",
  exit_scenarios: "Exit Scenarios",
  custom_terms: "Additional Terms",
  review: "Review & Finalize",
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start interview if no messages
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
        body: JSON.stringify({
          agreementId,
          founderId,
          isStart: true,
        }),
      });

      const data = await response.json();
      if (data.response) {
        setMessages([
          {
            role: "assistant",
            content: data.response.message,
            timestamp: new Date().toISOString(),
          },
        ]);
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
        body: JSON.stringify({
          agreementId,
          founderId,
          message: userMessage.content,
        }),
      });

      const data = await response.json();

      if (data.response) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.response.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

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
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I had trouble processing that. Could you try again?",
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const allTopics: InterviewTopic[] = [
    "introduction",
    "equity",
    "contributions",
    "decision_making",
    "exit_scenarios",
    "custom_terms",
    "review",
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-lg shadow-stripe border border-stripe-border overflow-hidden">
      {/* Progress sidebar */}
      <div className="w-56 border-r border-stripe-border bg-stripe-gray-50 p-4 hidden md:block">
        <h3 className="text-[11px] font-semibold text-stripe-gray-500 uppercase tracking-wider mb-3">
          Interview Progress
        </h3>
        <div className="space-y-0.5">
          {allTopics.map((t, index) => {
            const isCompleted = completedTopics.includes(t);
            const isCurrent = t === topic;

            return (
              <div
                key={t}
                className={`progress-step ${
                  isCompleted ? "completed" : isCurrent ? "current" : "pending"
                }`}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4 flex-shrink-0"
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
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                      isCurrent
                        ? "bg-stripe-purple text-white"
                        : "bg-stripe-gray-200 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                )}
                <span className="text-[13px]">{TOPIC_LABELS[t]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile topic indicator */}
        <div className="md:hidden px-4 py-2.5 border-b border-stripe-border bg-stripe-gray-50">
          <span className="text-xs text-stripe-gray-500">
            Current topic:{" "}
            <strong className="text-stripe-slate">{TOPIC_LABELS[topic]}</strong>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-stripe-gray-50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-p:text-stripe-slate prose-p:leading-relaxed">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="chat-message assistant">
              <div className="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-stripe-border p-4 bg-white">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1 resize-none rounded-md border border-stripe-border px-3.5 py-2.5 text-sm focus:outline-none focus:border-stripe-purple focus:shadow-stripe-focus transition-shadow"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 bg-stripe-purple text-white rounded-md hover:bg-stripe-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-end"
            >
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
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
