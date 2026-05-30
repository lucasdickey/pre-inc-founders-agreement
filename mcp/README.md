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

| Tool | Purpose |
| --- | --- |
| `authenticate` | Sign in with email → returns a `sessionToken` (emulated Clerk). Required on every other call. |
| `create_incorporation` | Start a new application, pre-filled with Atlas defaults. |
| `list_incorporations` | List your applications. |
| `get_incorporation` | Fetch the full record (sensitive fields **masked**). |
| `set_company_details` | Name, designator (Inc./Corp./…), backup names, business description. State (DE) + entity (C-Corp) are fixed. |
| `set_share_structure` | Authorized shares, par value, shares issued, price per share. |
| `set_principal_address` | Principal business / mailing address. |
| `add_founder` | A founder/stockholder + share allocation + (sealed) SSN/ITIN + 83(b) intent. |
| `set_governance` | Initial directors, officer roster, incorporator. |
| `set_tax_responsible_party` | EIN election + responsible party (sealed SSN/ITIN) for SS-4. |
| `validate_incorporation` | Atlas-style completeness check; lists blocking gaps. |
| `submit_incorporation` | Attest + submit (emulated hand-off for the DE filing). |

### Resource

- `atlas://schema/delaware-c-corp` — the full field catalog (which fields are
  required, which are sensitive) plus the Atlas defaults.

### Core Delaware C-Corp fields modeled

- **Company:** legal name + entity designator, up to 2 backup names, business
  description, general-purpose clause, website.
- **Capitalization:** authorized shares (default 10,000,000), par value
  (default $0.00001), shares issued at formation, price per share.
- **Registered agent + DE registered office** (Delaware requires both; Atlas
  provides the agent).
- **Principal business address.**
- **Founders/stockholders:** name, email, title, mailing address, citizenship,
  share allocation, consideration type, vesting, 83(b) intent, **SSN/ITIN**.
- **Governance:** initial board of directors, officers (President/Secretary/
  Treasurer …), incorporator.
- **Tax (IRS SS-4):** EIN election, **responsible party + SSN/ITIN**, fiscal
  year end.
- **Attestation:** signatory + agreement to terms.

## What's emulated (and where the real thing plugs in)

| Concern | This POC | Production |
| --- | --- | --- |
| **Auth** (`src/auth.ts`) | Any email establishes an identity; an opaque `sessionToken` scopes every record to its owner. | Swap `authenticate`/`verifySessionToken` for the Clerk SDK (`AUTH_MODE=clerk`). |
| **Database** (`src/store.ts`) | One JSON file on disk, shaped like `users` / `sessions` / `applications` rows. | Replace with Supabase/Postgres + row-level security (the repo already uses Supabase). |
| **Secure storage** (`src/vault.ts`) | SSN/ITIN are **sealed** (opaque envelope + masked view) before they touch the DB and are only ever returned masked. `ciphertext` is base64, clearly labelled emulated. | Envelope-encrypt with a KMS (AES-256-GCM); `unseal` becomes the single audited decrypt choke point. |

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
authenticate(email)                      -> sessionToken
create_incorporation(sessionToken)       -> applicationId
set_company_details(... "Acme Robotics", "Inc.", "Builds warehouse robots.")
set_share_structure(... sharesIssuedAtFormation: 8_000_000)
add_founder(... "Jane Doe", shares: 5_000_000, ssnOrItin: "123-45-6789")  # sealed
add_founder(... "John Roe", shares: 3_000_000)
set_governance(... directors, officers)
set_principal_address(...)
set_tax_responsible_party(... "Jane Doe", ssnOrItin: "987-65-4321")        # sealed
validate_incorporation(...)              -> [] (ready)
submit_incorporation(... signatoryName, agreeToTerms: true) -> status: submitted
```

## Disclaimer

Not legal or tax advice, and not affiliated with Stripe or Atlas. A
demonstration of an incorporation intake flow over MCP.
