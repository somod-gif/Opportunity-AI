import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { userSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SESSION_COOKIE = "opportunity_session";
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(email: string): Promise<string> {
  const { v4: uuidv4 } = await import("uuid");
  const token = uuidv4();

  await db
    .insert(userSessions)
    .values({ sessionId: token, email, lastVisited: new Date() })
    .onConflictDoUpdate({ target: userSessions.email, set: { sessionId: token, lastVisited: new Date() } });

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<{
  sessionId: string;
  email: string | null;
  name: string | null;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db
    .select({ sessionId: userSessions.sessionId, email: userSessions.email, name: userSessions.name })
    .from(userSessions)
    .where(eq(userSessions.sessionId, token))
    .limit(1)
    .then((r) => r[0] ?? null);

  return session;
}

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const existing = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.email, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (existing) {
    return { success: false, error: "Email already registered" };
  }

  const passwordHash = await hashPassword(password);
  const { v4: uuidv4 } = await import("uuid");
  const sessionId = uuidv4();

  await db.insert(userSessions).values({
    sessionId,
    email,
    name,
    passwordHash,
    profile: { name, registeredAt: new Date().toISOString() },
  });

  return { success: true };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  const user = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.email, email))
    .limit(1)
    .then((r) => r[0] ?? null);

  if (!user || !user.passwordHash) {
    return { success: false, error: "Invalid email or password" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, error: "Invalid email or password" };
  }

  const token = await createSession(email);
  return { success: true, token };
}
