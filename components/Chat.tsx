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
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Progress sidebar */}
      <div className="w-64 border-r bg-gray-50 p-4 hidden md:block">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Progress
        </h3>
        <div className="space-y-1">
          {allTopics.map((t) => {
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
                ) : isCurrent ? (
                  <div className="w-2 h-2 bg-stripe-purple rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-gray-300 rounded-full" />
                )}
                <span>{TOPIC_LABELS[t]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile topic indicator */}
        <div className="md:hidden px-4 py-2 border-b bg-gray-50">
          <span className="text-sm text-gray-600">
            Current: <strong>{TOPIC_LABELS[topic]}</strong>
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none">
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
        <div className="chat-input-container">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your response..."
              className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stripe-purple focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-stripe-purple text-white rounded-xl hover:bg-stripe-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg
                className="w-5 h-5"
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
