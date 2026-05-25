import { createHmac, randomBytes } from "crypto";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

const SESSION_SECRET = process.env.SESSION_SECRET || "ppu-dev-secret-change-in-prod";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const SESSION_COOKIE = "ppu_session";

export function createSessionToken(sessionId: string): string {
  const payload = Buffer.from(JSON.stringify({ sid: sessionId, exp: Date.now() + SESSION_TTL_MS })).toString("base64url");
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string): { sid: string } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
  if (sig !== expected) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as { sid: string; exp: number };
    if (data.exp < Date.now()) return null;
    return { sid: data.sid };
  } catch {
    return null;
  }
}

export function generateId(): string {
  return randomBytes(16).toString("hex");
}

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    sessionId?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[SESSION_COOKIE] || req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }
  const parsed = verifySessionToken(token);
  if (!parsed) {
    res.status(401).json({ error: "الجلسة منتهية، يرجى تسجيل الدخول مجدداً" });
    return;
  }
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, parsed.sid));
  if (!session) {
    res.status(401).json({ error: "الجلسة غير موجودة" });
    return;
  }
  req.userId = session.userId;
  req.sessionId = session.id;
  await db.update(sessionsTable).set({ lastActive: new Date() }).where(eq(sessionsTable.id, session.id));
  next();
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE);
}
