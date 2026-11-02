import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { query } from "./db";
import type { User } from "./types";

const COOKIE = "regali_session";
const MAX_AGE = 60 * 60 * 24 * 365; // un anno: è un'app di famiglia

function secretKey() {
  const raw =
    process.env.SESSION_SECRET ??
    process.env.DATABASE_URL ??
    "regali-dev-secret-change-me";
  return createHash("sha256").update(raw).digest();
}

export function normalizeUsername(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    const rows = await query<User>(
      `select id, name, username, birth_date, is_admin, password_changed
         from users where id = $1`,
      [payload.sub],
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
