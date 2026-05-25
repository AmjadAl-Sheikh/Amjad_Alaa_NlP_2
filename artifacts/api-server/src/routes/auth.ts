import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable, studentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RequestOtpBody } from "@workspace/api-zod";
import {
  generateId,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from "../lib/session";

const router: IRouter = Router();

// POST /auth/request-otp — تسجيل دخول مباشر بالإيميل
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
    return;
  }
  const { email } = parsed.data;

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    const newId = generateId();
    [user] = await db.insert(usersTable).values({ id: newId, email }).returning();
  }

  const sessionId = generateId();
  await db.insert(sessionsTable).values({ id: sessionId, userId: user.id });
  const token = createSessionToken(sessionId);
  setSessionCookie(res, token);

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, email));

  req.log.info({ email }, "Direct login successful");
  res.json({
    token,
    userId: user.id,
    email: user.email,
    studentName: student?.name ?? null,
    major: student?.major ?? null,
    gpa: student?.gpa ?? null,
    completedHours: student?.completedHours ?? null,
    level: student?.level ?? null,
    isAuthenticated: true,
  });
});

// POST /auth/verify-otp — غير مستخدم
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  res.status(410).json({ error: "هذا المسار لم يعد مستخدماً" });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  if (req.sessionId) {
    await db.delete(sessionsTable).where(eq(sessionsTable.id, req.sessionId));
  }
  clearSessionCookie(res);
  res.json({ success: true, message: "تم تسجيل الخروج" });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ error: "المستخدم غير موجود" });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, user.email));
  res.json({
    userId: user.id,
    email: user.email,
    studentName: student?.name ?? null,
    major: student?.major ?? null,
    gpa: student?.gpa ?? null,
    completedHours: student?.completedHours ?? null,
    level: student?.level ?? null,
    isAuthenticated: true,
  });
});

export default router;
