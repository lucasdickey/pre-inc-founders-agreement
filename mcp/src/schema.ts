/**
 * Stripe Atlas — Delaware C-Corporation incorporation application model.
 *
 * These are the core input fields a founder supplies to Atlas, which Atlas turns
 * into the actual Delaware filing artifacts:
 *   - Certificate of Incorporation (filed with the DE Division of Corporations)
 *   - Bylaws, board consents, stock purchase agreements, 83(b) guidance
 *   - IRS Form SS-4 (EIN application)
 *
 * Atlas only forms Delaware C-Corps, so `stateOfIncorporation` and `entityType`
 * are fixed. Equity is modeled as ownership PERCENTAGES (founders + an option
 * pool) that sum to 100, over a `totalShares` cap — matching the Atlas data
 * model. Sensitive identifiers (SSN/ITIN) are stored sealed by the vault and
 * never held as plaintext at rest.
 */

import { randomUUID } from "node:crypto";
import { isSealed, maskedView, type SealedValue } from "./vault.ts";

export type ApplicationStatus =
  | "draft"
  | "in_progress"
  | "ready_for_review"
  | "submitted";

export type EntityDesignator =
  | "Inc."
  | "Incorporated"
  | "Corporation"
  | "Corp."
  | "Company"
  | "Co.";

export const ENTITY_DESIGNATORS: EntityDesignator[] = [
  "Inc.",
  "Incorporated",
  "Corporation",
  "Corp.",
  "Company",
  "Co.",
];

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  /** Two-letter US state or province. */
  state: string;
  postalCode: string;
  country: string;
}

export interface CompanyDetails {
  /** Base name without the entity designator, e.g. "Acme Robotics". */
  legalName: string | null;
  designator: EntityDesignator;
  /** Up to two backup names in case the first is taken in Delaware. */
  nameOptions: string[];
  stateOfIncorporation: "Delaware";
  entityType: "C-Corporation";
  /** Plain-language description of what the company does. */
  businessDescription: string | null;
  /** General-purpose clause that appears in the Certificate of Incorporation. */
  businessPurpose: string;
  website?: string;
}

/**
 * Capitalization. Ownership is expressed as percentages (per founder + an
 * option pool) that must sum to 100, over `totalShares` authorized shares.
 */
export interface Capitalization {
  /** Total authorized shares. Atlas default: 10,000,000. */
  totalShares: number;
  /** Par value per share. Atlas default: $0.00001. */
  parValuePerShare: number;
  /** Percentage reserved for the option/equity pool (0–50). */
  equityPoolPercent: number;
  /** Map of founder id -> ownership percent. Founders + pool must sum to 100. */
  allocations: Record<string, number>;
}

export interface VestingTerms {
  durationMonths: number;
  cliffMonths: number;
  /** "date_of_incorporation" or an ISO YYYY-MM-DD date. */
  startDate: string;
}

export type FounderRole = "primary" | "co_founder";

export interface FounderStockholder {
  id: string;
  fullName: string;
  email: string;
  /** Title/role, e.g. "CEO", "CTO". */
  title: string;
  /** The primary founder is the account representative (SSN collected). */
  role: FounderRole;
  mailingAddress: Address | null;
  citizenshipCountry: string;
  considerationType: "cash" | "ip_assignment" | "services" | "mixed";
  /** Set via atlas_set_equity_terms. */
  vesting: VestingTerms | null;
  /** SSN or ITIN — sealed by the vault. Null if not yet provided. */
  ssnOrItin: SealedValue | null;
  /** Founders typically file an 83(b) within 30 days of a stock purchase. */
  plans83bElection: boolean;
}

export interface Officer {
  title: string;
  holderName: string;
}

export interface Governance {
  /** Who signs the Certificate of Incorporation. Atlas usually acts here. */
  incorporatorName: string;
  /** Initial board of directors. */
  directors: { fullName: string }[];
  /** Officer roster — President, Secretary, Treasurer at minimum. */
  officers: Officer[];
}

export interface ResponsibleParty {
  fullName: string;
  /** SSN or ITIN — sealed by the vault. Null for non-US responsible parties. */
  ssnOrItin: SealedValue | null;
  hasUsTaxId: boolean;
}

export interface TaxFiling {
  /** Whether Atlas should file IRS Form SS-4 to obtain an EIN. */
  fileForEin: boolean;
  responsibleParty: ResponsibleParty | null;
  entityTaxClassification: "C-Corporation";
  /** e.g. "December" — the corporation's fiscal year end month. */
  fiscalYearEndMonth: string;
}

export interface Attestation {
  agreedToTerms: boolean;
  signatoryName: string;
  signedAt: string;
}

export interface IncorporationApplication {
  id: string;
  ownerUserId: string;
  status: ApplicationStatus;
  company: CompanyDetails;
  capitalization: Capitalization;
  registeredAgent: RegisteredAgent;
  principalAddress: Address | null;
  founders: FounderStockholder[];
  governance: Governance;
  taxFiling: TaxFiling;
  attestation: Attestation | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
}

export interface RegisteredAgent {
  /** Delaware requires a registered agent with a physical DE address. */
  name: string;
  office: Address;
}

// --- Atlas defaults --------------------------------------------------------

export const ATLAS_DEFAULTS = {
  stateOfIncorporation: "Delaware" as const,
  entityType: "C-Corporation" as const,
  totalShares: 10_000_000,
  parValuePerShare: 0.00001,
  businessPurpose:
    "To engage in any lawful act or activity for which corporations may be " +
    "organized under the General Corporation Law of the State of Delaware.",
  registeredAgent: {
    name: "Atlas Registered Agent (emulated partner)",
    office: {
      line1: "251 Little Falls Drive",
      city: "Wilmington",
      state: "DE",
      postalCode: "19808",
      country: "US",
    },
  } satisfies RegisteredAgent,
} as const;

export function createEmptyApplication(ownerUserId: string): IncorporationApplication {
  const now = new Date().toISOString();
  return {
    id: `atlas_app_${randomUUID()}`,
    ownerUserId,
    status: "draft",
    company: {
      legalName: null,
      designator: "Inc.",
      nameOptions: [],
      stateOfIncorporation: ATLAS_DEFAULTS.stateOfIncorporation,
      entityType: ATLAS_DEFAULTS.entityType,
      businessDescription: null,
      businessPurpose: ATLAS_DEFAULTS.businessPurpose,
    },
    capitalization: {
      totalShares: ATLAS_DEFAULTS.totalShares,
      parValuePerShare: ATLAS_DEFAULTS.parValuePerShare,
      equityPoolPercent: 0,
      allocations: {},
    },
    registeredAgent: structuredClone(ATLAS_DEFAULTS.registeredAgent),
    principalAddress: null,
    founders: [],
    governance: {
      incorporatorName: "Atlas (emulated incorporator)",
      directors: [],
      officers: [],
    },
    taxFiling: {
      fileForEin: true,
      responsibleParty: null,
      entityTaxClassification: "C-Corporation",
      fiscalYearEndMonth: "December",
    },
    attestation: null,
    createdAt: now,
    updatedAt: now,
    submittedAt: null,
  };
}

// --- Validation ------------------------------------------------------------

export interface ValidationIssue {
  section: "company" | "founders" | "equity" | "governance" | "address" | "tax" | "attestation";
  field: string;
  message: string;
}

/** Tolerance for floating-point ownership sums. */
const OWNERSHIP_TOLERANCE = 0.01;

export function ownershipTotal(cap: Capitalization): number {
  const founders = Object.values(cap.allocations).reduce((s, v) => s + v, 0);
  return founders + cap.equityPoolPercent;
}

/**
 * Completeness check that mirrors what Atlas requires before a Delaware filing
 * can be assembled. Returns the list of blocking gaps (empty == ready).
 */
export function validateApplication(app: IncorporationApplication): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const need = (
    cond: boolean,
    section: ValidationIssue["section"],
    field: string,
    message: string
  ) => {
    if (!cond) issues.push({ section, field, message });
  };

  // Company
  need(!!app.company.legalName, "company", "legalName", "Company legal name is required.");
  need(
    !!app.company.businessDescription,
    "company",
    "businessDescription",
    "Business description is required."
  );

  // Founders
  need(app.founders.length > 0, "founders", "founders", "At least one founder/stockholder is required.");
  need(
    app.founders.some((f) => f.role === "primary"),
    "founders",
    "primary",
    "Exactly one primary (representative) founder is required."
  );

  // Equity
  if (app.founders.length > 0) {
    const allocated = app.founders.filter((f) => app.capitalization.allocations[f.id] === undefined);
    need(
      allocated.length === 0,
      "equity",
      "allocations",
      `Every founder needs an ownership percentage. Missing: ${allocated.map((f) => f.fullName).join(", ")}.`
    );
    const total = ownershipTotal(app.capitalization);
    need(
      Math.abs(total - 100) <= OWNERSHIP_TOLERANCE,
      "equity",
      "allocations",
      `Ownership (founders + equity pool) must sum to 100. Current total: ${total}.`
    );
  }

  // Governance
  need(app.governance.directors.length > 0, "governance", "directors", "At least one director is required.");
  need(app.governance.officers.length > 0, "governance", "officers", "At least one officer is required.");

  // Principal address
  need(!!app.principalAddress, "address", "principalAddress", "Principal business address is required.");

  // Tax / EIN
  if (app.taxFiling.fileForEin) {
    need(
      !!app.taxFiling.responsibleParty,
      "tax",
      "responsibleParty",
      "An EIN responsible party is required when filing for an EIN."
    );
  }

  // Attestation
  need(
    !!app.attestation?.agreedToTerms,
    "attestation",
    "agreedToTerms",
    "Founder must agree to terms before submitting."
  );

  return issues;
}

// --- Masked serialization --------------------------------------------------

/** Deep-clone a value, replacing any sealed blob with its masked view. */
export function maskDeep<T>(value: T): unknown {
  if (isSealed(value)) return maskedView(value);
  if (Array.isArray(value)) return value.map((v) => maskDeep(v));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = maskDeep(v);
    return out;
  }
  return value;
}

/** Human-readable full company name. */
export function fullCompanyName(c: CompanyDetails): string {
  if (!c.legalName) return "(unnamed)";
  return `${c.legalName} ${c.designator}`;
}

// --- Field catalog (exposed as an MCP resource) ----------------------------

export interface FieldDoc {
  group: string;
  field: string;
  required: boolean;
  sensitive: boolean;
  notes: string;
}

export const FIELD_CATALOG: FieldDoc[] = [
  { group: "Company", field: "legalName", required: true, sensitive: false, notes: "Base name without designator." },
  { group: "Company", field: "designator", required: true, sensitive: false, notes: "Inc., Corp., etc." },
  { group: "Company", field: "nameOptions", required: false, sensitive: false, notes: "Up to 2 backups if the first is taken in DE." },
  { group: "Company", field: "stateOfIncorporation", required: true, sensitive: false, notes: "Fixed: Delaware (Atlas)." },
  { group: "Company", field: "entityType", required: true, sensitive: false, notes: "Fixed: C-Corporation (Atlas)." },
  { group: "Company", field: "businessDescription", required: true, sensitive: false, notes: "What the company does." },
  { group: "Equity", field: "totalShares", required: false, sensitive: false, notes: "Authorized shares. Default 10,000,000." },
  { group: "Equity", field: "parValuePerShare", required: false, sensitive: false, notes: "Default $0.00001." },
  { group: "Equity", field: "equityPoolPercent", required: false, sensitive: false, notes: "Option pool %, 0–50." },
  { group: "Equity", field: "allocations", required: true, sensitive: false, notes: "Founder % map; founders + pool must sum to 100." },
  { group: "Equity", field: "vesting", required: false, sensitive: false, notes: "Per-founder vesting (duration, cliff, start)." },
  { group: "RegisteredAgent", field: "name + office", required: true, sensitive: false, notes: "DE requires an agent with a DE address. Atlas provides one." },
  { group: "Address", field: "principalAddress", required: true, sensitive: false, notes: "Principal business / mailing address." },
  { group: "Founder", field: "fullName/email/title", required: true, sensitive: false, notes: "Per stockholder." },
  { group: "Founder", field: "role", required: true, sensitive: false, notes: "primary (representative) or co_founder." },
  { group: "Founder", field: "ssnOrItin", required: false, sensitive: true, notes: "Collected via secure elicitation; sealed; masked on read." },
  { group: "Founder", field: "plans83bElection", required: false, sensitive: false, notes: "83(b) within 30 days of purchase." },
  { group: "Governance", field: "directors", required: true, sensitive: false, notes: "Initial board." },
  { group: "Governance", field: "officers", required: true, sensitive: false, notes: "President / Secretary / Treasurer at minimum." },
  { group: "Governance", field: "incorporatorName", required: true, sensitive: false, notes: "Signs the Certificate. Atlas usually acts here." },
  { group: "Tax", field: "fileForEin", required: true, sensitive: false, notes: "File IRS Form SS-4 for an EIN." },
  { group: "Tax", field: "responsibleParty.ssnOrItin", required: false, sensitive: true, notes: "Collected via secure elicitation; sealed." },
  { group: "Tax", field: "fiscalYearEndMonth", required: true, sensitive: false, notes: "Default December." },
  { group: "Attestation", field: "agreedToTerms / signatoryName", required: true, sensitive: false, notes: "Required before submit." },
];
