import { Router, type IRouter } from "express";
import { db, chatMessagesTable, studentsTable, usersTable, subjectsTable, scheduleTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SendMessageBody, GetChatHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth, generateId } from "../lib/session";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY غير مضبوط");
  return new GoogleGenerativeAI(key);
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const student = user ? (await db.select().from(studentsTable).where(eq(studentsTable.email, user.email)))[0] : null;
  const subjects = await db.select().from(subjectsTable).limit(20);
  const schedule = student ? await db.select().from(scheduleTable).where(eq(scheduleTable.studentId, student.id)) : [];

  const studentInfo = student
    ? `اسم الطالب: ${student.name}\nالتخصص: ${student.major}\nالبريد: ${user?.email}`
    : `المستخدم: ${user?.email} (لا يوجد ملف طالب مرتبط)`;

  const subjectsList = subjects.map(s => `${s.name} (${s.code}) - المستوى ${s.level}`).join("\n");
  const scheduleList = schedule.length
    ? schedule.map(s => `${s.subjectName} - ${s.dayOfWeek} ${s.startTime}-${s.endTime} قاعة ${s.room}`).join("\n")
    : "لا توجد جداول مسجلة";

  return `أنت المساعد الذكي الأكاديمي لجامعة بوليتكنك فلسطين (PPU).
أجب دائماً باللغة العربية بشكل واضح ومختصر ومفيد.
لا تستخدم الإيموجي أبداً.

معلومات الطالب الحالي:
${studentInfo}

المواد المتاحة في الجامعة:
${subjectsList}

جدول الطالب:
${scheduleList}

إرشادات:
- أجب على أسئلة الجدول والمواد والتسجيل والأمور الأكاديمية
- كن دقيقاً وموجزاً في إجاباتك
- إذا لم تعرف إجابة معينة، أخبر الطالب بالتواصل مع الإدارة
- لا تخترع معلومات غير موجودة في البيانات المتاحة لك`;
}

// GET /chat/messages
router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const params = GetChatHistoryQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 50) : 50;

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId!))
    .orderBy(asc(chatMessagesTable.createdAt))
    .limit(limit);

  res.json(messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })));
});

// POST /chat/messages
router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "الرسالة فارغة" });
    return;
  }
  const { message } = parsed.data;

  // Save user message
  const userMsgId = generateId();
  await db.insert(chatMessagesTable).values({
    id: userMsgId,
    userId: req.userId!,
    role: "user",
    content: message,
  });

  // Get recent history for context
  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId!))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(20);

  const historyForGemini = history
    .reverse()
    .slice(0, -1) // exclude the just-inserted user message
    .map(m => ({
      role: m.role === "user" ? "user" as const : "model" as const,
      parts: [{ text: m.content }],
    }));

  let aiContent = "";
  try {
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemPrompt = await buildSystemPrompt(req.userId!);
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "مرحباً، أنا المساعد الذكي لجامعة بوليتكنك فلسطين. كيف يمكنني مساعدتك؟" }] },
        ...historyForGemini,
      ],
    });
    const result = await chat.sendMessage(message);
    aiContent = result.response.text();
  } catch (err) {
    logger.error({ err }, "Gemini API error");
    aiContent = "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }

  // Save AI response
  const aiMsgId = generateId();
  const [saved] = await db.insert(chatMessagesTable).values({
    id: aiMsgId,
    userId: req.userId!,
    role: "assistant",
    content: aiContent,
  }).returning();

  res.json({
    id: saved.id,
    role: saved.role,
    content: saved.content,
    createdAt: saved.createdAt.toISOString(),
  });
});

// DELETE /chat/messages/clear
router.delete("/chat/messages/clear", requireAuth, async (req, res): Promise<void> => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId!));
  res.json({ success: true, message: "تم مسح سجل المحادثة" });
});

export default router;
