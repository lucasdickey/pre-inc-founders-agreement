import Anthropic from "@anthropic-ai/sdk";
import { buildInterviewPrompt, getInitialMessage } from "./prompts";
import type {
  InterviewTopic,
  Agreement,
  Founder,
  ChatMessage,
} from "@/types/agreement";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface InterviewResponse {
  message: string;
  extractedData: Record<string, unknown>;
  nextQuestion: string | null;
  topicComplete: boolean;
  suggestedNextTopic: InterviewTopic | null;
}

export async function conductInterview(
  agreement: Agreement,
  founder: Founder,
  userMessage: string,
  currentTopic: InterviewTopic
): Promise<InterviewResponse> {
  const conversationHistory: Array<{ role: string; content: string }> =
    founder.interviewData?.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) || [];

  // Add the new user message
  conversationHistory.push({ role: "user", content: userMessage });

  const systemPrompt = buildInterviewPrompt(
    currentTopic,
    agreement,
    founder,
    conversationHistory
  );

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse the JSON response
    const parsed = parseInterviewResponse(content.text);
    return parsed;
  } catch (error) {
    console.error("Claude API error:", error);
    // Return a fallback response
    return {
      message:
        "I had a brief hiccup processing that. Could you rephrase or try again?",
      extractedData: {},
      nextQuestion: null,
      topicComplete: false,
      suggestedNextTopic: null,
    };
  }
}

function parseInterviewResponse(text: string): InterviewResponse {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        message: parsed.message || text,
        extractedData: parsed.extractedData || {},
        nextQuestion: parsed.nextQuestion || null,
        topicComplete: parsed.topicComplete || false,
        suggestedNextTopic: parsed.suggestedNextTopic || null,
      };
    } catch {
      // JSON parse failed, treat as plain text
    }
  }

  // Fallback: treat entire response as message
  return {
    message: text,
    extractedData: {},
    nextQuestion: null,
    topicComplete: false,
    suggestedNextTopic: null,
  };
}

export function getStartingMessage(founderName: string): InterviewResponse {
  const parsed = JSON.parse(getInitialMessage(founderName));
  return parsed;
}

export function determineNextTopic(
  completedTopics: InterviewTopic[],
  suggestedTopic: InterviewTopic | null
): InterviewTopic {
  const topicOrder: InterviewTopic[] = [
    "introduction",
    "equity",
    "contributions",
    "decision_making",
    "exit_scenarios",
    "custom_terms",
    "review",
  ];

  // If there's a suggested topic and it hasn't been completed, use it
  if (suggestedTopic && !completedTopics.includes(suggestedTopic)) {
    return suggestedTopic;
  }

  // Otherwise, find the first incomplete topic
  for (const topic of topicOrder) {
    if (!completedTopics.includes(topic)) {
      return topic;
    }
  }

  // All topics complete, go to review
  return "review";
}

export function mergeExtractedData(
  existing: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, unknown> {
  const merged = { ...existing };

  for (const [key, value] of Object.entries(newData)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value) && Array.isArray(merged[key])) {
      // Merge arrays
      merged[key] = [...(merged[key] as unknown[]), ...value];
    } else if (
      typeof value === "object" &&
      typeof merged[key] === "object" &&
      !Array.isArray(value)
    ) {
      // Deep merge objects
      merged[key] = mergeExtractedData(
        merged[key] as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      // Overwrite primitive values
      merged[key] = value;
    }
  }

  return merged;
}
