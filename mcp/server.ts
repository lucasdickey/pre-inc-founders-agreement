#!/usr/bin/env -S node --experimental-strip-types
/**
 * Atlas Incorporation MCP server.
 *
 * A proof-of-concept Model Context Protocol server that replicates the field
 * inputs of a Stripe Atlas incorporation application (Delaware C-Corp) as
 * agent-callable tools. Designed to be reached from Claude or Codex.
 *
 *   Auth      — emulated Clerk: `atlas_authenticate` issues a session_token that
 *               scopes every record to its owner (passed on every call).
 *   Storage   — emulated database (JSON on disk) shaped like Supabase rows.
 *   Security  — emulated secure vault: SSN/ITIN are collected via MCP
 *               *elicitation* (kept out of the model's context), sealed before
 *               storage, and only ever returned masked.
 *   Equity    — ownership percentages + an option pool over a share cap.
 *   Contract  — every tool ships an outputSchema + structuredContent and a typed
 *               errorCode; writes lock after submission (FORMATION_LOCKED).
 *
 * Run:  npm start   (inside mcp/)   or via the .mcp.json in the repo root.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { authenticate, verifySessionToken } from "./src/auth.ts";
import { AppError, toStructuredError } from "./src/errors.ts";
import { seal, type SealedValue } from "./src/vault.ts";
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
  ownershipTotal,
  validateApplication,
  type Address,
  type EntityDesignator,
  type IncorporationApplication,
} from "./src/schema.ts";

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const server = new McpServer({
  name: "atlas-incorporation-mcp",
  version: "0.2.0",
});

// --- result + guard helpers ------------------------------------------------

function ok(summary: string, structured: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: summary }],
    structuredContent: structured,
  };
}

function errorResult(e: unknown): CallToolResult {
  const se = toStructuredError(e);
  // Note: a tool's outputSchema describes its SUCCESS payload. Clients still
  // validate any `structuredContent` present on an error, so we carry the typed
  // error as a JSON content block instead (machine-readable, schema-agnostic).
  return {
    isError: true,
    content: [
      { type: "text", text: `[${se.errorCode}] ${se.message}` },
      { type: "text", text: JSON.stringify(se) },
    ],
  };
}

/** Resolve a session token to an owned application, or throw a typed error. */
function loadOwnedApp(
  sessionToken: string | undefined,
  applicationId: string
): IncorporationApplication {
  const actor = verifySessionToken(sessionToken);
  const app = getApplication(applicationId);
  if (!app) {
    throw new AppError("FORMATION_NOT_FOUND", `No formation found with id ${applicationId}.`, {
      field: "application_id",
    });
  }
  if (app.ownerUserId !== actor.userId) {
    throw new AppError("AUTH_ERROR", "This formation belongs to a different account.");
  }
  return app;
}

/** Block writes once the formation has been submitted. */
function assertUnlocked(app: IncorporationApplication): void {
  if (app.status === "submitted") {
    throw new AppError(
      "FORMATION_LOCKED",
      "This formation has already been submitted; no further edits are allowed.",
      { details: { submittedAt: app.submittedAt } }
    );
  }
}

/** Bump a draft application into the in_progress state on first edit. */
function touch(app: IncorporationApplication): void {
  if (app.status === "draft") app.status = "in_progress";
}

const sessionField = {
  session_token: z
    .string()
    .describe("Session token from `atlas_authenticate`. Required on every call."),
};

const addressShape = {
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().describe("Two-letter US state code, e.g. CA."),
  postal_code: z.string(),
  country: z.string().default("US"),
};

function toAddress(a: {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}): Address {
  return {
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    postalCode: a.postal_code,
    country: a.country,
  };
}

// --- secure SSN collection (via elicitation) -------------------------------

/**
 * Elicit an SSN/ITIN directly from the user through the MCP client. The value
 * is returned to the server WITHOUT passing through the model's context.
 * Returns `supported: false` when the client can't do elicitation so callers
 * can fall back gracefully instead of silently dropping to a plaintext arg.
 */
async function elicitSsn(label: string): Promise<{ supported: boolean; value: string | null }> {
  const caps = server.server.getClientCapabilities();
  if (!caps?.elicitation) return { supported: false, value: null };

  const result = await server.server.elicitInput({
    mode: "form",
    message:
      `Securely enter the SSN or ITIN for ${label}. This value is sent straight ` +
      `to the secure vault and is NOT shared with the AI model.`,
    requestedSchema: {
      type: "object",
      properties: {
        ssn_or_itin: {
          type: "string",
          title: "SSN or ITIN",
          description: "9 digits, e.g. 123-45-6789",
          minLength: 9,
          maxLength: 11,
        },
      },
      required: ["ssn_or_itin"],
    },
  });

  if (result.action === "accept") {
    const v = (result.content as Record<string, unknown> | undefined)?.ssn_or_itin;
    if (typeof v === "string" && v.trim()) return { supported: true, value: v.trim() };
  }
  return { supported: true, value: null };
}

interface SsnResolution {
  sealed: SealedValue | null;
  status: "sealed" | "collected_via_elicitation" | "declined" | "client_unsupported" | "skipped";
  note: string;
}

/**
 * Resolve an SSN from one of two paths:
 *  - `directValue` (explicit fallback arg) — sealed immediately.
 *  - `collect: true` — elicited securely from the user, then sealed.
 */
async function resolveSsn(
  label: string,
  directValue: string | undefined,
  collect: boolean | undefined
): Promise<SsnResolution> {
  if (directValue) {
    const sealed = seal(directValue, "tax_id");
    return { sealed, status: "sealed", note: `SSN sealed as ${sealed.masked}.` };
  }
  if (collect) {
    const r = await elicitSsn(label);
    if (!r.supported) {
      return {
        sealed: null,
        status: "client_unsupported",
        note:
          "SSN not collected: this client does not support secure elicitation. " +
          "Provide it via the web handoff, or pass ssn_or_itin directly.",
      };
    }
    if (r.value) {
      const sealed = seal(r.value, "tax_id");
      return {
        sealed,
        status: "collected_via_elicitation",
        note: `SSN collected via secure elicitation and sealed as ${sealed.masked}.`,
      };
    }
    return { sealed: null, status: "declined", note: "SSN entry was declined by the user." };
  }
  return { sealed: null, status: "skipped", note: "No SSN provided." };
}

// --- auth ------------------------------------------------------------------

server.registerTool(
  "atlas_authenticate",
  {
    title: "Authenticate (emulated Clerk)",
    description:
      "Sign in / sign up with an email to start an authenticated session. " +
      "Returns a session_token that must be passed to every other tool. " +
      "This emulates Clerk — no real credentials are validated.",
    inputSchema: {
      email: z.string().email().describe("Your email — establishes your identity."),
      password: z.string().optional().describe("Optional. Recorded only as a one-way marker."),
    },
    outputSchema: {
      session_token: z.string(),
      user_id: z.string(),
      expires_at: z.string(),
    },
  },
  async ({ email, password }) => {
    try {
      const r = authenticate(email, password);
      return ok(
        `Authenticated as ${r.email}. Use this session_token on every call (expires ${r.expiresAt}).`,
        { session_token: r.sessionToken, user_id: r.userId, expires_at: r.expiresAt }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- formation lifecycle ---------------------------------------------------

server.registerTool(
  "atlas_formation_create",
  {
    title: "Start a new formation",
    description:
      "Create a new Stripe Atlas Delaware C-Corp formation, pre-filled with " +
      "Atlas defaults (10M authorized shares, $0.00001 par value, DE registered " +
      "agent). Returns the application_id used on the remaining tools.",
    inputSchema: { ...sessionField },
    outputSchema: { application_id: z.string(), status: z.string() },
    annotations: { idempotentHint: false },
  },
  async ({ session_token }) => {
    try {
      const actor = verifySessionToken(session_token);
      const app = createEmptyApplication(actor.userId);
      insertApplication(app);
      return ok(
        `Created formation ${app.id} (${app.company.stateOfIncorporation} ${app.company.entityType}). ` +
          `Next: atlas_set_company_details, atlas_add_founder, atlas_set_ownership, ` +
          `atlas_set_equity_terms, atlas_set_governance, atlas_set_principal_address, ` +
          `atlas_set_tax_responsible_party, then atlas_formation_status.`,
        { application_id: app.id, status: app.status }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "atlas_list_formations",
  {
    title: "List my formations",
    description: "List all formations owned by the authenticated account.",
    inputSchema: { ...sessionField },
    outputSchema: { formations: z.array(z.any()) },
    annotations: { readOnlyHint: true },
  },
  async ({ session_token }) => {
    try {
      const actor = verifySessionToken(session_token);
      const formations = listApplicationsForUser(actor.userId).map((a) => ({
        application_id: a.id,
        company: fullCompanyName(a.company),
        status: a.status,
        founders: a.founders.length,
        updated_at: a.updatedAt,
      }));
      return ok(`You have ${formations.length} formation(s).`, { formations });
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "atlas_get_formation",
  {
    title: "Get a formation (masked)",
    description:
      "Return the full formation record. Sensitive fields (SSN/ITIN) are " +
      "returned masked — plaintext is never exposed over MCP.",
    inputSchema: { ...sessionField, application_id: z.string() },
    outputSchema: { formation: z.any() },
    annotations: { readOnlyHint: true },
  },
  async ({ session_token, application_id }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      return ok(`${fullCompanyName(app.company)} — status: ${app.status}.`, {
        formation: maskDeep(app),
      });
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "atlas_formation_status",
  {
    title: "Check formation readiness",
    description:
      "Run Atlas-style completeness checks. Returns blocking_issues by section; " +
      "an empty list means the formation is ready to submit. Read-only.",
    inputSchema: { ...sessionField, application_id: z.string() },
    outputSchema: {
      ready: z.boolean(),
      blocking_issues: z.array(z.any()),
      status: z.string(),
    },
    annotations: { readOnlyHint: true },
  },
  async ({ session_token, application_id }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      const issues = validateApplication(app);
      if (issues.length === 0 && app.status === "in_progress") {
        app.status = "ready_for_review";
        updateApplication(app);
      }
      const summary =
        issues.length === 0
          ? "✓ Formation is complete and ready to submit."
          : `Found ${issues.length} item(s) to resolve before submitting.`;
      return ok(summary, { ready: issues.length === 0, blocking_issues: issues, status: app.status });
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- company ---------------------------------------------------------------

server.registerTool(
  "atlas_set_company_details",
  {
    title: "Set company details",
    description:
      "Set the company name, entity designator, backup names, and business " +
      "description. State (Delaware) and entity type (C-Corporation) are fixed.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      legal_name: z.string().describe("Base name without designator, e.g. 'Acme Robotics'."),
      designator: z
        .enum(ENTITY_DESIGNATORS as [EntityDesignator, ...EntityDesignator[]])
        .default("Inc."),
      name_options: z.array(z.string()).max(2).optional().describe("Up to two backup names."),
      business_description: z.string().describe("Plain-language description of the business."),
      website: z.string().url().optional(),
    },
    outputSchema: { success: z.boolean(), legal_name: z.string(), warnings: z.array(z.string()).optional() },
    annotations: { idempotentHint: true },
  },
  async ({ session_token, application_id, legal_name, designator, name_options, business_description, website }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      app.company.legalName = legal_name;
      app.company.designator = designator;
      if (name_options) app.company.nameOptions = name_options;
      app.company.businessDescription = business_description;
      if (website) app.company.website = website;
      touch(app);
      updateApplication(app);
      return ok(`Company set to "${fullCompanyName(app.company)}".`, {
        success: true,
        legal_name: fullCompanyName(app.company),
      });
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- founders --------------------------------------------------------------

server.registerTool(
  "atlas_add_founder",
  {
    title: "Add a founder / stockholder",
    description:
      "Add a founder. Set role='primary' for the representative founder (exactly " +
      "one required). SSN/ITIN is collected securely via elicitation when " +
      "collect_ssn=true (kept out of the model context, then sealed in the " +
      "vault). Ownership percentages are set separately via atlas_set_ownership.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      full_name: z.string(),
      email: z.string().email(),
      title: z.string().describe("e.g. CEO, CTO."),
      role: z.enum(["primary", "co_founder"]).default("co_founder"),
      citizenship_country: z.string().default("US"),
      consideration_type: z.enum(["cash", "ip_assignment", "services", "mixed"]).default("cash"),
      plans_83b_election: z.boolean().default(true),
      mailing_address: z.object(addressShape).optional(),
      collect_ssn: z
        .boolean()
        .default(false)
        .describe("If true, securely elicit the SSN/ITIN from the user via the client."),
      ssn_or_itin: z
        .string()
        .optional()
        .describe("Fallback: pass SSN directly (sealed immediately). Prefer collect_ssn."),
    },
    outputSchema: {
      success: z.boolean(),
      founder_id: z.string(),
      ssn_status: z.string(),
    },
  },
  async (args) => {
    try {
      const app = loadOwnedApp(args.session_token, args.application_id);
      assertUnlocked(app);

      if (args.role === "primary" && app.founders.some((f) => f.role === "primary")) {
        throw new AppError("VALIDATION_ERROR", "A primary founder already exists. Only one is allowed.", {
          field: "role",
        });
      }

      const ssn = await resolveSsn(args.full_name, args.ssn_or_itin, args.collect_ssn);
      const founder = {
        id: `founder_${app.founders.length + 1}`,
        fullName: args.full_name,
        email: args.email,
        title: args.title,
        role: args.role,
        mailingAddress: args.mailing_address ? toAddress(args.mailing_address) : null,
        citizenshipCountry: args.citizenship_country,
        considerationType: args.consideration_type,
        vesting: null,
        ssnOrItin: ssn.sealed,
        plans83bElection: args.plans_83b_election,
      };
      app.founders.push(founder);
      touch(app);
      updateApplication(app);
      return ok(
        `Added ${founder.role} founder ${founder.fullName} (id: ${founder.id}). ${ssn.note} ` +
          `Set their ownership % with atlas_set_ownership.`,
        { success: true, founder_id: founder.id, ssn_status: ssn.status }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- equity ----------------------------------------------------------------

server.registerTool(
  "atlas_set_ownership",
  {
    title: "Set ownership (percentages + option pool)",
    description:
      "Set ownership percentages per founder, plus the option/equity pool and " +
      "total authorized shares. Founder allocations + equity_pool_percent must " +
      "sum to 100. Call after all founders are added.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      allocations: z
        .record(z.string(), z.number().positive().max(100))
        .describe("Map of founder_id -> ownership percent. e.g. { 'founder_1': 60, 'founder_2': 30 }"),
      equity_pool_percent: z.number().min(0).max(50).default(0),
      total_shares: z.number().int().positive().default(ATLAS_DEFAULTS.totalShares),
    },
    outputSchema: {
      success: z.boolean(),
      total_shares: z.number(),
      equity_pool_percent: z.number(),
      ownership_total: z.number(),
    },
  },
  async ({ session_token, application_id, allocations, equity_pool_percent, total_shares }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);

      const validIds = new Set(app.founders.map((f) => f.id));
      for (const id of Object.keys(allocations)) {
        if (!validIds.has(id)) {
          throw new AppError("INVALID_FOUNDER_ID", `Unknown founder_id '${id}'. Use atlas_get_formation to list founders.`, {
            field: "allocations",
            details: { valid_founder_ids: [...validIds] },
          });
        }
      }

      const total = Object.values(allocations).reduce((s, v) => s + v, 0) + equity_pool_percent;
      if (Math.abs(total - 100) > 0.01) {
        throw new AppError(
          "OWNERSHIP_SUM_ERROR",
          `Ownership (founders + equity pool) must sum to 100. Current total: ${total}.`,
          { field: "allocations", details: { total } }
        );
      }

      app.capitalization.allocations = { ...allocations };
      app.capitalization.equityPoolPercent = equity_pool_percent;
      app.capitalization.totalShares = total_shares;
      touch(app);
      updateApplication(app);
      return ok(
        `Ownership set across ${Object.keys(allocations).length} founder(s); ` +
          `option pool ${equity_pool_percent}%; ${total_shares.toLocaleString()} authorized shares.`,
        {
          success: true,
          total_shares,
          equity_pool_percent,
          ownership_total: ownershipTotal(app.capitalization),
        }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "atlas_set_equity_terms",
  {
    title: "Set vesting terms for a founder",
    description:
      "Set the vesting schedule for a single founder. Call once per founder. " +
      "Common: 48-month duration, 12-month cliff, starting at incorporation.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      founder_id: z.string(),
      vesting_duration_months: z.number().int().positive().default(48),
      vesting_cliff_months: z.number().int().nonnegative().default(12),
      vesting_start_date: z
        .string()
        .default("date_of_incorporation")
        .describe("'date_of_incorporation' or an ISO YYYY-MM-DD date."),
    },
    outputSchema: { success: z.boolean(), founder_id: z.string() },
  },
  async ({ session_token, application_id, founder_id, vesting_duration_months, vesting_cliff_months, vesting_start_date }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      const founder = app.founders.find((f) => f.id === founder_id);
      if (!founder) {
        throw new AppError("INVALID_FOUNDER_ID", `Unknown founder_id '${founder_id}'.`, { field: "founder_id" });
      }
      if (vesting_cliff_months > vesting_duration_months) {
        throw new AppError("VALIDATION_ERROR", "Cliff cannot exceed total vesting duration.", {
          field: "vesting_cliff_months",
        });
      }
      founder.vesting = {
        durationMonths: vesting_duration_months,
        cliffMonths: vesting_cliff_months,
        startDate: vesting_start_date,
      };
      touch(app);
      updateApplication(app);
      return ok(
        `Vesting set for ${founder.fullName}: ${vesting_duration_months}mo / ${vesting_cliff_months}mo cliff, ` +
          `start ${vesting_start_date}.`,
        { success: true, founder_id }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- governance + address --------------------------------------------------

server.registerTool(
  "atlas_set_governance",
  {
    title: "Set directors and officers",
    description:
      "Set the initial board of directors and the officer roster (President, " +
      "Secretary, Treasurer at minimum). Optionally override the incorporator.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      directors: z.array(z.object({ full_name: z.string() })).min(1),
      officers: z
        .array(z.object({ title: z.string(), holder_name: z.string() }))
        .min(1)
        .describe("e.g. [{title:'President', holder_name:'Jane Doe'}, ...]"),
      incorporator_name: z.string().optional(),
    },
    outputSchema: { success: z.boolean() },
    annotations: { idempotentHint: true },
  },
  async ({ session_token, application_id, directors, officers, incorporator_name }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      app.governance.directors = directors.map((d) => ({ fullName: d.full_name }));
      app.governance.officers = officers.map((o) => ({ title: o.title, holderName: o.holder_name }));
      if (incorporator_name) app.governance.incorporatorName = incorporator_name;
      touch(app);
      updateApplication(app);
      return ok(`Governance set: ${directors.length} director(s), ${officers.length} officer(s).`, {
        success: true,
      });
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.registerTool(
  "atlas_set_principal_address",
  {
    title: "Set principal business address",
    description: "Set the company's principal business / mailing address.",
    inputSchema: { ...sessionField, application_id: z.string(), ...addressShape },
    outputSchema: { success: z.boolean() },
    annotations: { idempotentHint: true },
  },
  async ({ session_token, application_id, line1, line2, city, state, postal_code, country }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      app.principalAddress = toAddress({ line1, line2, city, state, postal_code, country });
      touch(app);
      updateApplication(app);
      return ok("Principal business address updated.", { success: true });
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- tax / EIN -------------------------------------------------------------

server.registerTool(
  "atlas_set_tax_responsible_party",
  {
    title: "Set EIN responsible party (IRS Form SS-4)",
    description:
      "Configure the EIN filing. The responsible party's SSN/ITIN is collected " +
      "securely via elicitation when collect_ssn=true, sealed in the vault, and " +
      "only ever returned masked.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      file_for_ein: z.boolean().default(true),
      full_name: z.string().describe("Responsible party full name."),
      has_us_tax_id: z.boolean().default(true),
      fiscal_year_end_month: z.string().default("December"),
      collect_ssn: z.boolean().default(false).describe("Securely elicit the SSN/ITIN from the user."),
      ssn_or_itin: z.string().optional().describe("Fallback: pass SSN directly (sealed immediately)."),
    },
    outputSchema: { success: z.boolean(), ssn_status: z.string() },
  },
  async ({ session_token, application_id, file_for_ein, full_name, has_us_tax_id, fiscal_year_end_month, collect_ssn, ssn_or_itin }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      const ssn = await resolveSsn(full_name, ssn_or_itin, collect_ssn);
      app.taxFiling.fileForEin = file_for_ein;
      app.taxFiling.fiscalYearEndMonth = fiscal_year_end_month;
      app.taxFiling.responsibleParty = {
        fullName: full_name,
        ssnOrItin: ssn.sealed,
        hasUsTaxId: has_us_tax_id,
      };
      touch(app);
      updateApplication(app);
      return ok(
        `EIN filing ${file_for_ein ? "enabled" : "disabled"}; responsible party ${full_name}. ${ssn.note}`,
        { success: true, ssn_status: ssn.status }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- submit ----------------------------------------------------------------

server.registerTool(
  "atlas_formation_submit",
  {
    title: "Submit the formation",
    description:
      "Attest and submit the formation for filing. Fails if any blocking issues " +
      "remain. This is the emulated equivalent of handing the package to Atlas " +
      "for the Delaware filing. Irreversible — writes lock after submission.",
    inputSchema: {
      ...sessionField,
      application_id: z.string(),
      signatory_name: z.string().describe("Name of the founder attesting to the filing."),
      agree_to_terms: z.boolean().describe("Must be true to submit."),
    },
    outputSchema: {
      application_id: z.string(),
      status: z.string(),
      submitted_at: z.string().optional(),
      blocking_issues: z.array(z.any()).optional(),
    },
    annotations: { destructiveHint: true },
  },
  async ({ session_token, application_id, signatory_name, agree_to_terms }) => {
    try {
      const app = loadOwnedApp(session_token, application_id);
      assertUnlocked(app);
      if (!agree_to_terms) {
        throw new AppError("VALIDATION_ERROR", "You must set agree_to_terms=true to submit.", {
          field: "agree_to_terms",
        });
      }
      app.attestation = { agreedToTerms: true, signatoryName: signatory_name, signedAt: new Date().toISOString() };

      const issues = validateApplication(app);
      if (issues.length > 0) {
        updateApplication(app); // persist attestation, but don't advance
        return ok(
          `Cannot submit — ${issues.length} item(s) still need attention. Run atlas_formation_status for details.`,
          { application_id: app.id, status: app.status, blocking_issues: issues }
        );
      }

      app.status = "submitted";
      app.submittedAt = new Date().toISOString();
      updateApplication(app);
      return ok(
        `✓ Submitted ${fullCompanyName(app.company)} for Delaware C-Corp formation (emulated). ` +
          `Confirmation: ${app.id} • ${app.submittedAt}.`,
        { application_id: app.id, status: app.status, submitted_at: app.submittedAt }
      );
    } catch (e) {
      return errorResult(e);
    }
  }
);

// --- resource: field catalog ----------------------------------------------

server.registerResource(
  "field-catalog",
  "atlas://schema/delaware-c-corp",
  {
    title: "Delaware C-Corp field catalog",
    description:
      "The full list of input fields for an Atlas Delaware C-Corp filing, with which are required and which are sensitive.",
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
