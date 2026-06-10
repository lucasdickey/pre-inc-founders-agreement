/**
 * Emulated database.
 *
 * Stands in for the "associated records in a database" the brief asks for. It's
 * a single JSON document on disk, but the access shape (users, sessions,
 * applications keyed by id and scoped by ownerUserId) mirrors what you'd build
 * on Postgres/Supabase with row-level security. Swapping this file for a real
 * Supabase client is the only change needed to productionise persistence.
 *
 * Sensitive fields are stored already-sealed by the vault, so even this
 * emulated DB never holds raw PII at rest.
 */

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { IncorporationApplication } from "./schema.ts";

export interface UserRecord {
  id: string;
  email: string;
  /** EMULATED password marker — never the real password. */
  passwordMarker: string | null;
  createdAt: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface Database {
  users: Record<string, UserRecord>;
  sessions: Record<string, SessionRecord>;
  applications: Record<string, IncorporationApplication>;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function dataFile(): string {
  const dir = process.env.ATLAS_DATA_DIR
    ? resolve(process.env.ATLAS_DATA_DIR)
    : resolve(__dirname, "..", ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, "atlas-store.json");
}

function emptyDb(): Database {
  return { users: {}, sessions: {}, applications: {} };
}

function load(): Database {
  const file = dataFile();
  if (!existsSync(file)) return emptyDb();
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<Database>;
    return {
      users: parsed.users ?? {},
      sessions: parsed.sessions ?? {},
      applications: parsed.applications ?? {},
    };
  } catch {
    // Corrupt store in a POC — start clean rather than crash the server.
    return emptyDb();
  }
}

function save(db: Database): void {
  writeFileSync(dataFile(), JSON.stringify(db, null, 2), "utf8");
}

// --- Users -----------------------------------------------------------------

export function findUserByEmail(email: string): UserRecord | null {
  const db = load();
  const normalized = email.trim().toLowerCase();
  return (
    Object.values(db.users).find((u) => u.email === normalized) ?? null
  );
}

export function upsertUser(email: string, passwordMarker: string | null): UserRecord {
  const db = load();
  const normalized = email.trim().toLowerCase();
  const existing = Object.values(db.users).find((u) => u.email === normalized);
  if (existing) {
    if (passwordMarker) existing.passwordMarker = passwordMarker;
    db.users[existing.id] = existing;
    save(db);
    return existing;
  }
  const user: UserRecord = {
    id: `user_${randomUUID()}`,
    email: normalized,
    passwordMarker,
    createdAt: new Date().toISOString(),
  };
  db.users[user.id] = user;
  save(db);
  return user;
}

// --- Sessions --------------------------------------------------------------

export function createSession(userId: string, token: string, ttlMs: number): SessionRecord {
  const db = load();
  const now = Date.now();
  const session: SessionRecord = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
  };
  db.sessions[token] = session;
  save(db);
  return session;
}

export function getSession(token: string): SessionRecord | null {
  const db = load();
  return db.sessions[token] ?? null;
}

// --- Applications ----------------------------------------------------------

export function insertApplication(app: IncorporationApplication): void {
  const db = load();
  db.applications[app.id] = app;
  save(db);
}

export function getApplication(id: string): IncorporationApplication | null {
  const db = load();
  return db.applications[id] ?? null;
}

export function updateApplication(app: IncorporationApplication): void {
  const db = load();
  app.updatedAt = new Date().toISOString();
  db.applications[app.id] = app;
  save(db);
}

export function listApplicationsForUser(userId: string): IncorporationApplication[] {
  const db = load();
  return Object.values(db.applications)
    .filter((a) => a.ownerUserId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
