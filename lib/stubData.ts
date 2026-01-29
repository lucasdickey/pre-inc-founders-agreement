import type { Founder, InterviewTopic, ChatMessage } from "@/types/agreement";
import { nanoid } from "nanoid";

// Sample stub data that represents a realistic co-founder who has completed their interview
export function createStubFounder(): Founder {
  const stubId = nanoid();
  const now = new Date().toISOString();

  const stubMessages: ChatMessage[] = [
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you work through the key decisions for your founders agreement. Let's start with some basics. What's your role in the company?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "I'm the CTO. I'll be handling all the technical architecture and leading the engineering team.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "Great! As CTO, you'll be crucial to building the product. Now let's talk about equity. What equity percentage have you and your co-founders discussed for your stake?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "We agreed on 40% for me, with a standard 4-year vesting schedule and 1-year cliff.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "A 40% stake with 4-year vesting and 1-year cliff is a common arrangement. What contributions are you bringing to the company?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "I'm contributing the initial prototype code I built, about 3 months of work. I'm also putting in $25,000 in seed capital.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "That's significant - both IP and capital contribution. Let's discuss decision making. How should major company decisions be made?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "We want unanimous consent for major decisions like fundraising, selling the company, or taking on debt over $50k. Day-to-day decisions by majority vote.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "That's a balanced approach. What about exit scenarios - what happens if a founder leaves?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "If someone leaves voluntarily, unvested shares go back to the pool. 12-month non-compete. For involuntary termination without cause, 6 months acceleration.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "Clear terms on departure scenarios are important. Any custom terms or special arrangements to note?",
      timestamp: now,
    },
    {
      role: "user",
      content:
        "I want to keep rights to contribute to open source projects related to my work, as long as they don't directly compete.",
      timestamp: now,
    },
    {
      role: "assistant",
      content:
        "That's a reasonable provision for a technical co-founder. I've captured all your responses. Your interview is complete!",
      timestamp: now,
    },
  ];

  const completedTopics: InterviewTopic[] = [
    "introduction",
    "equity",
    "contributions",
    "decision_making",
    "exit_scenarios",
    "custom_terms",
    "review",
  ];

  return {
    id: stubId,
    name: "Jamie Chen",
    email: "jamie@example.com",
    role: "CTO",
    equityPercentage: 40,
    vestingSchedule: {
      totalMonths: 48,
      cliffMonths: 12,
      vestingType: "standard",
      accelerationOnExit: false,
    },
    contributions: [
      {
        type: "ip",
        description: "Initial prototype code (3 months development)",
        estimatedValue: 50000,
        preExisting: true,
      },
      {
        type: "capital",
        description: "Seed capital investment",
        estimatedValue: 25000,
        preExisting: false,
      },
    ],
    interviewCompleted: true,
    interviewData: {
      messages: stubMessages,
      extractedData: {
        role: "CTO",
        responsibilities: "Technical architecture and engineering leadership",
        equityPercentage: 40,
        vestingMonths: 48,
        cliffMonths: 12,
        contributions: [
          { type: "ip", description: "Initial prototype code", value: 50000 },
          { type: "capital", description: "Seed capital", value: 25000 },
        ],
        decisionMaking: {
          unanimousDecisions: [
            "Fundraising",
            "Company sale",
            "Debt over $50,000",
          ],
          majorityDecisions: ["Day-to-day operations", "Hiring", "Expenses"],
        },
        exitTerms: {
          voluntaryDeparture: "Unvested shares return to pool",
          nonCompeteMonths: 12,
          involuntaryAcceleration: 6,
        },
        customTerms: "Rights to contribute to non-competing open source projects",
      },
      currentTopic: "review",
      completedTopics: completedTopics,
    },
    joinedAt: now,
  };
}
