# Atlas Incorporation MCP — Tool Reference

A proof-of-concept Model Context Protocol (MCP) server that replicates the field
inputs of a Stripe Atlas incorporation application (Delaware C-Corporation) as
agent-callable tools for Claude or Codex.

This document lists every tool, its inputs, and the recommended composite flows.

> **Emulated for the PoC:** authentication (Clerk-style), the database, and PII
> "encryption" are emulated. Sensitive identifiers (SSN/ITIN) are collected via
> MCP **elicitation** (kept out of the model's context), sealed in the vault, and
> only ever returned masked (e.g. `***-**-6789`).

---

## Conventions

- Tools are `atlas_`-prefixed, `snake_case`; arguments are `snake_case`.
- **`session_token`** is returned by `atlas_authenticate` and is **required on
  every other tool call**. It scopes all records to the owning account.
- **`application_id`** is returned by `atlas_formation_create` and identifies the
  formation on all subsequent calls.
- Every tool returns **`structuredContent`** matching its output schema; the text
  block is for human display.
- Errors return `isError: true` with a typed `errorCode` (see Error Codes).
- State (Delaware) and entity type (C-Corporation) are fixed, as in Stripe Atlas.

---

## Tools

### 1. `atlas_authenticate`
Sign in / sign up with an email to start a session (emulated Clerk). Returns a
`session_token` used on every other tool.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string (email) | Yes | Establishes your identity. |
| `password` | string | No | Recorded only as a one-way marker. |

**Returns:** `session_token`, `user_id`, `expires_at`.

---

### 2. `atlas_formation_create`
Create a new Delaware C-Corp formation, pre-filled with Atlas defaults
(10,000,000 authorized shares, $0.00001 par value, DE registered agent).

| Input | Type | Required |
| --- | --- | --- |
| `session_token` | string | Yes |

**Returns:** `application_id`, `status`.

---

### 3. `atlas_list_formations`  *(read-only)*
List all formations owned by the authenticated account.

| Input | Type | Required |
| --- | --- | --- |
| `session_token` | string | Yes |

**Returns:** `formations[]` — `{ application_id, company, status, founders, updated_at }`.

---

### 4. `atlas_get_formation`  *(read-only)*
Return the full formation record. Sensitive fields are returned masked.

| Input | Type | Required |
| --- | --- | --- |
| `session_token` | string | Yes |
| `application_id` | string | Yes |

**Returns:** `formation` (full masked record).

---

### 5. `atlas_formation_status`  *(read-only)*
Run Atlas-style completeness checks. Empty `blocking_issues` means ready to submit.

| Input | Type | Required |
| --- | --- | --- |
| `session_token` | string | Yes |
| `application_id` | string | Yes |

**Returns:** `ready` (bool), `blocking_issues[]` (`{ section, field, message }`), `status`.

---

### 6. `atlas_set_company_details`
Set company name, designator, backup names, and business description. State (DE)
and entity (C-Corp) are fixed.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `legal_name` | string | Yes | Base name without designator. |
| `designator` | enum | No (default `Inc.`) | `Inc.`, `Incorporated`, `Corporation`, `Corp.`, `Company`, `Co.` |
| `name_options` | string[] (max 2) | No | Backup names. |
| `business_description` | string | Yes | |
| `website` | string (url) | No | |

---

### 7. `atlas_add_founder`
Add a founder / stockholder. Set `role="primary"` for the representative founder
(exactly one required). SSN/ITIN is collected securely via elicitation when
`collect_ssn=true`. Ownership is set separately (see `atlas_set_ownership`).

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `full_name` | string | Yes | |
| `email` | string (email) | Yes | |
| `title` | string | Yes | e.g. CEO. |
| `role` | enum | No (default `co_founder`) | `primary` or `co_founder`. |
| `citizenship_country` | string | No (default `US`) | |
| `consideration_type` | enum | No (default `cash`) | `cash`, `ip_assignment`, `services`, `mixed`. |
| `plans_83b_election` | boolean | No (default `true`) | |
| `mailing_address` | object | No | `{ line1, line2?, city, state, postal_code, country }`. |
| `collect_ssn` | boolean | No (default `false`) | **Securely elicit** SSN/ITIN from the user. |
| `ssn_or_itin` | string | No | **Sensitive** fallback (sealed immediately). Prefer `collect_ssn`. |

**Returns:** `success`, `founder_id`, `ssn_status` (`collected_via_elicitation` \| `sealed` \| `declined` \| `client_unsupported` \| `skipped`).

---

### 8. `atlas_set_ownership`
Set ownership **percentages** per founder, plus the option/equity pool and total
authorized shares. Founder allocations + `equity_pool_percent` must sum to **100**.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `allocations` | object | Yes | Map of `founder_id → percent` (each > 0, ≤ 100). |
| `equity_pool_percent` | number | No (default 0) | 0–50. |
| `total_shares` | integer | No (default 10,000,000) | Authorized shares. |

**Returns:** `success`, `total_shares`, `equity_pool_percent`, `ownership_total`.

---

### 9. `atlas_set_equity_terms`
Set the vesting schedule for a single founder. Call once per founder.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `founder_id` | string | Yes | From `atlas_add_founder` / `atlas_get_formation`. |
| `vesting_duration_months` | integer | No (default 48) | |
| `vesting_cliff_months` | integer | No (default 12) | Must be ≤ duration. |
| `vesting_start_date` | string | No (default `date_of_incorporation`) | `date_of_incorporation` or ISO `YYYY-MM-DD`. |

**Returns:** `success`, `founder_id`.

---

### 10. `atlas_set_governance`
Set the initial board of directors and the officer roster. Optionally override
the incorporator.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `directors` | array of `{ full_name }` | Yes (min 1) | |
| `officers` | array of `{ title, holder_name }` | Yes (min 1) | President / Secretary / Treasurer at minimum. |
| `incorporator_name` | string | No | Defaults to Atlas. |

**Returns:** `success`.

---

### 11. `atlas_set_principal_address`
Set the company's principal business / mailing address.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `line1` | string | Yes | |
| `line2` | string | No | |
| `city` | string | Yes | |
| `state` | string | Yes | Two-letter US state code. |
| `postal_code` | string | Yes | |
| `country` | string | No (default `US`) | |

**Returns:** `success`.

---

### 12. `atlas_set_tax_responsible_party`
Configure the EIN filing (IRS Form SS-4). The responsible party's SSN/ITIN is
collected securely via elicitation when `collect_ssn=true`.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `file_for_ein` | boolean | No (default `true`) | |
| `full_name` | string | Yes | Responsible party. |
| `has_us_tax_id` | boolean | No (default `true`) | |
| `fiscal_year_end_month` | string | No (default `December`) | |
| `collect_ssn` | boolean | No (default `false`) | **Securely elicit** SSN/ITIN. |
| `ssn_or_itin` | string | No | **Sensitive** fallback (sealed immediately). |

**Returns:** `success`, `ssn_status`.

---

### 13. `atlas_formation_submit`  *(destructive / irreversible)*
Attest and submit the formation. Fails if any blocking issues remain. After a
successful submit, all write tools return `FORMATION_LOCKED`.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `session_token` | string | Yes | |
| `application_id` | string | Yes | |
| `signatory_name` | string | Yes | Founder attesting. |
| `agree_to_terms` | boolean | Yes | Must be `true`. |

**Returns:** `application_id`, `status`, `submitted_at` (or `blocking_issues[]` if not ready).

---

## Resource

### `atlas://schema/delaware-c-corp`
Read-only resource returning the full field catalog (required / sensitive flags)
plus the Atlas defaults.

---

## Error Codes

Errors return `isError: true` with a `{ errorCode, message, field?, details? }`
JSON content block.

| Code | When |
| --- | --- |
| `VALIDATION_ERROR` | Input failed validation (e.g. cliff > duration, second primary founder). |
| `AUTH_ERROR` | Missing/invalid/expired `session_token`, or accessing another account's formation. |
| `FORMATION_NOT_FOUND` | No formation with the given `application_id`. |
| `FORMATION_LOCKED` | Write attempted after submission. |
| `INVALID_FOUNDER_ID` | A `founder_id` doesn't exist on this formation. |
| `OWNERSHIP_SUM_ERROR` | Allocations + equity pool don't sum to 100. |
| `READINESS_FAILED` | Submit blocked by unresolved issues. |
| `ELICITATION_UNSUPPORTED` | Client can't collect SSN via elicitation (use the fallback / web handoff). |

---

## Composite Flows

Composite flows are recommended orchestrations that chain several tools. An agent
(Claude/Codex) typically performs these automatically.

### Composite A — Full Formation (happy path)
1. `atlas_authenticate` → `session_token`
2. `atlas_formation_create` → `application_id`
3. `atlas_set_company_details`
4. `atlas_add_founder` (repeat per founder; exactly one `role="primary"`, `collect_ssn=true` for the primary)
5. `atlas_set_ownership` (percentages + pool, summing to 100)
6. `atlas_set_equity_terms` (once per founder)
7. `atlas_set_governance`
8. `atlas_set_principal_address`
9. `atlas_set_tax_responsible_party` (`collect_ssn=true`)
10. `atlas_formation_status` → resolve `blocking_issues`
11. `atlas_formation_submit` → `status: submitted`

### Composite B — Resume & Complete
1. `atlas_authenticate`
2. `atlas_list_formations` → choose `application_id`
3. `atlas_get_formation` → review current (masked) state
4. Fill remaining fields (any setters)
5. `atlas_formation_status` → resolve issues
6. `atlas_formation_submit`

### Composite C — Cap Table Setup
1. `atlas_add_founder` per founder → collect `founder_id`s
2. `atlas_set_ownership` with `{ founder_id: percent }` + `equity_pool_percent` summing to 100
3. `atlas_set_equity_terms` per founder
4. `atlas_formation_status` → confirms equity reconciles

### Composite D — Pre-Submission Review
1. `atlas_authenticate`
2. `atlas_get_formation` → masked review
3. `atlas_formation_status` → list blocking gaps
4. (Resolve, then re-run `atlas_formation_status`.)

---

## Field Groups Modeled (Delaware C-Corp)

| Group | Fields |
| --- | --- |
| Company | legal name, designator, backup names, business description, general-purpose clause, website |
| Capitalization | total authorized shares, par value, **ownership % per founder**, **option/equity pool %** |
| Registered agent | DE registered agent + DE registered office (provided by Atlas) |
| Address | principal business / mailing address |
| Founders | name, email, title, role (primary/co-founder), mailing address, citizenship, consideration, vesting, 83(b) intent, **SSN/ITIN (elicited + sealed)** |
| Governance | directors, officers, incorporator |
| Tax (SS-4) | EIN election, **responsible party + SSN/ITIN (elicited + sealed)**, fiscal year end |
| Attestation | signatory, agreement to terms |

---

*Not legal or tax advice. Not affiliated with Stripe or Atlas. A demonstration
of an incorporation intake flow over MCP.*
