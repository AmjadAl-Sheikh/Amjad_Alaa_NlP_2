import { Router, type IRouter } from "express";
import { db, usersTable, sessionsTable, studentsTable, otpCodesTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { RequestOtpBody } from "@workspace/api-zod";
import {
  generateId,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from "../lib/session";
import { sendOtpEmail } from "../lib/email";

const router: IRouter = Router();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /auth/request-otp — يرسل OTP للبريد الإلكتروني
router.post("/auth/request-otp", async (req, res): Promise<void> => {
  const parsed = RequestOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "البريد الإلكتروني غير صالح" });
    return;
  }
  const { email } = parsed.data;

  // Find or create user
  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    const newId = generateId();
    [user] = await db.insert(usersTable).values({ id: newId, email }).returning();
  }

  // Delete any previous OTP codes for this user
  await db.delete(otpCodesTable).where(eq(otpCodesTable.userId, user.id));

  // Generate OTP
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpCodesTable).values({
    id: generateId(),
    userId: user.id,
    code,
    expiresAt,
  });

  // Send email
  try {
    await sendOtpEmail(email, code);
    req.log.info({ email }, "OTP sent");
  } catch (err) {
    req.log.error({ err, email }, "Failed to send OTP email");
    res.status(500).json({ error: "فشل إرسال البريد الإلكتروني، تحقق من عنوان البريد" });
    return;
  }

  res.json({ message: "تم إرسال رمز التحقق", email });
});

// POST /auth/verify-otp — يتحقق من الكود ويُنشئ جلسة
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { email, code } = req.body as { email?: string; code?: string };

  if (!email || !code) {
    res.status(400).json({ error: "البريد الإلكتروني والرمز مطلوبان" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "البريد الإلكتروني غير مسجّل" });
    return;
  }

  const now = new Date();
  const [otpRecord] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.userId, user.id),
        eq(otpCodesTable.code, code.trim()),
        gt(otpCodesTable.expiresAt, now)
      )
    );

  if (!otpRecord) {
    res.status(400).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    return;
  }

  // Delete used OTP
  await db.delete(otpCodesTable).where(eq(otpCodesTable.id, otpRecord.id));

  // Create session
  const sessionId = generateId();
  await db.insert(sessionsTable).values({ id: sessionId, userId: user.id });
  const token = createSessionToken(sessionId);
  setSessionCookie(res, token);

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, email));

  req.log.info({ email }, "OTP verified, session created");
  res.json({
    token,
    userId: user.id,
    email: user.email,
    studentName: student?.name ?? null,
    major: student?.major ?? null,
    gpa: student?.gpa ?? null,
    completedHours: student?.completedHours ?? null,
    level: student?.level ?? null,
    enrollmentYear: student?.enrollmentYear ?? null,
    isAuthenticated: true,
  });
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
