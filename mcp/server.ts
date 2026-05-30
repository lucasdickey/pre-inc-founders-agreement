#!/usr/bin/env -S node --experimental-strip-types
/**
 * Atlas Incorporation MCP server.
 *
 * A proof-of-concept Model Context Protocol server that replicates the field
 * inputs of a Stripe Atlas incorporation application (Delaware C-Corp) as a set
 * of agent-callable tools. Designed to be reached from Claude or Codex.
 *
 *   Auth     — emulated Clerk: `authenticate` issues a sessionToken that scopes
 *              every record to its owner (passed on every subsequent call).
 *   Storage  — emulated database (JSON on disk) shaped like Supabase rows.
 *   Security — emulated secure vault: SSN/ITIN are sealed before storage and
 *              only ever returned masked. We emulate the boundary rather than
 *              wiring real KMS encryption.
 *
 * Run:  npm start   (inside mcp/)   or via the .mcp.json in the repo root.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { authenticate, AuthError, verifySessionToken } from "./src/auth.ts";
import { seal } from "./src/vault.ts";
import {
  getApplication,
  insertApplication,
  listApplicationsForUser,
  updateApplication,
} from "./src/store.ts";
import {
  ATLAS_DEFAULTS,
  createEmptyApplication,
  ENTITY_DESIGNATORS,
  FIELD_CATALOG,
  fullCompanyName,
  maskDeep,
  validateApplication,
  type Address,
  type EntityDesignator,
  type IncorporationApplication,
} from "./src/schema.ts";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const server = new McpServer({
  name: "atlas-incorporation-mcp",
  version: "0.1.0",
});

// --- result + guard helpers ------------------------------------------------

function ok(text: string, structured?: unknown): CallToolResult {
  const content: CallToolResult["content"] = [{ type: "text", text }];
  if (structured !== undefined) {
    content.push({ type: "text", text: JSON.stringify(structured, null, 2) });
  }
  return { content };
}

function fail(message: string): CallToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

/** Resolve a session token to an owned application, or throw a friendly error. */
function loadOwnedApp(
  sessionToken: string | undefined,
  applicationId: string
): IncorporationApplication {
  const actor = verifySessionToken(sessionToken);
  const app = getApplication(applicationId);
  if (!app) throw new AuthError(`No incorporation application found with id ${applicationId}.`);
  if (app.ownerUserId !== actor.userId) {
    throw new AuthError("This application belongs to a different account.");
  }
  return app;
}

/** Bump a draft application into the in_progress state on first edit. */
function touch(app: IncorporationApplication): void {
  if (app.status === "draft") app.status = "in_progress";
}

const sessionField = {
  sessionToken: z
    .string()
    .describe("Session token from `authenticate`. Required on every call."),
};

const addressShape = {
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().describe("Two-letter US state code, e.g. CA."),
  postalCode: z.string(),
  country: z.string().default("US"),
};

function toAddress(a: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}): Address {
  return { ...a };
}

// --- auth ------------------------------------------------------------------

server.registerTool(
  "authenticate",
  {
    title: "Authenticate (emulated Clerk)",
    description:
      "Sign in / sign up with an email to start an authenticated session. " +
      "Returns a sessionToken that must be passed to every other tool. " +
      "This emulates Clerk — no real credentials are validated.",
    inputSchema: {
      email: z.string().email().describe("Your email — establishes your identity."),
      password: z
        .string()
        .optional()
        .describe("Optional. Recorded only as a one-way marker in this POC."),
    },
  },
  async ({ email, password }) => {
    const result = authenticate(email, password);
    return ok(
      `Authenticated as ${result.email}.\n` +
        `Use this sessionToken on every subsequent call (expires ${result.expiresAt}).`,
      { sessionToken: result.sessionToken, userId: result.userId, expiresAt: result.expiresAt }
    );
  }
);

// --- application lifecycle -------------------------------------------------

server.registerTool(
  "create_incorporation",
  {
    title: "Start a new incorporation application",
    description:
      "Create a new Stripe Atlas Delaware C-Corp incorporation application, " +
      "pre-filled with Atlas defaults (10M authorized shares, $0.00001 par " +
      "value, DE registered agent). Returns the applicationId to use on the " +
      "remaining tools.",
    inputSchema: { ...sessionField },
  },
  async ({ sessionToken }) => {
    try {
      const actor = verifySessionToken(sessionToken);
      const app = createEmptyApplication(actor.userId);
      insertApplication(app);
      return ok(
        `Created incorporation application ${app.id}.\n` +
          `State: ${app.company.stateOfIncorporation} • Entity: ${app.company.entityType}.\n` +
          `Next: set_company_details, set_share_structure, add_founder, set_governance, ` +
          `set_principal_address, set_tax_responsible_party, then validate_incorporation.`,
        { applicationId: app.id, status: app.status }
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "list_incorporations",
  {
    title: "List my incorporation applications",
    description: "List all incorporation applications owned by the authenticated account.",
    inputSchema: { ...sessionField },
  },
  async ({ sessionToken }) => {
    try {
      const actor = verifySessionToken(sessionToken);
      const apps = listApplicationsForUser(actor.userId).map((a) => ({
        applicationId: a.id,
        company: fullCompanyName(a.company),
        status: a.status,
        founders: a.founders.length,
        updatedAt: a.updatedAt,
      }));
      return ok(`You have ${apps.length} application(s).`, apps);
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "get_incorporation",
  {
    title: "Get an incorporation application (masked)",
    description:
      "Return the full application record. Sensitive fields (SSN/ITIN) are " +
      "returned masked — plaintext is never exposed over MCP.",
    inputSchema: { ...sessionField, applicationId: z.string() },
  },
  async ({ sessionToken, applicationId }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      return ok(
        `${fullCompanyName(app.company)} — status: ${app.status}.`,
        maskDeep(app)
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

// --- field setters ---------------------------------------------------------

server.registerTool(
  "set_company_details",
  {
    title: "Set company details",
    description:
      "Set the company name, entity designator, backup names, and business " +
      "description. State (Delaware) and entity type (C-Corporation) are fixed " +
      "by Atlas and cannot be changed.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      legalName: z.string().describe("Base name without designator, e.g. 'Acme Robotics'."),
      designator: z
        .enum(ENTITY_DESIGNATORS as [EntityDesignator, ...EntityDesignator[]])
        .default("Inc."),
      nameOptions: z
        .array(z.string())
        .max(2)
        .optional()
        .describe("Up to two backup names if the first is taken in Delaware."),
      businessDescription: z.string().describe("Plain-language description of the business."),
      website: z.string().url().optional(),
    },
  },
  async ({ sessionToken, applicationId, legalName, designator, nameOptions, businessDescription, website }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      app.company.legalName = legalName;
      app.company.designator = designator;
      if (nameOptions) app.company.nameOptions = nameOptions;
      app.company.businessDescription = businessDescription;
      if (website) app.company.website = website;
      touch(app);
      updateApplication(app);
      return ok(`Company set to "${fullCompanyName(app.company)}".`, maskDeep(app.company));
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "set_share_structure",
  {
    title: "Set share structure / capitalization",
    description:
      "Configure authorized shares, par value, shares issued at formation, and " +
      "price per share. Defaults follow the Atlas standard.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      authorizedShares: z.number().int().positive().default(ATLAS_DEFAULTS.authorizedShares),
      parValuePerShare: z.number().positive().default(ATLAS_DEFAULTS.parValuePerShare),
      sharesIssuedAtFormation: z.number().int().positive(),
      pricePerShare: z.number().positive().default(ATLAS_DEFAULTS.pricePerShare),
    },
  },
  async ({ sessionToken, applicationId, authorizedShares, parValuePerShare, sharesIssuedAtFormation, pricePerShare }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      if (sharesIssuedAtFormation > authorizedShares) {
        return fail(
          `Shares issued (${sharesIssuedAtFormation}) cannot exceed authorized shares (${authorizedShares}).`
        );
      }
      app.shareStructure = {
        authorizedShares,
        parValuePerShare,
        sharesIssuedAtFormation,
        pricePerShare,
      };
      touch(app);
      updateApplication(app);
      return ok("Share structure updated.", app.shareStructure);
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "set_principal_address",
  {
    title: "Set principal business address",
    description: "Set the company's principal business / mailing address.",
    inputSchema: { ...sessionField, applicationId: z.string(), ...addressShape },
  },
  async ({ sessionToken, applicationId, line1, line2, city, state, postalCode, country }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      app.principalAddress = toAddress({ line1, line2, city, state, postalCode, country });
      touch(app);
      updateApplication(app);
      return ok("Principal business address updated.", app.principalAddress);
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "add_founder",
  {
    title: "Add a founder / stockholder",
    description:
      "Add a founder with their share allocation and (optionally) their SSN/ITIN. " +
      "The SSN/ITIN is sealed by the secure vault on the way in and is only ever " +
      "returned masked. Call once per founder.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      fullName: z.string(),
      email: z.string().email(),
      title: z.string().describe("e.g. CEO, CTO."),
      shares: z.number().int().positive().describe("Shares allocated at formation."),
      citizenshipCountry: z.string().default("US"),
      considerationType: z
        .enum(["cash", "ip_assignment", "services", "mixed"])
        .default("cash"),
      ssnOrItin: z
        .string()
        .optional()
        .describe("Sensitive. Sealed by the vault; never stored or returned in plaintext."),
      plans83bElection: z.boolean().default(true),
      mailingAddress: z.object(addressShape).optional(),
      vesting: z
        .object({
          totalMonths: z.number().int().positive().default(48),
          cliffMonths: z.number().int().nonnegative().default(12),
          accelerationOnExit: z.boolean().default(false),
        })
        .optional(),
    },
  },
  async (args) => {
    try {
      const app = loadOwnedApp(args.sessionToken, args.applicationId);
      const founder = {
        id: `founder_${app.founders.length + 1}`,
        fullName: args.fullName,
        email: args.email,
        title: args.title,
        mailingAddress: args.mailingAddress ? toAddress(args.mailingAddress) : null,
        citizenshipCountry: args.citizenshipCountry,
        shares: args.shares,
        considerationType: args.considerationType,
        vesting: args.vesting ?? null,
        ssnOrItin: args.ssnOrItin ? seal(args.ssnOrItin, "tax_id") : null,
        plans83bElection: args.plans83bElection,
      };
      app.founders.push(founder);
      touch(app);
      updateApplication(app);
      const totalAllocated = app.founders.reduce((s, f) => s + f.shares, 0);
      return ok(
        `Added founder ${founder.fullName} (${founder.shares} shares). ` +
          `Total allocated across ${app.founders.length} founder(s): ${totalAllocated}.` +
          (founder.ssnOrItin ? ` SSN/ITIN sealed as ${founder.ssnOrItin.masked}.` : ""),
        maskDeep(founder)
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "set_governance",
  {
    title: "Set directors and officers",
    description:
      "Set the initial board of directors and the officer roster (President, " +
      "Secretary, Treasurer at minimum). Optionally override the incorporator.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      directors: z.array(z.object({ fullName: z.string() })).min(1),
      officers: z
        .array(z.object({ title: z.string(), holderName: z.string() }))
        .min(1)
        .describe("e.g. [{title:'President', holderName:'Jane Doe'}, ...]"),
      incorporatorName: z.string().optional(),
    },
  },
  async ({ sessionToken, applicationId, directors, officers, incorporatorName }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      app.governance.directors = directors;
      app.governance.officers = officers;
      if (incorporatorName) app.governance.incorporatorName = incorporatorName;
      touch(app);
      updateApplication(app);
      return ok(
        `Governance set: ${directors.length} director(s), ${officers.length} officer(s).`,
        app.governance
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "set_tax_responsible_party",
  {
    title: "Set EIN responsible party (IRS Form SS-4)",
    description:
      "Configure the EIN filing. The responsible party's SSN/ITIN is sealed by " +
      "the secure vault and only ever returned masked.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      fileForEin: z.boolean().default(true),
      fullName: z.string().describe("Responsible party full name."),
      ssnOrItin: z
        .string()
        .optional()
        .describe("Sensitive. Sealed by the vault. Omit if the party has no US tax id."),
      hasUsTaxId: z.boolean().default(true),
      fiscalYearEndMonth: z.string().default("December"),
    },
  },
  async ({ sessionToken, applicationId, fileForEin, fullName, ssnOrItin, hasUsTaxId, fiscalYearEndMonth }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      app.taxFiling.fileForEin = fileForEin;
      app.taxFiling.fiscalYearEndMonth = fiscalYearEndMonth;
      app.taxFiling.responsibleParty = {
        fullName,
        ssnOrItin: ssnOrItin ? seal(ssnOrItin, "tax_id") : null,
        hasUsTaxId,
      };
      touch(app);
      updateApplication(app);
      return ok(
        `EIN filing ${fileForEin ? "enabled" : "disabled"}; responsible party set to ${fullName}.` +
          (app.taxFiling.responsibleParty.ssnOrItin
            ? ` SSN/ITIN sealed as ${app.taxFiling.responsibleParty.ssnOrItin.masked}.`
            : ""),
        maskDeep(app.taxFiling)
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

// --- validate + submit -----------------------------------------------------

server.registerTool(
  "validate_incorporation",
  {
    title: "Validate the application",
    description:
      "Run Atlas-style completeness checks. Returns the list of blocking gaps; " +
      "an empty list means the application is ready to submit.",
    inputSchema: { ...sessionField, applicationId: z.string() },
  },
  async ({ sessionToken, applicationId }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      const issues = validateApplication(app);
      if (issues.length === 0) {
        if (app.status === "in_progress") {
          app.status = "ready_for_review";
          updateApplication(app);
        }
        return ok("✓ Application is complete and ready to submit.", { issues: [], status: app.status });
      }
      return ok(`Found ${issues.length} item(s) to resolve before submitting.`, { issues });
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

server.registerTool(
  "submit_incorporation",
  {
    title: "Submit the incorporation application",
    description:
      "Attest and submit the application for filing. Fails if any validation " +
      "issues remain. This is the emulated equivalent of handing the package to " +
      "Atlas for the Delaware filing.",
    inputSchema: {
      ...sessionField,
      applicationId: z.string(),
      signatoryName: z.string().describe("Name of the founder attesting to the filing."),
      agreeToTerms: z.boolean().describe("Must be true to submit."),
    },
  },
  async ({ sessionToken, applicationId, signatoryName, agreeToTerms }) => {
    try {
      const app = loadOwnedApp(sessionToken, applicationId);
      if (!agreeToTerms) return fail("You must set agreeToTerms=true to submit.");
      app.attestation = { agreedToTerms: true, signatoryName, signedAt: new Date().toISOString() };

      const issues = validateApplication(app);
      if (issues.length > 0) {
        // Persist the attestation but don't advance status.
        updateApplication(app);
        return ok(
          `Cannot submit — ${issues.length} item(s) still need attention. ` +
            `Run validate_incorporation for details.`,
          { issues }
        );
      }

      app.status = "submitted";
      app.submittedAt = new Date().toISOString();
      updateApplication(app);
      return ok(
        `✓ Submitted ${fullCompanyName(app.company)} for Delaware C-Corp formation (emulated).\n` +
          `Confirmation: ${app.id} • Submitted at ${app.submittedAt}.`,
        { applicationId: app.id, status: app.status, submittedAt: app.submittedAt }
      );
    } catch (e) {
      return fail(asMessage(e));
    }
  }
);

// --- resource: field catalog ----------------------------------------------

server.registerResource(
  "field-catalog",
  "atlas://schema/delaware-c-corp",
  {
    title: "Delaware C-Corp field catalog",
    description: "The full list of input fields for an Atlas Delaware C-Corp filing, with which are required and which are sensitive.",
    mimeType: "application/json",
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ defaults: ATLAS_DEFAULTS, fields: FIELD_CATALOG }, null, 2),
      },
    ],
  })
);

// --- error formatting ------------------------------------------------------

function asMessage(e: unknown): string {
  if (e instanceof AuthError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

// --- boot ------------------------------------------------------------------

export { server };

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stderr is safe for logs; stdout is the MCP channel.
  console.error("atlas-incorporation-mcp running on stdio.");
}

// Only start the stdio transport when run directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href;

if (invokedDirectly) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
