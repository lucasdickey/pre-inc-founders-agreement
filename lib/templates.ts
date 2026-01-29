import type { Agreement, AgreementExport, Founder } from "@/types/agreement";

export function generateExport(agreement: Agreement): AgreementExport {
  return {
    yaml: generateYAML(agreement),
    markdown: generateMarkdown(agreement),
    legalDocument: generateLegalDocument(agreement),
  };
}

function generateYAML(agreement: Agreement): string {
  const data = {
    version: "1.0",
    generated_at: new Date().toISOString(),
    agreement_id: agreement.id,
    status: agreement.status,
    company: {
      name: agreement.companyName,
      description: agreement.companyDescription || null,
    },
    founders: agreement.founders.map((f) => ({
      id: f.id,
      name: f.name,
      email: f.email,
      role: f.role,
      equity: {
        percentage: f.equityPercentage,
        vesting: f.vestingSchedule
          ? {
              total_months: f.vestingSchedule.totalMonths,
              cliff_months: f.vestingSchedule.cliffMonths,
              type: f.vestingSchedule.vestingType,
              acceleration_on_exit: f.vestingSchedule.accelerationOnExit,
              custom_terms: f.vestingSchedule.customTerms || null,
            }
          : null,
      },
      contributions: f.contributions.map((c) => ({
        type: c.type,
        description: c.description,
        estimated_value: c.estimatedValue || null,
        pre_existing: c.preExisting,
      })),
    })),
    decision_making: agreement.decisionMaking
      ? {
          voting_structure: agreement.decisionMaking.votingStructure,
          unanimous_decisions: agreement.decisionMaking.unanimousDecisions,
          majority_decisions: agreement.decisionMaking.majorityDecisions,
          deadlock_resolution: agreement.decisionMaking.deadlockResolution,
          custom_rules: agreement.decisionMaking.customRules || null,
        }
      : null,
    exit_scenarios: agreement.exitScenarios
      ? {
          voluntary_departure: {
            vesting_acceleration:
              agreement.exitScenarios.voluntaryDeparture.vestingAcceleration,
            buyback_terms:
              agreement.exitScenarios.voluntaryDeparture.buybackTerms,
            non_compete_period_months:
              agreement.exitScenarios.voluntaryDeparture.nonCompetePeriodMonths,
          },
          involuntary_departure: {
            for_cause_terms:
              agreement.exitScenarios.involuntaryDeparture.forCauseTerms,
            without_cause_terms:
              agreement.exitScenarios.involuntaryDeparture.withoutCauseTerms,
          },
          company_exit: {
            sale_distribution:
              agreement.exitScenarios.companyExit.saleDistribution,
            ip_ownership: agreement.exitScenarios.companyExit.ipOwnership,
          },
          custom_terms: agreement.exitScenarios.customTerms || null,
        }
      : null,
    custom_fields: agreement.customFields.map((cf) => ({
      id: cf.id,
      label: cf.label,
      value: cf.value,
      added_by: cf.addedBy,
    })),
  };

  return toYAML(data);
}

function toYAML(obj: unknown, indent = 0): string {
  const spaces = "  ".repeat(indent);

  if (obj === null || obj === undefined) {
    return "null";
  }

  if (typeof obj === "string") {
    if (obj.includes("\n") || obj.includes(":") || obj.includes("#")) {
      return `|\n${obj
        .split("\n")
        .map((line) => spaces + "  " + line)
        .join("\n")}`;
    }
    return `"${obj.replace(/"/g, '\\"')}"`;
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    return obj.map((item) => `\n${spaces}- ${toYAML(item, indent + 1)}`).join("");
  }

  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    return entries
      .map(([key, value]) => {
        const yamlValue = toYAML(value, indent + 1);
        if (
          typeof value === "object" &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return `\n${spaces}${key}:${yamlValue}`;
        }
        return `\n${spaces}${key}: ${yamlValue}`;
      })
      .join("");
  }

  return String(obj);
}

function generateMarkdown(agreement: Agreement): string {
  const lines: string[] = [
    `# Pre-Incorporation Founders Agreement`,
    `## ${agreement.companyName}`,
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
    lines.push(`**Voting Structure:** ${formatVotingStructure(dm.votingStructure)}`);

    if (dm.unanimousDecisions.length > 0) {
      lines.push("", "**Requires Unanimous Agreement:**");
      for (const decision of dm.unanimousDecisions) {
        lines.push(`- ${decision}`);
      }
    }

    if (dm.majorityDecisions.length > 0) {
      lines.push("", "**Requires Majority Vote:**");
      for (const decision of dm.majorityDecisions) {
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

  return lines.join("\n");
}

function formatVotingStructure(structure: string): string {
  switch (structure) {
    case "equal":
      return "Equal voting rights regardless of equity";
    case "equity_weighted":
      return "Voting power proportional to equity ownership";
    case "custom":
      return "Custom voting arrangement";
    default:
      return structure;
  }
}

function generateLegalDocument(agreement: Agreement): string {
  const lines: string[] = [
    `PRE-INCORPORATION FOUNDERS AGREEMENT`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    ``,
    `IMPORTANT DISCLAIMER`,
    ``,
    `This document is provided for informational and planning purposes only.`,
    `It does NOT constitute legal advice and should NOT be relied upon as a`,
    `legally binding agreement. Before incorporating your company or entering`,
    `into any formal agreements, you should consult with a qualified attorney.`,
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    ``,
    `Date: ${new Date().toLocaleDateString()}`,
    `Agreement ID: ${agreement.id}`,
    ``,
    ``,
    `ARTICLE I - PARTIES`,
    `───────────────────`,
    ``,
    `This Pre-Incorporation Founders Agreement ("Agreement") is entered into`,
    `by and between the following individuals ("Founders"):`,
    ``,
  ];

  agreement.founders.forEach((founder, index) => {
    lines.push(`${index + 1}. ${founder.name}`);
    lines.push(`   Email: ${founder.email}`);
    lines.push(`   Role: ${founder.role || "Co-Founder"}`);
    lines.push(``);
  });

  lines.push(
    `The Founders intend to form a company under the name "${agreement.companyName}"`,
    `(the "Company").`,
    ``,
    ``
  );

  if (agreement.companyDescription) {
    lines.push(
      `ARTICLE II - COMPANY PURPOSE`,
      `────────────────────────────`,
      ``,
      `The Company is being formed for the following purpose:`,
      ``,
      agreement.companyDescription,
      ``,
      ``
    );
  }

  lines.push(
    `ARTICLE III - EQUITY OWNERSHIP`,
    `──────────────────────────────`,
    ``,
    `Upon incorporation, the Founders agree that equity shall be allocated`,
    `as follows:`,
    ``
  );

  for (const founder of agreement.founders) {
    if (founder.equityPercentage !== null) {
      lines.push(`${founder.name}: ${founder.equityPercentage}%`);

      if (founder.vestingSchedule) {
        const vs = founder.vestingSchedule;
        lines.push(
          `   Vesting: ${vs.totalMonths} months with ${vs.cliffMonths}-month cliff`
        );
        if (vs.accelerationOnExit) {
          lines.push(`   Single-trigger acceleration on change of control`);
        }
      }
      lines.push(``);
    }
  }

  lines.push(``);

  // Contributions
  const foundersWithContributions = agreement.founders.filter(
    (f) => f.contributions.length > 0
  );
  if (foundersWithContributions.length > 0) {
    lines.push(
      `ARTICLE IV - CONTRIBUTIONS`,
      `──────────────────────────`,
      ``,
      `Each Founder acknowledges the following contributions:`,
      ``
    );

    for (const founder of foundersWithContributions) {
      lines.push(`${founder.name}:`);
      for (const contrib of founder.contributions) {
        const preExisting = contrib.preExisting
          ? " [PRE-EXISTING - requires IP assignment]"
          : "";
        lines.push(`   - ${formatContributionType(contrib.type)}: ${contrib.description}${preExisting}`);
      }
      lines.push(``);
    }
    lines.push(``);
  }

  // Decision Making
  if (agreement.decisionMaking) {
    const dm = agreement.decisionMaking;
    lines.push(
      `ARTICLE V - GOVERNANCE AND DECISION-MAKING`,
      `───────────────────────────────────────────`,
      ``,
      `A. Voting Structure`,
      ``,
      `   ${formatVotingStructure(dm.votingStructure)}`,
      ``
    );

    if (dm.unanimousDecisions.length > 0) {
      lines.push(`B. Decisions Requiring Unanimous Consent`, ``);
      dm.unanimousDecisions.forEach((d, i) => {
        lines.push(`   ${i + 1}. ${d}`);
      });
      lines.push(``);
    }

    if (dm.majorityDecisions.length > 0) {
      lines.push(`C. Decisions Requiring Majority Vote`, ``);
      dm.majorityDecisions.forEach((d, i) => {
        lines.push(`   ${i + 1}. ${d}`);
      });
      lines.push(``);
    }

    lines.push(`D. Deadlock Resolution`, ``, `   ${dm.deadlockResolution}`, ``, ``);
  }

  // Exit Scenarios
  if (agreement.exitScenarios) {
    const es = agreement.exitScenarios;
    lines.push(
      `ARTICLE VI - DEPARTURE AND EXIT`,
      `────────────────────────────────`,
      ``,
      `A. Voluntary Departure`,
      ``,
      `   If a Founder voluntarily departs:`,
      `   - Unvested equity: Forfeited to the Company`,
      `   - Vested equity buyback: ${es.voluntaryDeparture.buybackTerms}`,
      `   - Non-compete period: ${es.voluntaryDeparture.nonCompetePeriodMonths} months`,
      `   - Acceleration: ${es.voluntaryDeparture.vestingAcceleration ? "Yes" : "No"}`,
      ``,
      `B. Involuntary Departure`,
      ``,
      `   For Cause (fraud, breach of fiduciary duty, etc.):`,
      `   ${es.involuntaryDeparture.forCauseTerms}`,
      ``,
      `   Without Cause:`,
      `   ${es.involuntaryDeparture.withoutCauseTerms}`,
      ``,
      `C. Company Sale or Exit`,
      ``,
      `   Distribution: ${es.companyExit.saleDistribution}`,
      `   Intellectual Property: ${es.companyExit.ipOwnership}`,
      ``,
      ``
    );
  }

  // Custom Fields
  if (agreement.customFields.length > 0) {
    lines.push(`ARTICLE VII - ADDITIONAL TERMS`, `──────────────────────────────`, ``);

    agreement.customFields.forEach((field, i) => {
      lines.push(`${i + 1}. ${field.label}`, ``, `   ${field.value}`, ``);
    });
    lines.push(``);
  }

  // Signature Block
  lines.push(
    `═══════════════════════════════════════════════════════════════════`,
    ``,
    `ACKNOWLEDGMENT`,
    ``,
    `By proceeding with incorporation through Stripe Atlas, each Founder`,
    `acknowledges that they have reviewed this Agreement and that it`,
    `accurately reflects their understanding and intentions.`,
    ``,
    `This Agreement is intended to guide formal legal documentation and`,
    `does not create legally binding obligations until formalized with`,
    `proper legal counsel.`,
    ``,
    ``,
    `FOUNDERS:`,
    ``
  );

  for (const founder of agreement.founders) {
    lines.push(
      `_________________________________`,
      `${founder.name}`,
      `Date: _______________`,
      ``
    );
  }

  lines.push(
    ``,
    `═══════════════════════════════════════════════════════════════════`,
    `Generated by Stripe Atlas Pre-Incorporation Tool`,
    `This document was generated on ${new Date().toISOString()}`,
    `═══════════════════════════════════════════════════════════════════`
  );

  return lines.join("\n");
}

function formatContributionType(type: string): string {
  const types: Record<string, string> = {
    ip: "Intellectual Property",
    capital: "Capital Investment",
    sweat_equity: "Sweat Equity",
    idea: "Original Idea/Concept",
    other: "Other",
  };
  return types[type] || type;
}
