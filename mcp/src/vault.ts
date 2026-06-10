/**
 * Emulated secure vault.
 *
 * The brief asks us to "emulate secure data storage as opposed to actually
 * encrypting everything." So this module models the SHAPE and SECURITY BOUNDARY
 * of a real field-level encryption system without pulling in a KMS:
 *
 *   - Sensitive values (SSN/ITIN, EIN, DOB, etc.) are "sealed" before they ever
 *     touch the database. A sealed value is an opaque envelope, not plaintext.
 *   - Every read path returns a MASKED representation (e.g. "***-**-6789").
 *     Plaintext is only recoverable through `unseal`, which is intentionally
 *     never exposed over MCP — it exists for an authorized backend (e.g. the
 *     filing service) and is the single auditable choke point.
 *
 * In production, `seal`/`unseal` would call out to AWS KMS / GCP KMS / Vault
 * (envelope encryption with AES-256-GCM), and `ciphertext` would be real
 * ciphertext. Here `ciphertext` is base64 — clearly labelled EMULATED — so the
 * POC stays runnable and dependency-free.
 */

export type DataClassification = "tax_id" | "pii" | "financial" | "contact";

export interface SealedValue {
  /** Discriminator so the store and serializers can recognise sealed blobs. */
  __sealed: true;
  /** EMULATED. Real impl: "AES-256-GCM" via envelope encryption. */
  alg: "emulated-vault-v1";
  classification: DataClassification;
  /** Safe-to-display masked form, e.g. "***-**-6789". */
  masked: string;
  /** EMULATED ciphertext (base64 of plaintext). NOT secure. */
  ciphertext: string;
  sealedAt: string;
}

export function isSealed(value: unknown): value is SealedValue {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __sealed?: unknown }).__sealed === true
  );
}

/** Mask a value for display based on its data classification. */
function maskValue(raw: string, classification: DataClassification): string {
  const v = raw.trim();
  switch (classification) {
    case "tax_id": {
      // SSN/ITIN (9 digits) or EIN — reveal only the last 4.
      const digits = v.replace(/\D/g, "");
      const last4 = digits.slice(-4).padStart(4, "•");
      return `***-**-${last4}`;
    }
    case "contact": {
      // Email: keep first char + domain.
      const at = v.indexOf("@");
      if (at > 0) return `${v[0]}***${v.slice(at)}`;
      return `${v.slice(0, 1)}***`;
    }
    case "financial":
      return "••••••";
    case "pii":
    default: {
      if (v.length <= 2) return "••";
      return `${v.slice(0, 1)}••••${v.slice(-1)}`;
    }
  }
}

/**
 * Seal a sensitive value. The plaintext does not survive past this call except
 * inside the returned (emulated) ciphertext.
 */
export function seal(
  raw: string,
  classification: DataClassification
): SealedValue {
  return {
    __sealed: true,
    alg: "emulated-vault-v1",
    classification,
    masked: maskValue(raw, classification),
    // EMULATED encryption — base64, not a cipher. Do not ship to production.
    ciphertext: Buffer.from(raw, "utf8").toString("base64"),
    sealedAt: new Date().toISOString(),
  };
}

/**
 * Recover plaintext from a sealed value. Deliberately NOT wired to any MCP tool
 * — only an authorized backend (the actual Delaware filing job) should call it.
 */
export function unseal(sealed: SealedValue): string {
  return Buffer.from(sealed.ciphertext, "base64").toString("utf8");
}

/** Render a sealed value for safe display (drops the ciphertext entirely). */
export function maskedView(sealed: SealedValue): {
  sealed: true;
  masked: string;
  classification: DataClassification;
} {
  return {
    sealed: true,
    masked: sealed.masked,
    classification: sealed.classification,
  };
}
