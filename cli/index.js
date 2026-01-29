#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs";
import path from "path";

// Stub co-founder data (pre-completed for demo)
const stubCoFounder = {
  name: "Jamie Chen",
  email: "jamie@example.com",
  role: "CTO",
  equity: 40,
  vestingMonths: 48,
  cliffMonths: 12,
  contributions: [
    { type: "IP", description: "Initial prototype code (3 months development)", value: 50000 },
    { type: "Capital", description: "Seed capital investment", value: 25000 },
  ],
  exitTerms: {
    voluntaryDeparture: "Unvested shares return to pool",
    nonCompeteMonths: 12,
    involuntaryAcceleration: 6,
  },
  customTerms: "Rights to contribute to non-competing open source projects",
};

// Helper functions
function printHeader() {
  console.clear();
  console.log(chalk.bold.hex("#635bff")("\n╔════════════════════════════════════════════════════════════╗"));
  console.log(chalk.bold.hex("#635bff")("║     Pre-Incorporation Founders Agreement Tool (CLI)        ║"));
  console.log(chalk.bold.hex("#635bff")("╚════════════════════════════════════════════════════════════╝\n"));
}

function printSection(title) {
  console.log(chalk.bold.cyan(`\n── ${title} ${"─".repeat(50 - title.length)}\n`));
}

function printInfo(label, value) {
  console.log(`  ${chalk.gray(label + ":")} ${value}`);
}

// Main interview flow
async function runInterview() {
  printHeader();

  console.log(chalk.gray("This tool helps co-founders align on key decisions before incorporating."));
  console.log(chalk.gray("Your responses will be used to generate a founders agreement document.\n"));

  console.log(chalk.yellow("Note: A demo co-founder (Jamie Chen) is pre-populated for this prototype.\n"));

  // Company Information
  printSection("Company Information");

  const companyInfo = await inquirer.prompt([
    {
      type: "input",
      name: "companyName",
      message: "What is your company name?",
      default: "Acme Inc",
    },
    {
      type: "input",
      name: "companyDescription",
      message: "Brief description of what your company does:",
      default: "Building innovative solutions for modern businesses",
    },
  ]);

  // Founder Information
  printSection("Your Information");

  const founderInfo = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "What is your name?",
      validate: (input) => input.length > 0 || "Name is required",
    },
    {
      type: "input",
      name: "email",
      message: "What is your email?",
      validate: (input) => input.includes("@") || "Please enter a valid email",
    },
    {
      type: "input",
      name: "role",
      message: "What is your role? (e.g., CEO, CTO, COO)",
      default: "CEO",
    },
  ]);

  // Equity Section
  printSection("Equity & Vesting");

  console.log(chalk.gray(`  Note: Jamie Chen (CTO) has agreed to ${stubCoFounder.equity}% equity\n`));

  const equityInfo = await inquirer.prompt([
    {
      type: "number",
      name: "equity",
      message: "What equity percentage will you have?",
      default: 60,
      validate: (input) => {
        const total = input + stubCoFounder.equity;
        if (total > 100) return `Total equity would be ${total}%. Must be <= 100%`;
        return true;
      },
    },
    {
      type: "list",
      name: "vestingMonths",
      message: "Vesting schedule (months)?",
      choices: [
        { name: "3 years (36 months)", value: 36 },
        { name: "4 years (48 months) - Standard", value: 48 },
        { name: "5 years (60 months)", value: 60 },
      ],
      default: 1,
    },
    {
      type: "list",
      name: "cliffMonths",
      message: "Cliff period (months)?",
      choices: [
        { name: "6 months", value: 6 },
        { name: "12 months - Standard", value: 12 },
        { name: "18 months", value: 18 },
      ],
      default: 1,
    },
  ]);

  // Contributions Section
  printSection("Contributions");

  console.log(chalk.gray("  What are you contributing to the company?\n"));

  const contributions = [];

  const addContribution = async () => {
    const contrib = await inquirer.prompt([
      {
        type: "list",
        name: "type",
        message: "Contribution type:",
        choices: ["IP (Intellectual Property)", "Capital", "Equipment", "Other"],
      },
      {
        type: "input",
        name: "description",
        message: "Description:",
      },
      {
        type: "number",
        name: "value",
        message: "Estimated value ($):",
        default: 0,
      },
      {
        type: "confirm",
        name: "addMore",
        message: "Add another contribution?",
        default: false,
      },
    ]);

    contributions.push({
      type: contrib.type.split(" ")[0],
      description: contrib.description,
      value: contrib.value,
    });

    if (contrib.addMore) {
      await addContribution();
    }
  };

  const { hasContributions } = await inquirer.prompt([
    {
      type: "confirm",
      name: "hasContributions",
      message: "Do you have contributions to add (IP, capital, etc.)?",
      default: true,
    },
  ]);

  if (hasContributions) {
    await addContribution();
  }

  // Decision Making Section
  printSection("Decision Making");

  const decisionMaking = await inquirer.prompt([
    {
      type: "checkbox",
      name: "unanimousDecisions",
      message: "Which decisions require unanimous founder consent?",
      choices: [
        { name: "Raising funding", checked: true },
        { name: "Selling the company", checked: true },
        { name: "Taking on debt over $50,000", checked: true },
        { name: "Hiring executives", checked: false },
        { name: "Pivoting the business model", checked: false },
        { name: "Issuing new equity", checked: true },
      ],
    },
    {
      type: "list",
      name: "deadlockResolution",
      message: "How should deadlocks be resolved?",
      choices: [
        "CEO has tie-breaking vote",
        "External mediator",
        "Board of advisors vote",
        "Buyout provision triggered",
      ],
    },
  ]);

  // Exit Scenarios Section
  printSection("Exit Scenarios");

  const exitScenarios = await inquirer.prompt([
    {
      type: "list",
      name: "voluntaryDeparture",
      message: "If a founder leaves voluntarily, what happens to unvested shares?",
      choices: [
        "Return to company pool",
        "Bought out at fair market value",
        "Distributed to remaining founders",
      ],
    },
    {
      type: "number",
      name: "nonCompeteMonths",
      message: "Non-compete period after departure (months)?",
      default: 12,
    },
    {
      type: "confirm",
      name: "accelerationOnSale",
      message: "Should vesting accelerate if the company is sold?",
      default: true,
    },
  ]);

  // Custom Terms Section
  printSection("Custom Terms");

  const customTerms = await inquirer.prompt([
    {
      type: "editor",
      name: "terms",
      message: "Any custom terms or special arrangements? (Opens editor, or leave blank)",
      default: "",
    },
  ]);

  // Generate Agreement
  printSection("Generating Agreement");

  const agreement = {
    company: companyInfo,
    founders: [
      {
        ...founderInfo,
        equity: equityInfo.equity,
        vestingMonths: equityInfo.vestingMonths,
        cliffMonths: equityInfo.cliffMonths,
        contributions,
      },
      stubCoFounder,
    ],
    decisionMaking: {
      unanimousDecisions: decisionMaking.unanimousDecisions,
      deadlockResolution: decisionMaking.deadlockResolution,
    },
    exitScenarios: {
      voluntaryDeparture: exitScenarios.voluntaryDeparture,
      nonCompeteMonths: exitScenarios.nonCompeteMonths,
      accelerationOnSale: exitScenarios.accelerationOnSale,
    },
    customTerms: customTerms.terms,
    createdAt: new Date().toISOString(),
  };

  return agreement;
}

// Generate export formats
function generateMarkdown(agreement) {
  const { company, founders, decisionMaking, exitScenarios, customTerms } = agreement;

  let md = `# Pre-Incorporation Founders Agreement

## ${company.companyName}

${company.companyDescription}

**Generated:** ${new Date().toLocaleDateString()}

---

## Founders

`;

  founders.forEach((f, i) => {
    md += `### ${i + 1}. ${f.name} (${f.role})
- **Email:** ${f.email}
- **Equity:** ${f.equity}%
- **Vesting:** ${f.vestingMonths} months with ${f.cliffMonths}-month cliff

`;
    if (f.contributions && f.contributions.length > 0) {
      md += `**Contributions:**\n`;
      f.contributions.forEach((c) => {
        md += `- ${c.type}: ${c.description} ($${c.value.toLocaleString()})\n`;
      });
      md += "\n";
    }
  });

  md += `---

## Equity Summary

| Founder | Role | Equity | Vesting |
|---------|------|--------|---------|
`;

  founders.forEach((f) => {
    md += `| ${f.name} | ${f.role} | ${f.equity}% | ${f.vestingMonths}mo / ${f.cliffMonths}mo cliff |\n`;
  });

  const totalEquity = founders.reduce((sum, f) => sum + f.equity, 0);
  md += `| **Total** | | **${totalEquity}%** | |\n`;

  if (totalEquity < 100) {
    md += `| *Unallocated* | | *${100 - totalEquity}%* | |\n`;
  }

  md += `
---

## Decision Making

**Unanimous Consent Required For:**
${decisionMaking.unanimousDecisions.map((d) => `- ${d}`).join("\n")}

**Deadlock Resolution:** ${decisionMaking.deadlockResolution}

---

## Exit Scenarios

- **Voluntary Departure:** ${exitScenarios.voluntaryDeparture}
- **Non-Compete Period:** ${exitScenarios.nonCompeteMonths} months
- **Acceleration on Sale:** ${exitScenarios.accelerationOnSale ? "Yes" : "No"}

`;

  if (customTerms && customTerms.trim()) {
    md += `---

## Custom Terms

${customTerms}

`;
  }

  md += `---

## Disclaimer

This document is a preliminary agreement tool and does not constitute legal advice.
Please consult with a qualified attorney before incorporating.

*Generated by Pre-Incorporation Founders Agreement Tool*
`;

  return md;
}

function generateYAML(agreement) {
  const { company, founders, decisionMaking, exitScenarios, customTerms } = agreement;

  let yaml = `# Pre-Incorporation Founders Agreement
# Generated: ${new Date().toISOString()}

company:
  name: "${company.companyName}"
  description: "${company.companyDescription}"

founders:
`;

  founders.forEach((f) => {
    yaml += `  - name: "${f.name}"
    email: "${f.email}"
    role: "${f.role}"
    equity_percentage: ${f.equity}
    vesting:
      total_months: ${f.vestingMonths}
      cliff_months: ${f.cliffMonths}
`;
    if (f.contributions && f.contributions.length > 0) {
      yaml += `    contributions:\n`;
      f.contributions.forEach((c) => {
        yaml += `      - type: "${c.type}"
        description: "${c.description}"
        value: ${c.value}\n`;
      });
    }
  });

  yaml += `
decision_making:
  unanimous_consent:
${decisionMaking.unanimousDecisions.map((d) => `    - "${d}"`).join("\n")}
  deadlock_resolution: "${decisionMaking.deadlockResolution}"

exit_scenarios:
  voluntary_departure: "${exitScenarios.voluntaryDeparture}"
  non_compete_months: ${exitScenarios.nonCompeteMonths}
  acceleration_on_sale: ${exitScenarios.accelerationOnSale}
`;

  if (customTerms && customTerms.trim()) {
    yaml += `
custom_terms: |
  ${customTerms.split("\n").join("\n  ")}
`;
  }

  return yaml;
}

// Main execution
async function main() {
  try {
    const agreement = await runInterview();

    // Show summary
    printSection("Agreement Summary");

    console.log(chalk.bold("\nCompany:"), agreement.company.companyName);
    console.log(chalk.bold("Founders:"));
    agreement.founders.forEach((f) => {
      const isStub = f.email === "jamie@example.com";
      console.log(`  - ${f.name} (${f.role}): ${f.equity}%${isStub ? chalk.yellow(" [Demo]") : ""}`);
    });

    const totalEquity = agreement.founders.reduce((sum, f) => sum + f.equity, 0);
    console.log(chalk.bold("\nTotal Equity Allocated:"), `${totalEquity}%`);

    // Export options
    printSection("Export Options");

    const { exportChoice } = await inquirer.prompt([
      {
        type: "list",
        name: "exportChoice",
        message: "How would you like to export?",
        choices: [
          { name: "Save as Markdown (.md)", value: "md" },
          { name: "Save as YAML (.yaml)", value: "yaml" },
          { name: "Save both formats", value: "both" },
          { name: "Print to console only", value: "console" },
          { name: "Exit without saving", value: "exit" },
        ],
      },
    ]);

    const timestamp = new Date().toISOString().split("T")[0];
    const baseFilename = `${agreement.company.companyName.toLowerCase().replace(/\s+/g, "-")}-agreement-${timestamp}`;

    if (exportChoice === "exit") {
      console.log(chalk.yellow("\nExiting without saving. Goodbye!"));
      return;
    }

    if (exportChoice === "console") {
      console.log(chalk.bold("\n═══ MARKDOWN OUTPUT ═══\n"));
      console.log(generateMarkdown(agreement));
      return;
    }

    const outputDir = process.cwd();

    if (exportChoice === "md" || exportChoice === "both") {
      const mdPath = path.join(outputDir, `${baseFilename}.md`);
      fs.writeFileSync(mdPath, generateMarkdown(agreement));
      console.log(chalk.green(`\n✓ Saved: ${mdPath}`));
    }

    if (exportChoice === "yaml" || exportChoice === "both") {
      const yamlPath = path.join(outputDir, `${baseFilename}.yaml`);
      fs.writeFileSync(yamlPath, generateYAML(agreement));
      console.log(chalk.green(`✓ Saved: ${yamlPath}`));
    }

    console.log(chalk.bold.green("\n✓ Agreement generated successfully!"));
    console.log(chalk.gray("\nRemember: This is a preliminary tool. Please consult with an attorney before incorporating.\n"));
  } catch (error) {
    if (error.name === "ExitPromptError") {
      console.log(chalk.yellow("\n\nExiting. Goodbye!"));
    } else {
      console.error(chalk.red("\nError:"), error.message);
    }
  }
}

main();
