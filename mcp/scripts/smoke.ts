/**
 * In-process smoke test: spins up the MCP server over an in-memory transport,
 * connects a client (advertising elicitation support), and drives a full
 * Delaware C-Corp formation — including secure SSN elicitation, the
 * percentages + option-pool equity model, and the post-submit lock.
 *
 * Run: npm run smoke   (from mcp/)
 */

import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Use a throwaway data dir so the test never touches real state.
process.env.ATLAS_DATA_DIR = mkdtempSync(join(tmpdir(), "atlas-smoke-"));

const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");
const { InMemoryTransport } = await import("@modelcontextprotocol/sdk/inMemory.js");
const { ElicitRequestSchema } = await import("@modelcontextprotocol/sdk/types.js");
const { server } = await import("../server.ts");

interface ToolResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
  structuredContent?: any;
}

let failures = 0;
function check(label: string, cond: boolean, detail = "") {
  const mark = cond ? "✓" : "✗";
  if (!cond) failures++;
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ""}`);
}

function textOf(res: ToolResult): string {
  return res.content.map((c) => c.text ?? "").join("\n");
}

/** Extract the typed error (errorCode/message) from an error result. */
function errOf(res: ToolResult): { errorCode?: string } | null {
  if (!res.isError) return null;
  for (const c of [...res.content].reverse()) {
    try {
      const o = JSON.parse(c.text ?? "");
      if (o && o.errorCode) return o;
    } catch {
      /* not JSON */
    }
  }
  return null;
}

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client(
  { name: "smoke-client", version: "0.0.0" },
  { capabilities: { elicitation: {} } }
);

// Simulate a user entering their SSN into the client's secure elicitation form.
let elicitationCount = 0;
client.setRequestHandler(ElicitRequestSchema, async () => {
  elicitationCount++;
  return { action: "accept", content: { ssn_or_itin: "123-45-6789" } };
});

await server.connect(serverTransport);
await client.connect(clientTransport);

const call = (name: string, args: Record<string, unknown>) =>
  client.callTool({ name, arguments: args }) as Promise<ToolResult>;

console.log("Atlas Incorporation MCP — smoke test\n");

const tools = await client.listTools();
console.log(`Discovered ${tools.tools.length} tools.`);
check("atlas_authenticate present", tools.tools.some((t) => t.name === "atlas_authenticate"));
check("atlas_set_ownership present", tools.tools.some((t) => t.name === "atlas_set_ownership"));
check("atlas_formation_submit present", tools.tools.some((t) => t.name === "atlas_formation_submit"));

// Auth required before data tools
const unauth = await call("atlas_formation_create", { session_token: "bogus" });
check("rejects invalid session_token", errOf(unauth)?.errorCode === "AUTH_ERROR", textOf(unauth).split("\n")[0]);

// Authenticate
const auth = await call("atlas_authenticate", { email: "founder@example.com" });
const sessionToken: string = auth.structuredContent.session_token;
check("authenticate returns session_token", typeof sessionToken === "string" && sessionToken.length > 0);

// Create
const created = await call("atlas_formation_create", { session_token: sessionToken });
const applicationId: string = created.structuredContent.application_id;
check("create returns application_id", typeof applicationId === "string");

// Company
await call("atlas_set_company_details", {
  session_token: sessionToken,
  application_id: applicationId,
  legal_name: "Acme Robotics",
  designator: "Inc.",
  business_description: "Builds warehouse robots.",
});

// Founders — primary with secure SSN elicitation, plus a co-founder
const f1 = await call("atlas_add_founder", {
  session_token: sessionToken,
  application_id: applicationId,
  full_name: "Jane Doe",
  email: "jane@example.com",
  title: "CEO",
  role: "primary",
  collect_ssn: true,
});
const founder1: string = f1.structuredContent.founder_id;
check("SSN collected via elicitation", f1.structuredContent.ssn_status === "collected_via_elicitation", f1.structuredContent.ssn_status);
check("SSN not echoed in tool output", !textOf(f1).includes("123-45-6789"));

const f2 = await call("atlas_add_founder", {
  session_token: sessionToken,
  application_id: applicationId,
  full_name: "John Roe",
  email: "john@example.com",
  title: "CTO",
});
const founder2: string = f2.structuredContent.founder_id;

// Only one primary allowed
const dupPrimary = await call("atlas_add_founder", {
  session_token: sessionToken,
  application_id: applicationId,
  full_name: "Extra Primary",
  email: "extra@example.com",
  title: "COO",
  role: "primary",
});
check("rejects a second primary founder", errOf(dupPrimary)?.errorCode === "VALIDATION_ERROR");

// Ownership — percentages + option pool must sum to 100
const badOwnership = await call("atlas_set_ownership", {
  session_token: sessionToken,
  application_id: applicationId,
  allocations: { [founder1]: 60, [founder2]: 20 },
  equity_pool_percent: 10, // sums to 90
});
check("rejects ownership that doesn't sum to 100", errOf(badOwnership)?.errorCode === "OWNERSHIP_SUM_ERROR", textOf(badOwnership).split("\n")[0]);

await call("atlas_set_ownership", {
  session_token: sessionToken,
  application_id: applicationId,
  allocations: { [founder1]: 60, [founder2]: 30 },
  equity_pool_percent: 10,
});

// Bad founder id
const badId = await call("atlas_set_ownership", {
  session_token: sessionToken,
  application_id: applicationId,
  allocations: { founder_999: 100 },
});
check("rejects unknown founder_id", errOf(badId)?.errorCode === "INVALID_FOUNDER_ID");

// Vesting
await call("atlas_set_equity_terms", {
  session_token: sessionToken,
  application_id: applicationId,
  founder_id: founder1,
  vesting_duration_months: 48,
  vesting_cliff_months: 12,
});

// Governance + address
await call("atlas_set_governance", {
  session_token: sessionToken,
  application_id: applicationId,
  directors: [{ full_name: "Jane Doe" }],
  officers: [
    { title: "President", holder_name: "Jane Doe" },
    { title: "Secretary", holder_name: "John Roe" },
  ],
});
await call("atlas_set_principal_address", {
  session_token: sessionToken,
  application_id: applicationId,
  line1: "100 Market St",
  city: "San Francisco",
  state: "CA",
  postal_code: "94105",
});

// Tax / EIN — SSN via elicitation again
await call("atlas_set_tax_responsible_party", {
  session_token: sessionToken,
  application_id: applicationId,
  full_name: "Jane Doe",
  collect_ssn: true,
});
check("elicitation was invoked for each sensitive field", elicitationCount === 2, `count=${elicitationCount}`);

// Status — only attestation should remain before submit
const status = await call("atlas_formation_status", { session_token: sessionToken, application_id: applicationId });
const issues: { section: string }[] = status.structuredContent.blocking_issues;
check("only attestation remains before submit", issues.length === 1 && issues[0].section === "attestation", issues.map((i) => i.section).join(", "));

// Masked record
const got = await call("atlas_get_formation", { session_token: sessionToken, application_id: applicationId });
const dump = JSON.stringify(got.structuredContent);
check("masked record hides plaintext SSN", !dump.includes("123-45-6789"));
check("masked record shows masked SSN", dump.includes("***-**-6789"));

// Submit
const submitted = await call("atlas_formation_submit", {
  session_token: sessionToken,
  application_id: applicationId,
  signatory_name: "Jane Doe",
  agree_to_terms: true,
});
check("submission succeeds", submitted.structuredContent.status === "submitted", textOf(submitted).split("\n")[0]);

// Post-submit lock
const locked = await call("atlas_set_company_details", {
  session_token: sessionToken,
  application_id: applicationId,
  legal_name: "Renamed",
  business_description: "Trying to edit after submit.",
});
check("writes locked after submit", errOf(locked)?.errorCode === "FORMATION_LOCKED", textOf(locked).split("\n")[0]);

// Ownership isolation
const auth2 = await call("atlas_authenticate", { email: "intruder@example.com" });
const blocked = await call("atlas_get_formation", {
  session_token: auth2.structuredContent.session_token,
  application_id: applicationId,
});
check("blocks cross-account access", errOf(blocked)?.errorCode === "AUTH_ERROR", textOf(blocked).split("\n")[0]);

// Resource
const res = await client.readResource({ uri: "atlas://schema/delaware-c-corp" });
const first = res.contents[0] as { text?: string } | undefined;
check("field catalog resource readable", res.contents.length > 0 && !!first?.text);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
await client.close();
await server.close();
process.exit(failures === 0 ? 0 : 1);
