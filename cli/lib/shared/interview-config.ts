/**
 * Shared interview configuration for Founders Agreement
 * Used by both web app and CLI to maintain consistency
 * Based on skill.md specification
 */

export interface InterviewSection {
  id: string;
  title: string;
  description: string;
  questions: InterviewQuestion[];
}

export interface InterviewQuestion {
  id: string;
  prompt: string;
  type: 'text' | 'number' | 'select' | 'confirm' | 'date';
  options?: string[];
  required: boolean;
  helpText?: string;
  validation?: (value: string) => boolean | string;
}

export interface TermExplanation {
  term: string;
  explanation: string;
}

// Term explanations from skill.md
export const VESTING_TERMS: TermExplanation[] = [
  { term: 'Vesting', explanation: 'You earn your equity over time rather than all at once. Protects the company if someone leaves early.' },
  { term: 'Cliff', explanation: 'A waiting period before any equity vests. If you leave before the cliff, you get nothing.' },
  { term: 'Vesting frequency', explanation: 'How often equity vests after the cliff—monthly means 1/48th each month for a 4-year schedule.' },
  { term: 'Single trigger', explanation: 'Your unvested equity accelerates (vests immediately) if the company is acquired—regardless of whether you stay.' },
  { term: 'Double trigger', explanation: 'Your unvested equity accelerates only if the company is acquired AND you\'re terminated afterward. More common.' },
];

export const EXIT_TERMS: TermExplanation[] = [
  { term: 'For cause', explanation: 'Termination due to misconduct, breach of agreement, or failure to perform. Usually means forfeiting unvested shares.' },
  { term: 'Without cause', explanation: 'Termination for business reasons, not misconduct. Often includes some acceleration or severance.' },
  { term: 'Non-compete', explanation: 'A restriction preventing you from working for competitors after leaving. Must be reasonable in duration and scope.' },
  { term: 'Drag-along', explanation: 'If majority shareholders sell, they can force minority shareholders to sell too. Protects buyers who want 100%.' },
  { term: 'Tag-along', explanation: 'If majority shareholders sell, minority shareholders can join the sale at the same terms. Protects minority from being left behind.' },
];

// Interview sections based on skill.md
export const INTERVIEW_SECTIONS: InterviewSection[] = [
  {
    id: 'company',
    title: 'Company Information',
    description: 'Basic information about your company',
    questions: [
      { id: 'companyName', prompt: 'What\'s the name of your company?', type: 'text', required: true },
      { id: 'companyDescription', prompt: 'What does your company do? (1-2 sentences)', type: 'text', required: true },
      { id: 'companyStage', prompt: 'What stage is the company at?', type: 'select', options: ['Idea', 'MVP', 'Pre-revenue', 'Revenue', 'Growth'], required: true },
    ],
  },
  {
    id: 'ceo_details',
    title: 'Your Details',
    description: 'Information about you as the primary founder',
    questions: [
      { id: 'ceoName', prompt: 'What\'s your full name?', type: 'text', required: true },
      { id: 'ceoEmail', prompt: 'What\'s your email address?', type: 'text', required: true },
      { id: 'ceoRole', prompt: 'What\'s your role/title?', type: 'text', required: true, helpText: 'e.g., CEO, Founder, Managing Partner' },
      { id: 'ceoResponsibilities', prompt: 'What are your primary responsibilities?', type: 'text', required: true },
      { id: 'ceoCommitment', prompt: 'Full-time or part-time?', type: 'select', options: ['Full-time', 'Part-time'], required: true },
      { id: 'ceoStartDate', prompt: 'When did you start with the company?', type: 'date', required: true },
    ],
  },
  {
    id: 'ceo_equity',
    title: 'Your Equity & Vesting',
    description: 'Your ownership and vesting terms',
    questions: [
      { id: 'ceoEquity', prompt: 'What percentage of the company are you taking?', type: 'number', required: true, helpText: 'Enter a number between 1-100' },
      { id: 'ceoVestingPeriod', prompt: 'How long is your vesting schedule? (months)', type: 'number', required: true, helpText: 'Standard: 48 months (4 years)' },
      { id: 'ceoCliffPeriod', prompt: 'How long is your cliff period? (months)', type: 'number', required: true, helpText: 'Standard: 12 months (1 year)' },
      { id: 'ceoVestingFrequency', prompt: 'How often does equity vest after the cliff?', type: 'select', options: ['Monthly', 'Quarterly', 'Annually'], required: true },
      { id: 'ceoVestingStartDate', prompt: 'When does your vesting start?', type: 'date', required: true },
      { id: 'ceoAcceleration', prompt: 'Do you want acceleration on acquisition?', type: 'select', options: ['None', 'Single trigger', 'Double trigger'], required: true, helpText: 'Double trigger is more common' },
    ],
  },
  {
    id: 'cofounders',
    title: 'Co-Founders',
    description: 'Information about your co-founders',
    questions: [
      { id: 'hasCoFounders', prompt: 'Do you have any co-founders?', type: 'confirm', required: true },
      { id: 'coFounderCount', prompt: 'How many co-founders?', type: 'number', required: false },
    ],
  },
  {
    id: 'contributions',
    title: 'Contributions',
    description: 'What each founder is bringing to the company',
    questions: [
      { id: 'hasIP', prompt: 'Are you contributing any intellectual property (code, patents, designs)?', type: 'confirm', required: true },
      { id: 'ipDescription', prompt: 'Describe the IP contribution:', type: 'text', required: false },
      { id: 'ipValue', prompt: 'Estimated value ($):', type: 'number', required: false },
      { id: 'ipPreExisting', prompt: 'Is this IP pre-existing or newly created for the company?', type: 'select', options: ['Pre-existing', 'Newly created', 'Mix of both'], required: false },
      { id: 'hasCapital', prompt: 'Are you investing capital?', type: 'confirm', required: true },
      { id: 'capitalAmount', prompt: 'How much ($)?', type: 'number', required: false },
      { id: 'hasEquipment', prompt: 'Are you contributing equipment or assets?', type: 'confirm', required: true },
      { id: 'equipmentDescription', prompt: 'Describe the equipment/assets:', type: 'text', required: false },
      { id: 'equipmentPreExisting', prompt: 'Is this equipment pre-existing or newly acquired?', type: 'select', options: ['Pre-existing', 'Newly acquired'], required: false },
      { id: 'hasSweatEquity', prompt: 'Have you invested significant time before this agreement (sweat equity)?', type: 'confirm', required: true },
      { id: 'sweatEquityDescription', prompt: 'Describe the work already done:', type: 'text', required: false },
      { id: 'sweatEquityValue', prompt: 'Estimated value of time invested ($):', type: 'number', required: false },
    ],
  },
  {
    id: 'decision_making',
    title: 'Decision Making',
    description: 'How decisions will be made',
    questions: [
      { id: 'unanimousDecisions', prompt: 'Which decisions require unanimous consent?', type: 'text', required: true, helpText: 'Common: fundraising, selling company, major debt, pivots, executive hires, issuing equity' },
      { id: 'dayToDay', prompt: 'Who handles day-to-day decisions?', type: 'text', required: true },
      { id: 'deadlockResolution', prompt: 'How should deadlocks be resolved?', type: 'select', options: ['CEO tie-breaker', 'External mediator', 'Advisory board', 'Buyout provision'], required: true },
    ],
  },
  {
    id: 'exit_scenarios',
    title: 'Exit Scenarios',
    description: 'What happens when founders leave',
    questions: [
      { id: 'voluntaryUnvested', prompt: 'Voluntary departure: what happens to unvested shares?', type: 'text', required: true, helpText: 'Common: return to company pool' },
      { id: 'voluntaryVested', prompt: 'Voluntary departure: what happens to vested shares?', type: 'text', required: true, helpText: 'Common: founder keeps them' },
      { id: 'noticePeriod', prompt: 'Required notice period (days)?', type: 'number', required: true },
      { id: 'forCauseTerms', prompt: 'For cause termination: what happens?', type: 'text', required: true },
      { id: 'withoutCauseTerms', prompt: 'Without cause termination: what happens?', type: 'text', required: true },
      { id: 'involuntaryAcceleration', prompt: 'On involuntary termination without cause, does any vesting accelerate?', type: 'select', options: ['No acceleration', 'Partial acceleration', 'Full acceleration'], required: true, helpText: 'Some companies offer partial acceleration as severance' },
      { id: 'nonCompeteDuration', prompt: 'Non-compete duration (months)?', type: 'number', required: true, helpText: 'Common: 12-24 months' },
      { id: 'nonCompeteGeo', prompt: 'Non-compete geographic scope:', type: 'text', required: true, helpText: 'e.g., United States, California, Worldwide' },
      { id: 'nonCompeteIndustry', prompt: 'Non-compete industry scope:', type: 'text', required: true, helpText: 'e.g., Direct competitors only, All fintech companies' },
      { id: 'saleAcceleration', prompt: 'On company sale, does vesting accelerate?', type: 'select', options: ['Yes - full acceleration', 'Yes - partial acceleration', 'No'], required: true },
      { id: 'dragAlong', prompt: 'Include drag-along rights?', type: 'confirm', required: true, helpText: 'Allows majority to force minority to sell in an acquisition' },
      { id: 'tagAlong', prompt: 'Include tag-along rights?', type: 'confirm', required: true, helpText: 'Allows minority to join a sale on same terms as majority' },
    ],
  },
  {
    id: 'custom_terms',
    title: 'Custom Terms',
    description: 'Any special arrangements',
    questions: [
      { id: 'sideProjects', prompt: 'Side projects policy:', type: 'text', required: false, helpText: 'e.g., allowed if non-competing' },
      { id: 'moonlighting', prompt: 'Moonlighting restrictions:', type: 'text', required: false },
      { id: 'ipExceptions', prompt: 'Any IP assignment exceptions?', type: 'text', required: false },
      { id: 'otherTerms', prompt: 'Any other terms to include?', type: 'text', required: false },
    ],
  },
];

// Co-founder questions (repeated for each co-founder)
export const COFOUNDER_QUESTIONS: InterviewQuestion[] = [
  { id: 'name', prompt: 'Co-founder\'s full name:', type: 'text', required: true },
  { id: 'email', prompt: 'Co-founder\'s email:', type: 'text', required: true },
  { id: 'role', prompt: 'Co-founder\'s role/title:', type: 'text', required: true },
  { id: 'responsibilities', prompt: 'Co-founder\'s primary responsibilities:', type: 'text', required: true },
  { id: 'commitment', prompt: 'Full-time or part-time?', type: 'select', options: ['Full-time', 'Part-time'], required: true },
  { id: 'startDate', prompt: 'Co-founder\'s start date:', type: 'date', required: true },
  { id: 'equity', prompt: 'Co-founder\'s equity percentage:', type: 'number', required: true },
  { id: 'vestingMatch', prompt: 'Should vesting terms match yours?', type: 'confirm', required: true },
  { id: 'vestingStartDate', prompt: 'Co-founder\'s vesting start date:', type: 'date', required: true },
  { id: 'accelerationMatch', prompt: 'Should acceleration terms match yours?', type: 'confirm', required: true },
];

// Validation checklist from skill.md
export const VALIDATION_CHECKLIST = {
  company: ['companyName', 'companyDescription', 'companyStage'],
  ceo_details: ['ceoName', 'ceoEmail', 'ceoRole', 'ceoResponsibilities', 'ceoCommitment', 'ceoStartDate'],
  ceo_equity: ['ceoEquity', 'ceoVestingPeriod', 'ceoCliffPeriod', 'ceoVestingFrequency', 'ceoVestingStartDate', 'ceoAcceleration'],
  cofounders: ['hasCoFounders'],
  contributions: ['hasIP', 'hasCapital', 'hasEquipment', 'hasSweatEquity'],
  decision_making: ['unanimousDecisions', 'dayToDay', 'deadlockResolution'],
  exit_scenarios: ['voluntaryUnvested', 'voluntaryVested', 'noticePeriod', 'forCauseTerms', 'withoutCauseTerms', 'involuntaryAcceleration', 'nonCompeteDuration', 'nonCompeteGeo', 'nonCompeteIndustry', 'saleAcceleration', 'dragAlong', 'tagAlong'],
  custom_terms: [], // All optional
};

export function validateSection(sectionId: string, data: Record<string, unknown>): { valid: boolean; missing: string[] } {
  const required = VALIDATION_CHECKLIST[sectionId as keyof typeof VALIDATION_CHECKLIST] || [];
  const missing = required.filter(field => !data[field]);
  return { valid: missing.length === 0, missing };
}

export function validateAllSections(data: Record<string, unknown>): { valid: boolean; missingSections: string[] } {
  const missingSections: string[] = [];
  for (const [sectionId, fields] of Object.entries(VALIDATION_CHECKLIST)) {
    const { valid } = validateSection(sectionId, data);
    if (!valid && fields.length > 0) {
      missingSections.push(sectionId);
    }
  }
  return { valid: missingSections.length === 0, missingSections };
}
