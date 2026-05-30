/**
 * In-process smoke test: spins up the MCP server over an in-memory transport,
 * connects a client, and drives a full Delaware C-Corp incorporation flow.
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
const { server } = await import("../server.ts");

interface ToolResult {
  isError?: boolean;
  content: { type: string; text?: string }[];
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

/** Pull the JSON payload (second text block) out of a tool result. */
function jsonOf(res: ToolResult): any {
  const blocks = res.content.filter((c) => c.type === "text" && c.text);
  for (let i = blocks.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(blocks[i].text as string);
    } catch {
      /* not JSON, keep looking */
    }
  }
  return null;
}

const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
const client = new Client({ name: "smoke-client", version: "0.0.0" });

await server.connect(serverTransport);
await client.connect(clientTransport);

const call = (name: string, args: Record<string, unknown>) =>
  client.callTool({ name, arguments: args }) as Promise<ToolResult>;

console.log("Atlas Incorporation MCP — smoke test\n");

// Tools are discoverable
const tools = await client.listTools();
console.log(`Discovered ${tools.tools.length} tools.`);
check("authenticate tool present", tools.tools.some((t) => t.name === "authenticate"));
check("submit tool present", tools.tools.some((t) => t.name === "submit_incorporation"));

// Auth required before data tools
const unauth = await call("create_incorporation", { sessionToken: "bogus" });
check("rejects invalid sessionToken", unauth.isError === true, textOf(unauth).split("\n")[0]);

// Authenticate
const auth = await call("authenticate", { email: "founder@example.com" });
const sessionToken: string = jsonOf(auth).sessionToken;
check("authenticate returns sessionToken", typeof sessionToken === "string" && sessionToken.length > 0);

// Create
const created = await call("create_incorporation", { sessionToken });
const applicationId: string = jsonOf(created).applicationId;
check("create returns applicationId", typeof applicationId === "string");

// Company
await call("set_company_details", {
  sessionToken,
  applicationId,
  legalName: "Acme Robotics",
  designator: "Inc.",
  businessDescription: "Builds warehouse robots.",
});

// Shares
await call("set_share_structure", {
  sessionToken,
  applicationId,
  sharesIssuedAtFormation: 8_000_000,
});

// Founders (allocations must sum to issued shares)
const f1 = await call("add_founder", {
  sessionToken,
  applicationId,
  fullName: "Jane Doe",
  email: "jane@example.com",
  title: "CEO",
  shares: 5_000_000,
  ssnOrItin: "123-45-6789",
});
check("founder SSN is masked, not plaintext", !textOf(f1).includes("123-45-6789"), textOf(f1).split("\n")[0]);

await call("add_founder", {
  sessionToken,
  applicationId,
  fullName: "John Roe",
  email: "john@example.com",
  title: "CTO",
  shares: 3_000_000,
});

// Governance
await call("set_governance", {
  sessionToken,
  applicationId,
  directors: [{ fullName: "Jane Doe" }],
  officers: [
    { title: "President", holderName: "Jane Doe" },
    { title: "Secretary", holderName: "John Roe" },
    { title: "Treasurer", holderName: "Jane Doe" },
  ],
});

// Principal address
await call("set_principal_address", {
  sessionToken,
  applicationId,
  line1: "100 Market St",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "US",
});

// Tax / EIN
await call("set_tax_responsible_party", {
  sessionToken,
  applicationId,
  fullName: "Jane Doe",
  ssnOrItin: "987-65-4321",
});

// Validate before attestation — only the attestation step should remain
// (attestation is supplied at submit time).
const validated = await call("validate_incorporation", { sessionToken, applicationId });
const vIssues: { step: string }[] = jsonOf(validated)?.issues ?? [];
check(
  "only attestation remains before submit",
  vIssues.length === 1 && vIssues[0].step === "attestation",
  vIssues.map((i) => i.step).join(", ")
);

// get_incorporation never leaks plaintext SSN
const got = await call("get_incorporation", { sessionToken, applicationId });
check("masked record hides plaintext SSN", !textOf(got).includes("123-45-6789") && !textOf(got).includes("987-65-4321"));
check("masked record shows masked SSN", textOf(got).includes("***-**-6789"));

// Submit
const submitted = await call("submit_incorporation", {
  sessionToken,
  applicationId,
  signatoryName: "Jane Doe",
  agreeToTerms: true,
});
check("submission succeeds", jsonOf(submitted)?.status === "submitted", textOf(submitted).split("\n")[0]);

// Ownership isolation: a second account can't read the first's app
const auth2 = await call("authenticate", { email: "intruder@example.com" });
const intruderToken = jsonOf(auth2).sessionToken;
const blocked = await call("get_incorporation", { sessionToken: intruderToken, applicationId });
check("blocks cross-account access", blocked.isError === true, textOf(blocked).split("\n")[0]);

// Resource: field catalog
const res = await client.readResource({ uri: "atlas://schema/delaware-c-corp" });
const first = res.contents[0] as { text?: string } | undefined;
check("field catalog resource readable", res.contents.length > 0 && !!first?.text);

console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
await client.close();
await server.close();
process.exit(failures === 0 ? 0 : 1);
