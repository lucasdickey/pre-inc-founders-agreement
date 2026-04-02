/**
 * Generates a formatted markdown Pre-Incorporation Founders Agreement
 * from structured interview data.
 */

interface FounderData {
  name: string;
  email: string;
  role: string;
  commitment?: string;
  equityPercentage: number;
  vestingSchedule?: {
    totalMonths: number;
    cliffMonths: number;
    vestingFrequency?: string;
    accelerationOnExit?: boolean;
  };
  contributions?: Array<{
    type: string;
    description: string;
    estimatedValue?: string;
    preExisting?: boolean;
  }>;
}

interface AgreementData {
  companyName: string;
  companyDescription?: string;
  companyStage?: string;
  founders: FounderData[];
  decisionMaking?: {
    votingStructure?: string;
    unanimousDecisions?: string[];
    dayToDayAuthority?: string;
    deadlockResolution?: string;
  };
  exitScenarios?: {
    voluntaryDeparture?: {
      unvestedShares?: string;
      vestedShares?: string;
      noticePeriod?: string;
    };
    involuntaryTermination?: {
      forCause?: string;
      withoutCause?: string;
    };
    nonCompete?: {
      duration?: string;
      geographicScope?: string;
      industryScope?: string;
    };
    companySale?: {
      vestingAcceleration?: string;
      dragAlongTagAlong?: string;
    };
  };
  customTerms?: Array<{
    label: string;
    value: string;
  }>;
}

export function generateAgreementMarkdown(data: AgreementData): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Header
  lines.push(`# Pre-Incorporation Founders Agreement`);
  lines.push(``);
  lines.push(`## ${data.companyName}`);
  lines.push(``);
  if (data.companyDescription) {
    lines.push(data.companyDescription);
    lines.push(``);
  }
  if (data.companyStage) {
    lines.push(`**Stage:** ${data.companyStage}`);
    lines.push(``);
  }
  lines.push(`**Generated:** ${date}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Founders
  lines.push(`## Founders`);
  lines.push(``);

  for (const founder of data.founders) {
    lines.push(`### ${founder.name} (${founder.role})`);
    lines.push(``);
    lines.push(`- **Email:** ${founder.email}`);
    lines.push(`- **Equity:** ${founder.equityPercentage}%`);
    if (founder.commitment) {
      lines.push(`- **Commitment:** ${founder.commitment}`);
    }
    if (founder.vestingSchedule) {
      const vs = founder.vestingSchedule;
      lines.push(
        `- **Vesting:** ${vs.totalMonths} months total, ${vs.cliffMonths}-month cliff${vs.vestingFrequency ? `, ${vs.vestingFrequency}` : ""}`
      );
      if (vs.accelerationOnExit) {
        lines.push(`- **Acceleration on Exit:** Yes`);
      }
    }
    lines.push(``);

    if (founder.contributions && founder.contributions.length > 0) {
      lines.push(`**Contributions:**`);
      lines.push(``);
      for (const c of founder.contributions) {
        const value = c.estimatedValue ? ` ($${c.estimatedValue})` : "";
        const preExisting = c.preExisting ? " *(pre-existing)*" : "";
        lines.push(
          `- **${formatContributionType(c.type)}:** ${c.description}${value}${preExisting}`
        );
      }
      lines.push(``);
    }
  }

  // Equity Summary Table
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Equity Summary`);
  lines.push(``);
  lines.push(`| Founder | Role | Equity | Vesting |`);
  lines.push(`|---------|------|--------|---------|`);

  let totalEquity = 0;
  for (const f of data.founders) {
    totalEquity += f.equityPercentage;
    const vesting = f.vestingSchedule
      ? `${f.vestingSchedule.totalMonths}mo / ${f.vestingSchedule.cliffMonths}mo cliff`
      : "TBD";
    lines.push(`| ${f.name} | ${f.role} | ${f.equityPercentage}% | ${vesting} |`);
  }
  lines.push(`| **Total** | | **${totalEquity}%** | |`);
  lines.push(``);

  // Decision Making
  if (data.decisionMaking) {
    const dm = data.decisionMaking;
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Decision Making`);
    lines.push(``);

    if (dm.votingStructure) {
      lines.push(`**Voting Structure:** ${formatVotingStructure(dm.votingStructure)}`);
      lines.push(``);
    }

    if (dm.unanimousDecisions && dm.unanimousDecisions.length > 0) {
      lines.push(`**Unanimous Consent Required For:**`);
      lines.push(``);
      for (const d of dm.unanimousDecisions) {
        lines.push(`- ${d}`);
      }
      lines.push(``);
    }

    if (dm.dayToDayAuthority) {
      lines.push(`**Day-to-Day Decisions:** ${dm.dayToDayAuthority}`);
      lines.push(``);
    }

    if (dm.deadlockResolution) {
      lines.push(`**Deadlock Resolution:** ${dm.deadlockResolution}`);
      lines.push(``);
    }
  }

  // Exit Scenarios
  if (data.exitScenarios) {
    const es = data.exitScenarios;
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Exit Scenarios`);
    lines.push(``);

    if (es.voluntaryDeparture) {
      const vd = es.voluntaryDeparture;
      lines.push(`### Voluntary Departure`);
      lines.push(``);
      if (vd.unvestedShares) lines.push(`- **Unvested Shares:** ${vd.unvestedShares}`);
      if (vd.vestedShares) lines.push(`- **Vested Shares:** ${vd.vestedShares}`);
      if (vd.noticePeriod) lines.push(`- **Notice Period:** ${vd.noticePeriod}`);
      lines.push(``);
    }

    if (es.involuntaryTermination) {
      const it = es.involuntaryTermination;
      lines.push(`### Involuntary Termination`);
      lines.push(``);
      if (it.forCause) lines.push(`- **For Cause:** ${it.forCause}`);
      if (it.withoutCause) lines.push(`- **Without Cause:** ${it.withoutCause}`);
      lines.push(``);
    }

    if (es.nonCompete) {
      const nc = es.nonCompete;
      lines.push(`### Non-Compete`);
      lines.push(``);
      if (nc.duration) lines.push(`- **Duration:** ${nc.duration}`);
      if (nc.geographicScope) lines.push(`- **Geographic Scope:** ${nc.geographicScope}`);
      if (nc.industryScope) lines.push(`- **Industry Scope:** ${nc.industryScope}`);
      lines.push(``);
    }

    if (es.companySale) {
      const cs = es.companySale;
      lines.push(`### Company Sale`);
      lines.push(``);
      if (cs.vestingAcceleration)
        lines.push(`- **Vesting Acceleration:** ${cs.vestingAcceleration}`);
      if (cs.dragAlongTagAlong)
        lines.push(`- **Drag-Along / Tag-Along:** ${cs.dragAlongTagAlong}`);
      lines.push(``);
    }
  }

  // Custom Terms
  if (data.customTerms && data.customTerms.length > 0) {
    lines.push(`---`);
    lines.push(``);
    lines.push(`## Additional Terms`);
    lines.push(``);
    for (const term of data.customTerms) {
      lines.push(`**${term.label}:** ${term.value}`);
      lines.push(``);
    }
  }

  // Next Steps
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Next Steps`);
  lines.push(``);
  lines.push(`1. [ ] Share this document with all co-founders`);
  lines.push(`2. [ ] Review and discuss any disagreements`);
  lines.push(`3. [ ] Consult with a startup attorney`);
  lines.push(`4. [ ] Formalize into a legal agreement`);
  lines.push(`5. [ ] Incorporate your company`);
  lines.push(``);

  // Disclaimer
  lines.push(`---`);
  lines.push(``);
  lines.push(`## Disclaimer`);
  lines.push(``);
  lines.push(
    `This document is a preliminary alignment tool and does not constitute legal advice. The terms outlined here should be reviewed by a qualified attorney and formalized into legally binding documents before incorporation.`
  );
  lines.push(``);
  lines.push(`*Generated by Pre-Incorporation Founders Agreement Tool*`);

  return lines.join("\n");
}

function formatContributionType(type: string): string {
  const types: Record<string, string> = {
    ip: "Intellectual Property",
    capital: "Capital Investment",
    equipment: "Equipment",
    sweat_equity: "Sweat Equity",
    relationships: "Relationships",
    idea: "Original Idea/Concept",
    other: "Other",
  };
  return types[type.toLowerCase()] || type;
}

function formatVotingStructure(structure: string): string {
  const s = structure.toLowerCase();
  if (s === "equal") return "Equal voting rights regardless of equity";
  if (s === "equity_weighted")
    return "Voting power proportional to equity ownership";
  if (s === "custom") return "Custom voting arrangement (see details below)";
  return structure;
}
