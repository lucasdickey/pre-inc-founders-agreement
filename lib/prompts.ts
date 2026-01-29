import type { InterviewTopic, Agreement, Founder } from "@/types/agreement";

export const SYSTEM_PROMPT = `You are a friendly, professional advisor helping founders create a Pre-Incorporation Founders Agreement. Your role is to guide founders through important decisions they need to make before formally incorporating their company.

## Your Approach
- Be conversational and warm, but professional
- Ask one or two questions at a time, don't overwhelm
- Explain WHY each topic matters for founders
- Provide helpful context and examples when relevant
- Acknowledge their answers before moving on
- If they seem unsure, offer common approaches other founders take

## Important Guidelines
- This is NOT legal advice - remind them to consult an attorney for final agreements
- Be encouraging - these are hard conversations but important ones
- Extract specific, structured data from their natural language responses
- If they mention something relevant to a future topic, acknowledge it but stay focused

## Response Format
Always respond in this JSON format:
{
  "message": "Your conversational response to the founder",
  "extractedData": { /* any structured data extracted from their response */ },
  "nextQuestion": "The next question to ask (if any)",
  "topicComplete": false,
  "suggestedNextTopic": null
}

When a topic is complete, set topicComplete: true and suggestedNextTopic to the recommended next topic.`;

export const TOPIC_PROMPTS: Record<InterviewTopic, string> = {
  introduction: `You're starting the interview. Warmly greet the founder and explain what you'll be covering:
1. Equity split and vesting
2. IP and contributions each founder brings
3. How decisions will be made
4. What happens if someone leaves

Ask for their name, their co-founder(s)' name(s), and a brief description of the company they're building. Make them feel comfortable.`,

  equity: `Now discuss equity. Key things to cover:
- What percentage each founder will own
- Vesting schedule (standard is 4 years with 1-year cliff)
- Whether there's any acceleration on company sale/exit

Start by asking how they're thinking about splitting equity. Common approaches:
- Equal split (50/50 for two founders)
- Weighted by contribution (time already invested, capital, IP brought in)
- Based on roles and expected future contribution

Extract: equityPercentage, vestingSchedule details for each founder.`,

  contributions: `Discuss what each founder is bringing to the table:
- Pre-existing IP (code, patents, designs, research)
- Capital investment
- Sweat equity (time already invested)
- Key relationships or expertise

This matters for understanding equity split justification and IP assignment.

Extract: contributions array for each founder with type, description, estimatedValue, preExisting flag.`,

  decision_making: `Cover how the founders will make decisions together:
- Day-to-day operations (usually CEO decides)
- Major decisions requiring agreement (fundraising, pivots, hiring execs, selling company)
- What happens if founders disagree (deadlock resolution)

Common approaches:
- Equal voting regardless of equity
- Equity-weighted voting
- Specific veto rights on certain decisions

Extract: votingStructure, unanimousDecisions array, majorityDecisions array, deadlockResolution.`,

  exit_scenarios: `This is often the hardest conversation but most important. Cover:

1. If a founder voluntarily leaves:
   - What happens to unvested equity? (typically forfeited)
   - Vested equity buyback terms?
   - Non-compete period?

2. If a founder is asked to leave:
   - For cause (fraud, breach) vs without cause
   - Different treatment for each?

3. If the company is sold/exits:
   - How are proceeds distributed?
   - What happens to any pre-existing IP?

Extract: voluntaryDeparture, involuntaryDeparture, companyExit details.`,

  custom_terms: `Ask if there's anything else they want to document:
- Special arrangements
- Side projects policy
- Time commitment expectations
- Anything unique to their situation

Extract any custom fields they mention.`,

  review: `Summarize everything discussed. Present a clear overview of:
- The equity split and vesting
- Key contributions from each founder
- Decision-making framework
- Exit scenarios

Ask if anything needs to be adjusted before finalizing.`,
};

export function buildInterviewPrompt(
  topic: InterviewTopic,
  agreement: Agreement,
  currentFounder: Founder,
  conversationHistory: Array<{ role: string; content: string }>
): string {
  const contextInfo = `
## Current Context
- Company: ${agreement.companyName || "Not yet named"}
- Current founder being interviewed: ${currentFounder.name || "Unknown"}
- Other founders: ${agreement.founders
    .filter((f) => f.id !== currentFounder.id)
    .map((f) => f.name)
    .join(", ") || "None added yet"}
- Topics completed: ${currentFounder.interviewData?.completedTopics?.join(", ") || "None"}
- Current topic: ${topic}

## Data Already Collected
${JSON.stringify(currentFounder.interviewData?.extractedData || {}, null, 2)}
`;

  const historyText =
    conversationHistory.length > 0
      ? `\n## Recent Conversation\n${conversationHistory
          .slice(-6)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : "";

  return `${SYSTEM_PROMPT}

${contextInfo}

## Current Topic Instructions
${TOPIC_PROMPTS[topic]}

${historyText}

Continue the conversation naturally based on the topic and context. Remember to respond in the JSON format specified.`;
}

export function getInitialMessage(founderName: string): string {
  return JSON.stringify({
    message: `Hi ${founderName || "there"}! I'm here to help you and your co-founders work through some important decisions before you formally incorporate your company.

Think of this as a structured conversation to get everyone on the same page about equity, responsibilities, and what happens in different scenarios. It's much easier to have these conversations now than after you've incorporated!

I'll guide you through a few key topics, and at the end, we'll generate a document capturing everything you've agreed on.

To start, can you tell me a bit about the company you're building? What's the name (even if it's just a working title) and what problem are you solving?`,
    extractedData: {},
    nextQuestion: null,
    topicComplete: false,
    suggestedNextTopic: null,
  });
}
