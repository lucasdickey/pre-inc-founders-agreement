# Atlas Incorporation MCP

A proof-of-concept **Model Context Protocol** server that replicates the field
inputs of a **Stripe Atlas incorporation application** — forming a **Delaware
C-Corporation** — and exposes them as agent-callable tools. Built to be driven
from **Claude** or **Codex**.

It mirrors the agentic pattern of the `doola` formation MCP (per-call auth, a
guided multi-step flow) but targets the Atlas product: Delaware C-Corp + EIN.

> ⚠️ **Proof of concept.** Authentication, the database, and "encryption" are all
> **emulated** so the server runs with zero external services. This is not a
> legal filing system and not production-secure. See *What's emulated* below.

## What it does

The server walks an applicant through everything Atlas collects to assemble a
Delaware filing (Certificate of Incorporation, bylaws/consents, stock purchase
agreements, IRS Form SS-4 for an EIN), and stores it as an owned record.

### Tools

Tools are `atlas_`-prefixed (`snake_case`), ship `structuredContent` + an output
schema, and return typed `errorCode`s. See [`TOOLS.md`](./TOOLS.md) for the full
input/output reference.

| Tool | Purpose |
| --- | --- |
| `atlas_authenticate` | Sign in with email → returns a `session_token` (emulated Clerk). Required on every other call. |
| `atlas_formation_create` | Start a new formation, pre-filled with Atlas defaults. |
| `atlas_list_formations` | List your formations. *(read-only)* |
| `atlas_get_formation` | Fetch the full record (sensitive fields **masked**). *(read-only)* |
| `atlas_formation_status` | Atlas-style completeness check; lists blocking issues by section. *(read-only)* |
| `atlas_set_company_details` | Name, designator (Inc./Corp./…), backup names, business description. State (DE) + entity (C-Corp) fixed. |
| `atlas_add_founder` | Founder/stockholder + role (primary/co-founder) + 83(b) intent + **SSN via elicitation**. |
| `atlas_set_ownership` | Ownership **percentages** per founder + option/equity pool + total authorized shares (must sum to 100). |
| `atlas_set_equity_terms` | Per-founder vesting (duration, cliff, start). |
| `atlas_set_governance` | Initial directors, officer roster, incorporator. |
| `atlas_set_principal_address` | Principal business / mailing address. |
| `atlas_set_tax_responsible_party` | EIN election + responsible party (**SSN via elicitation**) for SS-4. |
| `atlas_formation_submit` | Attest + submit (emulated hand-off for the DE filing). Writes lock after. *(destructive)* |

### Resource

- `atlas://schema/delaware-c-corp` — the full field catalog (which fields are
  required, which are sensitive) plus the Atlas defaults.

### Core Delaware C-Corp fields modeled

- **Company:** legal name + entity designator, up to 2 backup names, business
  description, general-purpose clause, website.
- **Capitalization:** total authorized shares (default 10,000,000), par value
  (default $0.00001), **ownership % per founder**, **option/equity pool %**
  (founders + pool sum to 100).
- **Registered agent + DE registered office** (Delaware requires both; Atlas
  provides the agent).
- **Principal business address.**
- **Founders/stockholders:** name, email, title, role (primary/co-founder),
  mailing address, citizenship, consideration type, vesting, 83(b) intent,
  **SSN/ITIN**.
- **Governance:** initial board of directors, officers (President/Secretary/
  Treasurer …), incorporator.
- **Tax (IRS SS-4):** EIN election, **responsible party + SSN/ITIN**, fiscal
  year end.
- **Attestation:** signatory + agreement to terms.

## What's emulated (and where the real thing plugs in)

| Concern | This POC | Production |
| --- | --- | --- |
| **Auth** (`src/auth.ts`) | Any email establishes an identity; an opaque `session_token` scopes every record to its owner. | Swap `authenticate`/`verifySessionToken` for the Clerk SDK (`AUTH_MODE=clerk`). |
| **Database** (`src/store.ts`) | One JSON file on disk, shaped like `users` / `sessions` / `applications` rows. | Replace with Supabase/Postgres + row-level security (the repo already uses Supabase). |
| **Secure storage** (`src/vault.ts`) | SSN/ITIN are **sealed** (opaque envelope + masked view) before they touch the DB and are only ever returned masked. `ciphertext` is base64, clearly labelled emulated. | Envelope-encrypt with a KMS (AES-256-GCM); `unseal` becomes the single audited decrypt choke point. |

### Secure SSN collection via elicitation

When `collect_ssn=true`, `atlas_add_founder` / `atlas_set_tax_responsible_party`
use **MCP elicitation** to ask the client to collect the SSN/ITIN directly from
the user. The value reaches the server **without passing through the model's
context or the tool-call transcript**, and is sealed in the vault. If the client
doesn't advertise the `elicitation` capability, the tool reports
`ssn_status: client_unsupported` rather than silently downgrading — provide the
value via the web handoff (or, for testing, the `ssn_or_itin` fallback arg).

The security boundary is real even though the crypto isn't: plaintext SSN/ITIN
never lands in the store and is never returned over MCP — only `***-**-6789`.

## Requirements

- **Node 22+** (uses native TypeScript execution via `--experimental-strip-types`).

## Install & run

```bash
cd mcp
npm install
npm start        # serves MCP over stdio
npm run smoke     # in-process end-to-end test (no external deps)
npm run typecheck
```

## Connecting from a client

### Claude Code

A project-scoped config already exists at the repo root (`.mcp.json`). From the
repo root, Claude Code will offer to start the `atlas-incorporation` server.

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "atlas-incorporation": {
      "command": "node",
      "args": ["--experimental-strip-types", "/absolute/path/to/mcp/server.ts"]
    }
  }
}
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.atlas-incorporation]
command = "node"
args = ["--experimental-strip-types", "/absolute/path/to/mcp/server.ts"]
```

## Example flow (what the agent calls)

```
atlas_authenticate(email)                       -> session_token
atlas_formation_create(session_token)           -> application_id
atlas_set_company_details(... "Acme Robotics", "Inc.", "Builds warehouse robots.")
atlas_add_founder(... "Jane Doe", role:"primary", collect_ssn:true)  -> founder_1  # SSN elicited + sealed
atlas_add_founder(... "John Roe", role:"co_founder")                 -> founder_2
atlas_set_ownership(... { founder_1: 60, founder_2: 30 }, equity_pool_percent: 10) # sums to 100
atlas_set_equity_terms(... founder_1, 48, 12)
atlas_set_governance(... directors, officers)
atlas_set_principal_address(...)
atlas_set_tax_responsible_party(... "Jane Doe", collect_ssn:true)    # SSN elicited + sealed
atlas_formation_status(...)                      -> ready (blocking_issues: [])
atlas_formation_submit(... signatory_name, agree_to_terms:true) -> status: submitted
```

## Disclaimer

Not legal or tax advice, and not affiliated with Stripe or Atlas. A
demonstration of an incorporation intake flow over MCP.
