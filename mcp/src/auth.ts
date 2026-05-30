/**
 * Emulated Clerk authentication.
 *
 * The brief asks for "some sort of authentication service such as Clerk" that
 * ties data to associated records. This module models Clerk's surface — sign in
 * with an identity, get back a session token, present that token on every
 * subsequent call — without a network dependency.
 *
 * The doola reference MCP requires a `customerId` on every tool call; we follow
 * the same convention with a `sessionToken`. To go real, replace
 * `authenticate`/`verifySessionToken` with Clerk SDK calls (AUTH_MODE=clerk).
 */

import { createHash, randomBytes } from "node:crypto";
import {
  createSession,
  getSession,
  upsertUser,
  type UserRecord,
} from "./store.ts";

const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours

export interface AuthenticatedActor {
  userId: string;
  email: string;
}

/** EMULATED password handling — a salted marker, never the password itself. */
function passwordMarker(password: string | undefined): string | null {
  if (!password) return null;
  return createHash("sha256").update(`atlas-poc:${password}`).digest("hex").slice(0, 16);
}

export interface AuthResult {
  sessionToken: string;
  userId: string;
  email: string;
  expiresAt: string;
}

/**
 * Sign in / sign up. In this POC any email establishes an identity; if a
 * password is supplied it's recorded as a one-way marker for demonstration.
 */
export function authenticate(email: string, password?: string): AuthResult {
  const user: UserRecord = upsertUser(email, passwordMarker(password));
  const token = `atlas_sess_${randomBytes(24).toString("hex")}`;
  const session = createSession(user.id, token, SESSION_TTL_MS);
  return {
    sessionToken: token,
    userId: user.id,
    email: user.email,
    expiresAt: session.expiresAt,
  };
}

export class AuthError extends Error {}

/**
 * Resolve a session token to an actor. Throws AuthError if missing/expired —
 * every data tool calls this first so records are always scoped to an owner.
 */
export function verifySessionToken(token: string | undefined): AuthenticatedActor {
  if (!token) {
    throw new AuthError(
      "Not authenticated. Call `authenticate` with your email to get a sessionToken, then pass it on every call."
    );
  }
  const session = getSession(token);
  if (!session) {
    throw new AuthError("Invalid sessionToken. Re-run `authenticate` to get a fresh one.");
  }
  if (Date.now() > Date.parse(session.expiresAt)) {
    throw new AuthError("Session expired. Re-run `authenticate` to get a fresh sessionToken.");
  }
  return { userId: session.userId, email: "" };
}
