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
 * are fixed. Everything else is collected here. Sensitive identifiers (SSN/ITIN)
 * are stored sealed by the vault and never held as plaintext at rest.
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

export interface ShareStructure {
  /** Total shares the corporation is authorized to issue. Atlas default: 10M. */
  authorizedShares: number;
  /** Par value per share. Atlas default: $0.00001. */
  parValuePerShare: number;
  /** Shares actually issued to founders at formation. */
  sharesIssuedAtFormation: number | null;
  /** Price founders pay per share. Atlas default: $0.0001. */
  pricePerShare: number;
}

export interface RegisteredAgent {
  /** Delaware requires a registered agent with a physical DE address. */
  name: string;
  office: Address;
}

export interface VestingTerms {
  totalMonths: number;
  cliffMonths: number;
  accelerationOnExit: boolean;
}

export interface FounderStockholder {
  id: string;
  fullName: string;
  email: string;
  /** Title/role, e.g. "CEO", "CTO". */
  title: string;
  mailingAddress: Address | null;
  citizenshipCountry: string;
  /** Shares allocated to this founder at formation. */
  shares: number;
  considerationType: "cash" | "ip_assignment" | "services" | "mixed";
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
  shareStructure: ShareStructure;
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

// --- Atlas defaults --------------------------------------------------------

export const ATLAS_DEFAULTS = {
  stateOfIncorporation: "Delaware" as const,
  entityType: "C-Corporation" as const,
  authorizedShares: 10_000_000,
  parValuePerShare: 0.00001,
  pricePerShare: 0.0001,
  businessPurpose:
    "To engage in any lawful act or activity for which corporations may be " +
    "organized under the General Corporation Law of the State of Delaware.",
  /**
   * Atlas pairs every company with a Delaware registered agent. Emulated here
   * with a placeholder DE office address.
   */
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
    shareStructure: {
      authorizedShares: ATLAS_DEFAULTS.authorizedShares,
      parValuePerShare: ATLAS_DEFAULTS.parValuePerShare,
      sharesIssuedAtFormation: null,
      pricePerShare: ATLAS_DEFAULTS.pricePerShare,
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
  step: string;
  field: string;
  message: string;
}

/**
 * Completeness check that mirrors what Atlas requires before a Delaware filing
 * can be assembled. Returns the list of blocking gaps (empty == ready).
 */
export function validateApplication(app: IncorporationApplication): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const need = (cond: boolean, step: string, field: string, message: string) => {
    if (!cond) issues.push({ step, field, message });
  };

  // Company
  need(!!app.company.legalName, "company", "legalName", "Company legal name is required.");
  need(
    !!app.company.businessDescription,
    "company",
    "businessDescription",
    "Business description is required."
  );

  // Shares
  const issued = app.shareStructure.sharesIssuedAtFormation ?? 0;
  need(issued > 0, "shares", "sharesIssuedAtFormation", "Shares issued at formation must be > 0.");
  need(
    issued <= app.shareStructure.authorizedShares,
    "shares",
    "sharesIssuedAtFormation",
    "Shares issued cannot exceed authorized shares."
  );

  // Founders
  need(app.founders.length > 0, "founders", "founders", "At least one founder/stockholder is required.");
  const allocated = app.founders.reduce((sum, f) => sum + f.shares, 0);
  if (app.founders.length > 0) {
    need(
      allocated === issued,
      "founders",
      "shares",
      `Founder share allocations (${allocated}) must equal shares issued at formation (${issued}).`
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
  { group: "Shares", field: "authorizedShares", required: true, sensitive: false, notes: "Default 10,000,000." },
  { group: "Shares", field: "parValuePerShare", required: true, sensitive: false, notes: "Default $0.00001." },
  { group: "Shares", field: "sharesIssuedAtFormation", required: true, sensitive: false, notes: "Must equal sum of founder shares." },
  { group: "Shares", field: "pricePerShare", required: true, sensitive: false, notes: "Founder purchase price. Default $0.0001." },
  { group: "RegisteredAgent", field: "name + office", required: true, sensitive: false, notes: "DE requires an agent with a DE address. Atlas provides one." },
  { group: "Address", field: "principalAddress", required: true, sensitive: false, notes: "Principal business / mailing address." },
  { group: "Founder", field: "fullName/email/title", required: true, sensitive: false, notes: "Per stockholder." },
  { group: "Founder", field: "shares", required: true, sensitive: false, notes: "Allocation at formation." },
  { group: "Founder", field: "ssnOrItin", required: false, sensitive: true, notes: "Sealed in the vault; masked on read." },
  { group: "Founder", field: "plans83bElection", required: false, sensitive: false, notes: "83(b) within 30 days of purchase." },
  { group: "Governance", field: "directors", required: true, sensitive: false, notes: "Initial board." },
  { group: "Governance", field: "officers", required: true, sensitive: false, notes: "President / Secretary / Treasurer at minimum." },
  { group: "Governance", field: "incorporatorName", required: true, sensitive: false, notes: "Signs the Certificate. Atlas usually acts here." },
  { group: "Tax", field: "fileForEin", required: true, sensitive: false, notes: "File IRS Form SS-4 for an EIN." },
  { group: "Tax", field: "responsibleParty.ssnOrItin", required: false, sensitive: true, notes: "Sealed in the vault; required for SS-4 when filing for EIN." },
  { group: "Tax", field: "fiscalYearEndMonth", required: true, sensitive: false, notes: "Default December." },
  { group: "Attestation", field: "agreedToTerms / signatoryName", required: true, sensitive: false, notes: "Required before submit." },
];
