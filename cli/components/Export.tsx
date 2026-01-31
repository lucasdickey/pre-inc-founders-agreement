import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import * as fs from 'fs';
import * as path from 'path';

interface ExportProps {
  data: Record<string, unknown>;
  coFounders: Array<Record<string, unknown>>;
  outputPath: string;
  outputFormat: string;
  onComplete: () => void;
}

export function Export({ data, coFounders, outputPath, outputFormat, onComplete }: ExportProps) {
  const [status, setStatus] = useState<'generating' | 'writing' | 'done' | 'error'>('generating');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      try {
        setStatus('generating');

        let content: string;
        if (outputFormat === 'yaml') {
          content = generateYAML(data, coFounders);
        } else if (outputFormat === 'json') {
          content = generateJSON(data, coFounders);
        } else {
          content = generateMarkdown(data, coFounders);
        }

        setStatus('writing');

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, content, 'utf-8');

        setStatus('done');
        setTimeout(onComplete, 500);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    generate();
  }, [data, coFounders, outputPath, outputFormat, onComplete]);

  return (
    <Box flexDirection="column" marginTop={1}>
      {status === 'generating' && (
        <Box>
          <Text color="cyan"><Spinner type="dots" /></Text>
          <Text> Generating agreement...</Text>
        </Box>
      )}
      {status === 'writing' && (
        <Box>
          <Text color="cyan"><Spinner type="dots" /></Text>
          <Text> Writing to {outputPath}...</Text>
        </Box>
      )}
      {status === 'done' && (
        <Box>
          <Text color="green">✓</Text>
          <Text> Agreement saved to {outputPath}</Text>
        </Box>
      )}
      {status === 'error' && (
        <Box flexDirection="column">
          <Text color="red">✗ Error: {error}</Text>
        </Box>
      )}
    </Box>
  );
}

function generateMarkdown(data: Record<string, unknown>, coFounders: Array<Record<string, unknown>>): string {
  const date = new Date().toISOString().split('T')[0];
  const ceoEquity = Number(data.ceoEquity) || 0;

  let md = `# Pre-Incorporation Founders Agreement

## ${data.companyName || 'Company Name'}

${data.companyDescription || 'Company description'}

**Generated:** ${date}

---

## Founders

### 1. ${data.ceoName} (${data.ceoRole})
- **Email:** ${data.ceoEmail}
- **Responsibilities:** ${data.ceoResponsibilities}
- **Equity:** ${data.ceoEquity}%
- **Vesting:** ${data.ceoVestingPeriod} months with ${data.ceoCliffPeriod}-month cliff, starting ${data.ceoVestingStartDate}
- **Commitment:** ${data.ceoCommitment}
- **Acceleration:** ${data.ceoAcceleration}

**Contributions:**
${data.hasIP ? `- IP: ${data.ipDescription}${data.ipValue ? ` ($${data.ipValue})` : ''} [${data.ipPreExisting || 'Not specified'}]` : ''}
${data.hasCapital ? `- Capital: $${data.capitalAmount}` : ''}
${data.hasEquipment ? `- Equipment: ${data.equipmentDescription} [${data.equipmentPreExisting || 'Not specified'}]` : ''}
${data.hasSweatEquity ? `- Sweat Equity: ${data.sweatEquityDescription}${data.sweatEquityValue ? ` ($${data.sweatEquityValue})` : ''}` : ''}
${!data.hasIP && !data.hasCapital && !data.hasEquipment && !data.hasSweatEquity ? '- None specified' : ''}

`;

  coFounders.forEach((cf, i) => {
    md += `### ${i + 2}. ${cf.name} (${cf.role})
- **Email:** ${cf.email}
- **Responsibilities:** ${cf.responsibilities}
- **Equity:** ${cf.equity}%
- **Vesting:** ${cf.vestingMatch ? `Matches founder 1` : 'Custom terms'}
- **Vesting Start:** ${cf.vestingStartDate}
- **Commitment:** ${cf.commitment}
- **Acceleration:** ${cf.accelerationMatch ? 'Matches founder 1' : 'Custom terms'}

`;
  });

  md += `---

## Equity Summary

| Founder | Role | Equity | Vesting | Start Date |
|---------|------|--------|---------|------------|
| ${data.ceoName} | ${data.ceoRole} | ${data.ceoEquity}% | ${data.ceoVestingPeriod}mo / ${data.ceoCliffPeriod}mo cliff | ${data.ceoVestingStartDate} |
`;

  coFounders.forEach(cf => {
    md += `| ${cf.name} | ${cf.role} | ${cf.equity}% | ${cf.vestingMatch ? 'Same as above' : 'Custom'} | ${cf.vestingStartDate} |
`;
  });

  const totalEquity = ceoEquity + coFounders.reduce((sum, cf) => sum + (Number(cf.equity) || 0), 0);
  md += `| **Total** | | **${totalEquity}%** | | |

---

## Decision Making

**Unanimous Consent Required For:**
${data.unanimousDecisions}

**Day-to-Day Decisions:** ${data.dayToDay}

**Deadlock Resolution:** ${data.deadlockResolution}

---

## Exit Scenarios

### Voluntary Departure
- **Unvested Shares:** ${data.voluntaryUnvested}
- **Vested Shares:** ${data.voluntaryVested}
- **Notice Period:** ${data.noticePeriod} days

### Involuntary Termination
- **For Cause:** ${data.forCauseTerms}
- **Without Cause:** ${data.withoutCauseTerms}
- **Acceleration on Termination Without Cause:** ${data.involuntaryAcceleration}

### Non-Compete
- **Duration:** ${data.nonCompeteDuration} months
- **Geographic Scope:** ${data.nonCompeteGeo}
- **Industry Scope:** ${data.nonCompeteIndustry}

### Company Sale
- **Acceleration:** ${data.saleAcceleration}
- **Drag-Along Rights:** ${data.dragAlong ? 'Yes' : 'No'}
- **Tag-Along Rights:** ${data.tagAlong ? 'Yes' : 'No'}

---

## Custom Terms

${data.sideProjects ? `**Side Projects:** ${data.sideProjects}` : ''}
${data.moonlighting ? `**Moonlighting:** ${data.moonlighting}` : ''}
${data.ipExceptions ? `**IP Exceptions:** ${data.ipExceptions}` : ''}
${data.otherTerms ? `**Other:** ${data.otherTerms}` : ''}

---

## Conflict Resolution

If co-founders disagree on any terms after reviewing:

| Conflict Type | How to Resolve |
|---------------|----------------|
| Equity split | Schedule a call to discuss contributions and expectations. Consider involving a neutral advisor. |
| Vesting terms | Review industry standards. Discuss why terms should differ between founders. |
| Decision-making | Clarify roles and responsibilities. CEO tie-breaker is standard but requires trust. |
| Exit scenarios | Focus on fairness in both directions—what if you leave vs. what if they leave? |

**Flag for discussion:** Items where founders expressed uncertainty should be discussed before signing. Review the terms above and note any that need further conversation.

---

## Next Steps

1. [ ] Share this document with all co-founders for review
2. [ ] Each co-founder signs to confirm agreement
3. [ ] Resolve any conflicts (see Conflict Resolution above)
4. [ ] Consult with a startup attorney
5. [ ] Formalize into a legal agreement
6. [ ] Consider using Stripe Atlas for incorporation

---

## Disclaimer

This document is a preliminary alignment tool and does not constitute legal advice.
The terms outlined here should be reviewed by a qualified attorney and formalized
into legally binding documents before incorporation.

*Generated by Pre-Incorporation Founders Agreement CLI*
`;

  return md;
}

function generateYAML(data: Record<string, unknown>, coFounders: Array<Record<string, unknown>>): string {
  const yaml = `# Founders Agreement
# Generated: ${new Date().toISOString()}

company:
  name: "${data.companyName}"
  description: "${data.companyDescription}"
  stage: "${data.companyStage}"

founders:
  - name: "${data.ceoName}"
    email: "${data.ceoEmail}"
    role: "${data.ceoRole}"
    responsibilities: "${data.ceoResponsibilities}"
    equity: ${data.ceoEquity}
    vesting:
      period_months: ${data.ceoVestingPeriod}
      cliff_months: ${data.ceoCliffPeriod}
      frequency: "${data.ceoVestingFrequency}"
      start_date: "${data.ceoVestingStartDate}"
      acceleration: "${data.ceoAcceleration}"
    commitment: "${data.ceoCommitment}"
    contributions:
      ip:
        has: ${data.hasIP}
        description: "${data.ipDescription || ''}"
        value: ${data.ipValue || 0}
        pre_existing: "${data.ipPreExisting || ''}"
      capital:
        has: ${data.hasCapital}
        amount: ${data.capitalAmount || 0}
      equipment:
        has: ${data.hasEquipment}
        description: "${data.equipmentDescription || ''}"
        pre_existing: "${data.equipmentPreExisting || ''}"
      sweat_equity:
        has: ${data.hasSweatEquity}
        description: "${data.sweatEquityDescription || ''}"
        value: ${data.sweatEquityValue || 0}
${coFounders.map(cf => `
  - name: "${cf.name}"
    email: "${cf.email}"
    role: "${cf.role}"
    responsibilities: "${cf.responsibilities}"
    equity: ${cf.equity}
    vesting:
      matches_founder_1: ${cf.vestingMatch}
      start_date: "${cf.vestingStartDate}"
    acceleration:
      matches_founder_1: ${cf.accelerationMatch}
    commitment: "${cf.commitment}"`).join('')}

decision_making:
  unanimous_decisions: "${data.unanimousDecisions}"
  day_to_day: "${data.dayToDay}"
  deadlock_resolution: "${data.deadlockResolution}"

exit_scenarios:
  voluntary:
    unvested_shares: "${data.voluntaryUnvested}"
    vested_shares: "${data.voluntaryVested}"
    notice_period_days: ${data.noticePeriod}
  involuntary:
    for_cause: "${data.forCauseTerms}"
    without_cause: "${data.withoutCauseTerms}"
    acceleration: "${data.involuntaryAcceleration}"
  non_compete:
    duration_months: ${data.nonCompeteDuration}
    geographic_scope: "${data.nonCompeteGeo}"
    industry_scope: "${data.nonCompeteIndustry}"
  company_sale:
    acceleration: "${data.saleAcceleration}"
    drag_along: ${data.dragAlong}
    tag_along: ${data.tagAlong}

custom_terms:
  side_projects: "${data.sideProjects || ''}"
  moonlighting: "${data.moonlighting || ''}"
  ip_exceptions: "${data.ipExceptions || ''}"
  other: "${data.otherTerms || ''}"
`;

  return yaml;
}

function generateJSON(data: Record<string, unknown>, coFounders: Array<Record<string, unknown>>): string {
  const agreement = {
    generated: new Date().toISOString(),
    company: {
      name: data.companyName,
      description: data.companyDescription,
      stage: data.companyStage,
    },
    founders: [
      {
        name: data.ceoName,
        email: data.ceoEmail,
        role: data.ceoRole,
        responsibilities: data.ceoResponsibilities,
        equity: data.ceoEquity,
        vesting: {
          periodMonths: data.ceoVestingPeriod,
          cliffMonths: data.ceoCliffPeriod,
          frequency: data.ceoVestingFrequency,
          startDate: data.ceoVestingStartDate,
          acceleration: data.ceoAcceleration,
        },
        commitment: data.ceoCommitment,
        contributions: {
          ip: {
            has: data.hasIP,
            description: data.ipDescription,
            value: data.ipValue,
            preExisting: data.ipPreExisting,
          },
          capital: {
            has: data.hasCapital,
            amount: data.capitalAmount,
          },
          equipment: {
            has: data.hasEquipment,
            description: data.equipmentDescription,
            preExisting: data.equipmentPreExisting,
          },
          sweatEquity: {
            has: data.hasSweatEquity,
            description: data.sweatEquityDescription,
            value: data.sweatEquityValue,
          },
        },
      },
      ...coFounders.map(cf => ({
        name: cf.name,
        email: cf.email,
        role: cf.role,
        responsibilities: cf.responsibilities,
        equity: cf.equity,
        vesting: {
          matchesFounder1: cf.vestingMatch,
          startDate: cf.vestingStartDate,
        },
        acceleration: {
          matchesFounder1: cf.accelerationMatch,
        },
        commitment: cf.commitment,
      })),
    ],
    decisionMaking: {
      unanimousDecisions: data.unanimousDecisions,
      dayToDay: data.dayToDay,
      deadlockResolution: data.deadlockResolution,
    },
    exitScenarios: {
      voluntary: {
        unvestedShares: data.voluntaryUnvested,
        vestedShares: data.voluntaryVested,
        noticePeriodDays: data.noticePeriod,
      },
      involuntary: {
        forCause: data.forCauseTerms,
        withoutCause: data.withoutCauseTerms,
        acceleration: data.involuntaryAcceleration,
      },
      nonCompete: {
        durationMonths: data.nonCompeteDuration,
        geographicScope: data.nonCompeteGeo,
        industryScope: data.nonCompeteIndustry,
      },
      companySale: {
        acceleration: data.saleAcceleration,
        dragAlong: data.dragAlong,
        tagAlong: data.tagAlong,
      },
    },
    customTerms: {
      sideProjects: data.sideProjects,
      moonlighting: data.moonlighting,
      ipExceptions: data.ipExceptions,
      other: data.otherTerms,
    },
  };

  return JSON.stringify(agreement, null, 2);
}
