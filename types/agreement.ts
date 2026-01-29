export interface Founder {
  id: string;
  name: string;
  email: string;
  role: string;
  equityPercentage: number | null;
  vestingSchedule: VestingSchedule | null;
  contributions: Contribution[];
  interviewCompleted: boolean;
  interviewData: InterviewData | null;
  joinedAt: string;
}

export interface VestingSchedule {
  totalMonths: number;
  cliffMonths: number;
  vestingType: "standard" | "custom";
  accelerationOnExit: boolean;
  customTerms?: string;
}

export interface Contribution {
  type: "ip" | "capital" | "sweat_equity" | "idea" | "other";
  description: string;
  estimatedValue?: number;
  preExisting: boolean;
}

export interface DecisionMaking {
  votingStructure: "equal" | "equity_weighted" | "custom";
  unanimousDecisions: string[];
  majorityDecisions: string[];
  deadlockResolution: string;
  customRules?: string;
}

export interface ExitScenarios {
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

export interface InterviewData {
  messages: ChatMessage[];
  extractedData: Record<string, unknown>;
  currentTopic: InterviewTopic;
  completedTopics: InterviewTopic[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export type InterviewTopic =
  | "introduction"
  | "equity"
  | "contributions"
  | "decision_making"
  | "exit_scenarios"
  | "custom_terms"
  | "review";

export interface Agreement {
  id: string;
  code: string; // Shareable join code
  companyName: string;
  companyDescription?: string;
  founders: Founder[];
  decisionMaking: DecisionMaking | null;
  exitScenarios: ExitScenarios | null;
  customFields: CustomField[];
  status: "draft" | "in_progress" | "pending_review" | "finalized";
  createdAt: string;
  updatedAt: string;
  createdBy: string; // Founder ID who created
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  addedBy: string; // Founder ID
}

// For generating output documents
export interface AgreementExport {
  yaml: string;
  markdown: string;
  legalDocument: string;
}
