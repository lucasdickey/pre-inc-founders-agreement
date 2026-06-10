# Atlas Incorporation MCP — Tool Reference

A proof-of-concept Model Context Protocol (MCP) server that replicates the field
inputs of a Stripe Atlas incorporation application (Delaware C-Corporation) as
agent-callable tools for Claude or Codex.

This document lists every tool, its inputs, and the recommended composite flows.

> Note: Authentication, the database, and PII "encryption" are emulated in this
> proof of concept. Sensitive identifiers (SSN/ITIN) are sealed before storage
> and only ever returned masked (e.g. `***-**-6789`).

---

## Conventions

- **`sessionToken`** is returned by `authenticate` and is **required on every
  other tool call**. It scopes all records to the owning account.
- **`applicationId`** is returned by `create_incorporation` and identifies the
  incorporation record on all subsequent calls.
- State (Delaware) and entity type (C-Corporation) are fixed, as in Stripe Atlas.

---

## Tools

### 1. `authenticate`
Sign in / sign up with an email to start an authenticated session (emulated
Clerk). Returns a `sessionToken` used on every other tool.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `email` | string (email) | Yes | Establishes your identity. |
| `password` | string | No | Recorded only as a one-way marker in this PoC. |

**Returns:** `sessionToken`, `userId`, `expiresAt`.

---

### 2. `create_incorporation`
Create a new Delaware C-Corp incorporation application, pre-filled with Atlas
defaults (10,000,000 authorized shares, $0.00001 par value, Delaware registered
agent).

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | From `authenticate`. |

**Returns:** `applicationId`, `status`.

---

### 3. `list_incorporations`
List all incorporation applications owned by the authenticated account.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |

**Returns:** array of `{ applicationId, company, status, founders, updatedAt }`.

---

### 4. `get_incorporation`
Return the full application record. Sensitive fields (SSN/ITIN) are returned
masked; plaintext is never exposed.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |

**Returns:** full masked application record.

---

### 5. `set_company_details`
Set the company name, entity designator, backup names, and business description.
State (Delaware) and entity type (C-Corporation) are fixed.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `legalName` | string | Yes | Base name without designator, e.g. "Acme Robotics". |
| `designator` | enum | No (default `Inc.`) | One of: `Inc.`, `Incorporated`, `Corporation`, `Corp.`, `Company`, `Co.` |
| `nameOptions` | string[] (max 2) | No | Backup names if the first is taken in Delaware. |
| `businessDescription` | string | Yes | Plain-language description. |
| `website` | string (url) | No | |

---

### 6. `set_share_structure`
Configure authorized shares, par value, shares issued at formation, and price
per share.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `authorizedShares` | integer | No (default 10,000,000) | |
| `parValuePerShare` | number | No (default 0.00001) | |
| `sharesIssuedAtFormation` | integer | Yes | Must be ≤ authorized shares. |
| `pricePerShare` | number | No (default 0.0001) | |

---

### 7. `set_principal_address`
Set the company's principal business / mailing address.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `line1` | string | Yes | |
| `line2` | string | No | |
| `city` | string | Yes | |
| `state` | string | Yes | Two-letter US state code. |
| `postalCode` | string | Yes | |
| `country` | string | No (default `US`) | |

---

### 8. `add_founder`
Add a founder / stockholder with a share allocation and optional SSN/ITIN. The
SSN/ITIN is sealed by the secure vault and only ever returned masked. Call once
per founder.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `fullName` | string | Yes | |
| `email` | string (email) | Yes | |
| `title` | string | Yes | e.g. CEO, CTO. |
| `shares` | integer | Yes | Shares allocated at formation. |
| `citizenshipCountry` | string | No (default `US`) | |
| `considerationType` | enum | No (default `cash`) | `cash`, `ip_assignment`, `services`, `mixed` |
| `ssnOrItin` | string | No | **Sensitive.** Sealed; never stored or returned in plaintext. |
| `plans83bElection` | boolean | No (default `true`) | 83(b) filing intent. |
| `mailingAddress` | object | No | Same fields as principal address. |
| `vesting` | object | No | `{ totalMonths (48), cliffMonths (12), accelerationOnExit (false) }` |

---

### 9. `set_governance`
Set the initial board of directors and the officer roster (President, Secretary,
Treasurer at minimum). Optionally override the incorporator.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `directors` | array of `{ fullName }` | Yes (min 1) | |
| `officers` | array of `{ title, holderName }` | Yes (min 1) | e.g. `{title:"President", holderName:"Jane Doe"}` |
| `incorporatorName` | string | No | Defaults to Atlas as incorporator. |

---

### 10. `set_tax_responsible_party`
Configure the EIN filing (IRS Form SS-4). The responsible party's SSN/ITIN is
sealed by the secure vault and only ever returned masked.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `fileForEin` | boolean | No (default `true`) | |
| `fullName` | string | Yes | Responsible party full name. |
| `ssnOrItin` | string | No | **Sensitive.** Sealed. Omit if no US tax id. |
| `hasUsTaxId` | boolean | No (default `true`) | |
| `fiscalYearEndMonth` | string | No (default `December`) | |

---

### 11. `validate_incorporation`
Run Atlas-style completeness checks. Returns the list of blocking gaps; an empty
list means the application is ready to submit.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |

**Returns:** `{ issues: [{ step, field, message }] }`.

---

### 12. `submit_incorporation`
Attest and submit the application for filing. Fails if any validation issues
remain. Emulated equivalent of handing the package to Atlas for the Delaware
filing.

| Input | Type | Required | Notes |
| --- | --- | --- | --- |
| `sessionToken` | string | Yes | |
| `applicationId` | string | Yes | |
| `signatoryName` | string | Yes | Founder attesting to the filing. |
| `agreeToTerms` | boolean | Yes | Must be `true` to submit. |

**Returns:** `{ applicationId, status: "submitted", submittedAt }`.

---

## Resource

### `atlas://schema/delaware-c-corp`
A read-only resource returning the full field catalog (which fields are required,
which are sensitive) plus the Atlas defaults. Useful for clients that want to
discover the schema before collecting inputs.

---

## Composite Flows

Composite flows are recommended orchestrations that chain several tools to
accomplish a higher-level goal. An agent (Claude/Codex) typically performs these
automatically.

### Composite A — Full Incorporation (happy path)
End-to-end formation of a Delaware C-Corp.

1. `authenticate` → `sessionToken`
2. `create_incorporation` → `applicationId`
3. `set_company_details`
4. `set_share_structure`
5. `add_founder` (repeat per founder; allocations must sum to shares issued)
6. `set_governance`
7. `set_principal_address`
8. `set_tax_responsible_party`
9. `validate_incorporation` → confirm `issues: []`
10. `submit_incorporation` → `status: submitted`

### Composite B — Resume & Complete
Pick up an in-progress application and finish it.

1. `authenticate`
2. `list_incorporations` → choose `applicationId`
3. `get_incorporation` → review current (masked) state
4. Fill remaining fields (any setters from Composite A)
5. `validate_incorporation` → resolve listed issues
6. `submit_incorporation`

### Composite C — Pre-Submission Review
Verify completeness without submitting.

1. `authenticate`
2. `get_incorporation` → review masked record
3. `validate_incorporation` → list of blocking gaps
4. (Address any gaps, then re-run `validate_incorporation`.)

### Composite D — Cap Table Setup
Allocate ownership across founders consistently.

1. `set_share_structure` (set `sharesIssuedAtFormation`)
2. `add_founder` per founder, ensuring the sum of `shares` equals
   `sharesIssuedAtFormation`
3. `validate_incorporation` → confirms allocations reconcile

---

## Field Groups Modeled (Delaware C-Corp)

| Group | Fields |
| --- | --- |
| Company | legal name, designator, backup names, business description, general-purpose clause, website |
| Capitalization | authorized shares, par value, shares issued, price per share |
| Registered agent | DE registered agent + DE registered office (provided by Atlas) |
| Address | principal business / mailing address |
| Founders | name, email, title, mailing address, citizenship, shares, consideration, vesting, 83(b) intent, **SSN/ITIN (sealed)** |
| Governance | directors, officers, incorporator |
| Tax (SS-4) | EIN election, **responsible party + SSN/ITIN (sealed)**, fiscal year end |
| Attestation | signatory, agreement to terms |

---

*Not legal or tax advice. Not affiliated with Stripe or Atlas. A demonstration
of an incorporation intake flow over MCP.*
