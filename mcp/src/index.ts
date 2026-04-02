import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// --- Utility for paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root of the repository (assuming mcp/src/index.ts)
const REPO_ROOT = path.join(__dirname, "..", "..");

// --- Types ---

interface VestingSchedule {
  totalMonths: number;
  cliffMonths: number;
  vestingType: "standard" | "custom";
  accelerationOnExit: boolean;
  customTerms?: string;
}

interface Contribution {
  type: "ip" | "capital" | "sweat_equity" | "idea" | "other";
  description: string;
  estimatedValue?: number;
  preExisting: boolean;
}

interface Founder {
  id: string;
  name: string;
  email: string;
  role: string;
  equityPercentage: number | null;
  vestingSchedule: VestingSchedule | null;
  contributions: Contribution[];
}

interface DecisionMaking {
  votingStructure: "equal" | "equity_weighted" | "custom";
  unanimousDecisions: string[];
  majorityDecisions: string[];
  deadlockResolution: string;
  customRules?: string;
}

interface ExitScenarios {
  voluntaryDeparture: {
    vestingAcceleration: boolean;
    buybackTerms: string;
    nonCompetePeriodMonths: number;
  };
  involuntaryDeparture: {
    forCauseTerms: string;
    withoutCauseTerms: string;
  };
  companyExit: {
    saleDistribution: string;
    ipOwnership: string;
  };
  customTerms?: string;
}

interface CustomField {
  id: string;
  label: string;
  value: string;
  addedBy: string;
}

interface AgreementState {
  companyName: string;
  companyDescription: string;
  founders: Founder[];
  decisionMaking: DecisionMaking | null;
  exitScenarios: ExitScenarios | null;
  customFields: CustomField[];
}

// --- State Management ---

const STUB_FOUNDER: Founder = {
  id: "stub-founder-1",
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
};

let state: AgreementState = {
  companyName: "",
  companyDescription: "",
  founders: [STUB_FOUNDER],
  decisionMaking: null,
  exitScenarios: null,
  customFields: [],
};

// --- Helpers ---

function generateMarkdown(agreement: AgreementState): string {
  const lines: string[] = [
    `# Pre-Incorporation Founders Agreement`,
    `## ${agreement.companyName || "Untitled Company"}`,
    "",
    `*Generated: ${new Date().toLocaleDateString()}*`,
    "",
  ];

  if (agreement.companyDescription) {
    lines.push(`### Company Description`, "", agreement.companyDescription, "");
  }

  lines.push(`### Founders`, "");

  for (const founder of agreement.founders) {
    lines.push(`#### ${founder.name}`);
    lines.push(`- **Role:** ${founder.role || "Not specified"}`);
    lines.push(`- **Email:** ${founder.email}`);

    if (founder.equityPercentage !== null) {
      lines.push(`- **Equity:** ${founder.equityPercentage}%`);
    }

    if (founder.vestingSchedule) {
      const vs = founder.vestingSchedule;
      lines.push(
        `- **Vesting:** ${vs.totalMonths} months total, ${vs.cliffMonths} month cliff`
      );
      if (vs.accelerationOnExit) {
        lines.push(`- **Acceleration on Exit:** Yes`);
      }
    }

    if (founder.contributions.length > 0) {
      lines.push(`- **Contributions:**`);
      for (const contrib of founder.contributions) {
        const preExisting = contrib.preExisting ? " (pre-existing)" : "";
        lines.push(`  - ${contrib.type}: ${contrib.description}${preExisting}`);
      }
    }
    lines.push("");
  }

  if (agreement.decisionMaking) {
    const dm = agreement.decisionMaking;
    lines.push(`### Decision Making`, "");
    lines.push(`**Voting Structure:** ${dm.votingStructure}`);

    if (dm.unanimousDecisions.length > 0) {
      lines.push("", "**Requires Unanimous Agreement:**");
      for (const decision of dm.unanimousDecisions) {
        lines.push(`- ${decision}`);
      }
    }

    lines.push("", `**Deadlock Resolution:** ${dm.deadlockResolution}`, "");
  }

  if (agreement.exitScenarios) {
    const es = agreement.exitScenarios;
    lines.push(`### Exit Scenarios`, "");

    lines.push(`#### Voluntary Departure`);
    lines.push(
      `- Vesting Acceleration: ${es.voluntaryDeparture.vestingAcceleration ? "Yes" : "No"}`
    );
    lines.push(`- Buyback Terms: ${es.voluntaryDeparture.buybackTerms}`);
    lines.push(
      `- Non-Compete Period: ${es.voluntaryDeparture.nonCompetePeriodMonths} months`
    );
    lines.push("");

    lines.push(`#### Involuntary Departure`);
    lines.push(`- For Cause: ${es.involuntaryDeparture.forCauseTerms}`);
    lines.push(`- Without Cause: ${es.involuntaryDeparture.withoutCauseTerms}`);
    lines.push("");

    lines.push(`#### Company Exit`);
    lines.push(`- Sale Distribution: ${es.companyExit.saleDistribution}`);
    lines.push(`- IP Ownership: ${es.companyExit.ipOwnership}`);
    lines.push("");
  }

  if (agreement.customFields.length > 0) {
    lines.push(`### Additional Terms`, "");
    for (const field of agreement.customFields) {
      lines.push(`**${field.label}:** ${field.value}`, "");
    }
  }

  lines.push(`---`);
  lines.push(`*Generated by Pre-Incorporation Founders Agreement MCP Skill*`);

  return lines.join("\n");
}

// --- Server Implementation ---

const server = new Server(
  {
    name: "founders-agreement-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
      tools: {},
    },
  }
);

// List Prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "founders-interview-instructions",
        description: "Initial instructions for conducting a Founders Agreement interview",
      },
    ],
  };
});

// Get Prompt
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "founders-interview-instructions") {
    throw new Error("Prompt not found");
  }

  const skillMdPath = path.join(REPO_ROOT, "skill.md");
  let skillMdContent = "";
  try {
    skillMdContent = await fs.readFile(skillMdPath, "utf-8");
  } catch (err) {
    skillMdContent = "Instructions in skill.md not found.";
  }

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are a Founders Agreement Assistant. Your goal is to guide co-founders through a structured interview to formalize their arrangements.

Following these instructions from skill.md:

${skillMdContent}

Please start the interview by greeting the user and asking about their company. Use the tools provided to record the information as you extract it.`,
        },
      },
    ],
  };
});

// List Tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_current_agreement_state",
        description: "Get the current state of the founders agreement being drafted",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "record_interview_data",
        description: "Record extracted data from the interview",
        inputSchema: {
          type: "object",
          properties: {
            companyName: { type: "string" },
            companyDescription: { type: "string" },
            founders: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  role: { type: "string" },
                  equityPercentage: { type: "number" },
                  vestingSchedule: {
                    type: "object",
                    properties: {
                      totalMonths: { type: "number" },
                      cliffMonths: { type: "number" },
                      vestingType: { type: "string", enum: ["standard", "custom"] },
                      accelerationOnExit: { type: "boolean" },
                      customTerms: { type: "string" },
                    },
                    required: ["totalMonths", "cliffMonths", "vestingType", "accelerationOnExit"]
                  },
                  contributions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["ip", "capital", "sweat_equity", "idea", "other"] },
                        description: { type: "string" },
                        estimatedValue: { type: "number" },
                        preExisting: { type: "boolean" },
                      },
                      required: ["type", "description", "preExisting"]
                    },
                  },
                },
                required: ["name", "email", "role"]
              },
            },
            decisionMaking: {
              type: "object",
              properties: {
                votingStructure: { type: "string", enum: ["equal", "equity_weighted", "custom"] },
                unanimousDecisions: { type: "array", items: { type: "string" } },
                majorityDecisions: { type: "array", items: { type: "string" } },
                deadlockResolution: { type: "string" },
                customRules: { type: "string" }
              },
              required: ["votingStructure", "unanimousDecisions", "majorityDecisions", "deadlockResolution"]
            },
            exitScenarios: {
              type: "object",
              properties: {
                voluntaryDeparture: {
                  type: "object",
                  properties: {
                    vestingAcceleration: { type: "boolean" },
                    buybackTerms: { type: "string" },
                    nonCompetePeriodMonths: { type: "number" }
                  },
                  required: ["vestingAcceleration", "buybackTerms", "nonCompetePeriodMonths"]
                },
                involuntaryDeparture: {
                  type: "object",
                  properties: {
                    forCauseTerms: { type: "string" },
                    withoutCauseTerms: { type: "string" }
                  },
                  required: ["forCauseTerms", "withoutCauseTerms"]
                },
                companyExit: {
                  type: "object",
                  properties: {
                    saleDistribution: { type: "string" },
                    ipOwnership: { type: "string" }
                  },
                  required: ["saleDistribution", "ipOwnership"]
                },
                customTerms: { type: "string" }
              },
              required: ["voluntaryDeparture", "involuntaryDeparture", "companyExit"]
            },
            customFields: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  label: { type: "string" },
                  value: { type: "string" },
                  addedBy: { type: "string" }
                },
                required: ["id", "label", "value", "addedBy"]
              }
            },
          },
        },
      },
      {
        name: "generate_agreement_file",
        description: "Generate the final agreement markdown file in the current project directory",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "The filename for the agreement (e.g. 'my-agreement.md'). Must end in .md and cannot contain path separators.",
              default: "founders-agreement.md"
            },
          },
        },
      },
    ],
  };
});

// Call Tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "get_current_agreement_state":
      return {
        content: [{ type: "text", text: JSON.stringify(state, null, 2) }],
      };

    case "record_interview_data": {
      const data = args as Partial<AgreementState>;
      if (data.companyName) state.companyName = data.companyName;
      if (data.companyDescription) state.companyDescription = data.companyDescription;
      if (data.founders) state.founders = data.founders;
      if (data.decisionMaking) state.decisionMaking = data.decisionMaking as DecisionMaking;
      if (data.exitScenarios) state.exitScenarios = data.exitScenarios as ExitScenarios;
      if (data.customFields) state.customFields = data.customFields as CustomField[];

      return {
        content: [{ type: "text", text: "Data recorded successfully." }],
      };
    }

    case "generate_agreement_file": {
      let filename = (args?.filename as string) || "founders-agreement.md";

      // Safety checks for the filename to prevent path traversal
      if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
        return {
          isError: true,
          content: [{ type: "text", text: "Invalid filename. Path separators and parent directory references are not allowed." }],
        };
      }

      if (!filename.endsWith(".md")) {
        filename += ".md";
      }

      const markdown = generateMarkdown(state);
      // Ensure we write to the repo root for visibility
      const filePath = path.join(REPO_ROOT, filename);

      try {
        await fs.writeFile(filePath, markdown, "utf-8");
        return {
          content: [{ type: "text", text: `Agreement generated successfully at ${filename}` }],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text", text: `Error writing file: ${err}` }],
        };
      }
    }

    default:
      throw new Error(`Tool not found: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Founders Agreement MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
