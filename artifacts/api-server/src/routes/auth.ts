import { Router, type IRouter } from "express";
import { db, usersTable, otpCodesTable, sessionsTable, studentsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  RequestOtpBody,
  VerifyOtpBody,
} from "@workspace/api-zod";
import { sendOtpEmail } from "../lib/email";
import {
  generateId,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
} from "../lib/session";

const router: IRouter = Router();

// POST /auth/request-otp
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

  // Delete old OTPs for this user
  await db.delete(otpCodesTable).where(eq(otpCodesTable.userId, user.id));

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpCodesTable).values({
    id: generateId(),
    userId: user.id,
    code,
    expiresAt,
  });

  try {
    await sendOtpEmail(email, code);
  } catch {
    res.status(500).json({ error: "فشل إرسال البريد الإلكتروني. تحقق من إعدادات البريد." });
    return;
  }

  req.log.info({ email }, "OTP sent");
  res.json({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني", expiresInSeconds: 600 });
});

// POST /auth/verify-otp
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "البيانات غير صالحة" });
    return;
  }
  const { email, code } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(400).json({ error: "البريد الإلكتروني غير مسجل" });
    return;
  }

  const now = new Date();
  const [otp] = await db
    .select()
    .from(otpCodesTable)
    .where(
      and(
        eq(otpCodesTable.userId, user.id),
        eq(otpCodesTable.code, code),
        gt(otpCodesTable.expiresAt, now)
      )
    );

  if (!otp) {
    res.status(400).json({ error: "الرمز غير صحيح أو منتهي الصلاحية" });
    return;
  }

  // Delete used OTP
  await db.delete(otpCodesTable).where(eq(otpCodesTable.id, otp.id));

  // Create session
  const sessionId = generateId();
  await db.insert(sessionsTable).values({ id: sessionId, userId: user.id });
  const token = createSessionToken(sessionId);
  setSessionCookie(res, token);

  // Get student info if exists
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, email));

  req.log.info({ email }, "OTP verified, session created");
  res.json({
    userId: user.id,
    email: user.email,
    studentName: student?.name ?? null,
    major: student?.major ?? null,
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
    isAuthenticated: true,
  });
});

export default router;
