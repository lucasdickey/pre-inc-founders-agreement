#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { INTERVIEW_PROMPT } from "./interview-prompt.js";
import { generateAgreementMarkdown } from "./document-generator.js";

const server = new McpServer({
  name: "founders-agreement",
  version: "1.0.0",
});

// --- Prompt: The interview script for the host AI ---

server.prompt(
  "founders-agreement-interview",
  "Start a structured pre-incorporation founders agreement interview. Guides you through equity, vesting, contributions, decision-making, and exit scenarios, then generates a markdown agreement document.",
  () => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: INTERVIEW_PROMPT,
        },
      },
    ],
  })
);

// --- Tool: Generate the final agreement document ---

const FounderSchema = z.object({
  name: z.string().describe("Founder's full name"),
  email: z.string().describe("Founder's email address"),
  role: z.string().describe("Role/title (e.g. CEO, CTO)"),
  commitment: z
    .string()
    .optional()
    .describe("Full-time or part-time commitment"),
  equityPercentage: z.number().describe("Equity ownership percentage"),
  vestingSchedule: z
    .object({
      totalMonths: z
        .number()
        .describe("Total vesting period in months (e.g. 48)"),
      cliffMonths: z.number().describe("Cliff period in months (e.g. 12)"),
      vestingFrequency: z
        .string()
        .optional()
        .describe("Monthly or quarterly vesting"),
      accelerationOnExit: z
        .boolean()
        .optional()
        .describe("Whether vesting accelerates on acquisition/exit"),
    })
    .optional()
    .describe("Vesting schedule details"),
  contributions: z
    .array(
      z.object({
        type: z
          .string()
          .describe(
            "Type: ip, capital, equipment, sweat_equity, relationships, other"
          ),
        description: z.string().describe("Description of the contribution"),
        estimatedValue: z
          .string()
          .optional()
          .describe("Estimated dollar value if applicable"),
        preExisting: z
          .boolean()
          .optional()
          .describe("Whether this is pre-existing (not newly created)"),
      })
    )
    .optional()
    .describe("Contributions this founder is bringing"),
});

const AgreementDataSchema = z.object({
  companyName: z.string().describe("Name of the company"),
  companyDescription: z
    .string()
    .optional()
    .describe("Brief description of what the company does"),
  companyStage: z
    .string()
    .optional()
    .describe("Current stage: idea, MVP, revenue, etc."),
  founders: z
    .array(FounderSchema)
    .describe("Array of founder details collected during interview"),
  decisionMaking: z
    .object({
      votingStructure: z
        .string()
        .optional()
        .describe(
          "Voting structure: equal, equity_weighted, or custom description"
        ),
      unanimousDecisions: z
        .array(z.string())
        .optional()
        .describe(
          "Decisions requiring unanimous consent (e.g. fundraising, selling company)"
        ),
      dayToDayAuthority: z
        .string()
        .optional()
        .describe("Who handles day-to-day decisions"),
      deadlockResolution: z
        .string()
        .optional()
        .describe(
          "How deadlocks are resolved: CEO tiebreaker, mediator, advisory board, etc."
        ),
    })
    .optional()
    .describe("Decision-making governance structure"),
  exitScenarios: z
    .object({
      voluntaryDeparture: z
        .object({
          unvestedShares: z
            .string()
            .optional()
            .describe("What happens to unvested shares"),
          vestedShares: z
            .string()
            .optional()
            .describe("What happens to vested shares"),
          noticePeriod: z.string().optional().describe("Required notice period"),
        })
        .optional(),
      involuntaryTermination: z
        .object({
          forCause: z
            .string()
            .optional()
            .describe("Terms for termination for cause"),
          withoutCause: z
            .string()
            .optional()
            .describe("Terms for termination without cause"),
        })
        .optional(),
      nonCompete: z
        .object({
          duration: z
            .string()
            .optional()
            .describe("Non-compete duration (e.g. 12 months)"),
          geographicScope: z.string().optional().describe("Geographic scope"),
          industryScope: z.string().optional().describe("Industry scope"),
        })
        .optional(),
      companySale: z
        .object({
          vestingAcceleration: z
            .string()
            .optional()
            .describe("Vesting acceleration on sale"),
          dragAlongTagAlong: z
            .string()
            .optional()
            .describe("Drag-along/tag-along rights"),
        })
        .optional(),
    })
    .optional()
    .describe("Exit scenario terms"),
  customTerms: z
    .array(
      z.object({
        label: z.string().describe("Term name/label"),
        value: z.string().describe("Term details"),
      })
    )
    .optional()
    .describe("Any additional custom terms"),
  outputPath: z
    .string()
    .optional()
    .describe(
      "File path to write the generated .md file to. Defaults to ./<company-name>-founders-agreement.md"
    ),
});

server.tool(
  "generate_agreement_document",
  `Generate a Pre-Incorporation Founders Agreement as a markdown (.md) file from collected interview data.

Call this tool ONLY after completing the full interview covering: company info, founder details, equity & vesting, contributions, decision-making, exit scenarios, and any custom terms.

The tool writes a .md file and returns its contents.`,
  AgreementDataSchema.shape,
  async (args) => {
    const data = AgreementDataSchema.parse(args);
    const markdown = generateAgreementMarkdown(data);

    return {
      content: [
        {
          type: "text" as const,
          text: markdown,
        },
      ],
    };
  }
);

// --- Start server ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
