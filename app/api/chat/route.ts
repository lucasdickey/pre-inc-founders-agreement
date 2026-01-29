import { NextResponse } from "next/server";
import {
  conductInterview,
  getStartingMessage,
  determineNextTopic,
  mergeExtractedData,
} from "@/lib/claude";
import {
  getAgreementById,
  updateFounderInAgreement,
} from "@/lib/supabase";
import type { ChatMessage, InterviewTopic } from "@/types/agreement";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agreementId, founderId, message, isStart } = body;

    if (!agreementId || !founderId) {
      return NextResponse.json(
        { error: "Agreement ID and founder ID are required" },
        { status: 400 }
      );
    }

    // Fetch the agreement
    const agreement = await getAgreementById(agreementId);
    if (!agreement) {
      return NextResponse.json(
        { error: "Agreement not found" },
        { status: 404 }
      );
    }

    // Find the founder
    const founder = agreement.founders.find((f) => f.id === founderId);
    if (!founder) {
      return NextResponse.json(
        { error: "Founder not found in agreement" },
        { status: 404 }
      );
    }

    // If this is the start of a new interview
    if (isStart) {
      const startingResponse = getStartingMessage(founder.name);

      // Create the initial assistant message
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: startingResponse.message,
        timestamp: new Date().toISOString(),
      };

      // Update founder's interview data
      await updateFounderInAgreement(agreementId, founderId, {
        interviewData: {
          messages: [assistantMessage],
          extractedData: {},
          currentTopic: "introduction",
          completedTopics: [],
        },
      });

      return NextResponse.json({
        response: startingResponse,
        currentTopic: "introduction",
      });
    }

    // Regular message processing
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const currentTopic =
      founder.interviewData?.currentTopic || "introduction";

    // Conduct the interview
    const response = await conductInterview(
      agreement,
      founder,
      message,
      currentTopic
    );

    // Create message objects
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: response.message,
      timestamp: new Date().toISOString(),
    };

    // Merge extracted data
    const existingData = founder.interviewData?.extractedData || {};
    const mergedData = mergeExtractedData(existingData, response.extractedData);

    // Determine next topic if current is complete
    let nextTopic = currentTopic;
    const completedTopics = [...(founder.interviewData?.completedTopics || [])];

    if (response.topicComplete) {
      completedTopics.push(currentTopic);
      nextTopic = determineNextTopic(
        completedTopics,
        response.suggestedNextTopic
      );
    }

    // Check if interview is complete
    const isComplete = nextTopic === "review" && response.topicComplete;

    // Update founder's interview data
    const updatedMessages = [
      ...(founder.interviewData?.messages || []),
      userMessage,
      assistantMessage,
    ];

    await updateFounderInAgreement(agreementId, founderId, {
      interviewData: {
        messages: updatedMessages,
        extractedData: mergedData,
        currentTopic: nextTopic as InterviewTopic,
        completedTopics: completedTopics as InterviewTopic[],
      },
      interviewCompleted: isComplete,
    });

    return NextResponse.json({
      response: {
        ...response,
        message: response.message + (response.nextQuestion ? "\n\n" + response.nextQuestion : ""),
      },
      currentTopic: nextTopic,
      completedTopics,
      isComplete,
      extractedData: mergedData,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
