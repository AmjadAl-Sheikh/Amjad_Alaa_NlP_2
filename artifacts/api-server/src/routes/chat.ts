import { Router, type IRouter } from "express";
import { db, chatMessagesTable, studentsTable, usersTable, subjectsTable, scheduleTable } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GetChatHistoryQueryParams } from "@workspace/api-zod";
import { requireAuth, generateId } from "../lib/session";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function getGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY غير مضبوط");
  return new GoogleGenerativeAI(key);
}

const PPU_KNOWLEDGE = `
معلومات جامعة بوليتكنك فلسطين (PPU):
- الموقع: الخليل، فلسطين
- التأسيس: 1978 باسم كلية بوليتكنك فلسطين، ثم أصبحت جامعة في 2007
- الرئيس الحالي: أ.د. عمر الهارون
- تقدم الجامعة برامج بكالوريوس وماجستير في التخصصات التقنية والهندسية

الكليات والتخصصات:
1. كلية هندسة تكنولوجيا المعلومات: هندسة الحاسوب، نظم المعلومات، أمن المعلومات، هندسة الاتصالات
2. كلية الهندسة والتكنولوجيا: هندسة مدنية، هندسة كهربائية، هندسة ميكانيكية، هندسة معمارية
3. كلية العلوم التطبيقية: رياضيات تطبيقية، كيمياء تطبيقية، فيزياء تطبيقية
4. كلية إدارة الأعمال: محاسبة، إدارة أعمال، تسويق، مالية ومصرفية
5. كلية العلوم الطبية التطبيقية: صيدلة، تمريض، أشعة، مختبرات طبية
6. كلية الدراسات العليا

الخدمات الطلابية:
- نظام التسجيل الإلكتروني: https://students.ppu.edu.ps
- البريد الجامعي: @ppu.edu.ps
- المكتبة الرقمية والمكتبة الرئيسية
- ملاعب رياضية ومرافق طلابية
- خدمات الإرشاد الأكاديمي
- مكتب شؤون الطلاب
- مكتب التوظيف والتدريب
- النادي الثقافي والأندية الطلابية

القبول والتسجيل:
- يبدأ التسجيل في مطلع كل فصل دراسي
- الفصل الأول: سبتمبر/أكتوبر | الفصل الثاني: يناير/فبراير | فصل صيفي: يونيو/يوليو
- يتطلب القبول: ثانوية عامة بنسبة لا تقل عن 65% (تختلف حسب التخصص)
- رسوم التسجيل تبدأ من 1500 شيكل للساعة المعتمدة (قابلة للتغيير)

الاعتمادات: معتمدة من وزارة التعليم العالي الفلسطينية، عضو في اتحاد الجامعات العربية

روابط رسمية مهمة (استخدمها في ردودك عند الحاجة):
- الموقع الرسمي: https://www.ppu.edu.ps
- البوابة الطلابية (تسجيل المواد، الدرجات، الجدول): https://students.ppu.edu.ps
- صفحة القبول والتسجيل: https://www.ppu.edu.ps/ar/admission
- صفحة الكليات والتخصصات: https://www.ppu.edu.ps/ar/colleges
- التقويم الأكاديمي: https://www.ppu.edu.ps/ar/academic-calendar
- مكتبة PPU الرقمية: https://library.ppu.edu.ps
- الأندية الطلابية: https://www.ppu.edu.ps/ar/student-clubs
- التواصل مع مكتب القبول: admissions@ppu.edu.ps | هاتف: 02-2233050
- عنوان الجامعة: وادي الهرية، الخليل، فلسطين
`;

async function buildSystemPrompt(userId: string): Promise<string> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const student = user
    ? (await db.select().from(studentsTable).where(eq(studentsTable.email, user.email)))[0]
    : null;
  const subjects = await db.select().from(subjectsTable).limit(30);
  const schedule = student
    ? await db.select().from(scheduleTable).where(eq(scheduleTable.studentId, student.id))
    : [];

  const studentInfo = student
    ? `اسم الطالب: ${student.name}\nالتخصص: ${student.major}\nالبريد: ${user?.email}`
    : `المستخدم: ${user?.email}`;

  const subjectsList = subjects
    .map((s) => `${s.name} (${s.code}) - ${s.major} - المستوى ${s.level} - ${s.creditHours} ساعات`)
    .join("\n");

  const scheduleList = schedule.length
    ? schedule
        .map((s) => `${s.subjectName} (${s.subjectCode}) | ${s.dayOfWeek} ${s.startTime}-${s.endTime} | قاعة ${s.room} | د.${s.doctorName}`)
        .join("\n")
    : "لا توجد محاضرات مسجلة";

  return `أنت المساعد الذكي الأكاديمي لجامعة بوليتكنك فلسطين (PPU Smart Assistant).
أجب دائماً باللغة العربية بشكل واضح ومفيد ودقيق.

${PPU_KNOWLEDGE}

معلومات المستخدم الحالي:
${studentInfo}

المواد المتاحة في النظام:
${subjectsList}

جدول المحاضرات:
${scheduleList}

قواعد المساعد:
- أجب على أي سؤال يتعلق بالجامعة: القبول، التسجيل، التخصصات، الجداول، المواد، الأساتذة
- إذا أرسل المستخدم صورة، حللها بدقة وأجب عليها
- اشرح بأسلوب سهل وواضح
- إذا سألك عن شيء خارج نطاقك، وجّهه لمكتب الإرشاد أو الموقع الرسمي
- لا تخترع معلومات، وكن صادقاً إذا لم تعرف الإجابة

تعليمات التنسيق المهمة جداً:
- لا تستخدم أبداً النجوم ** أو * للتنسيق
- لا تستخدم العناوين بعلامة # أو ##
- لا تستخدم الشرطات - للقوائم
- اكتب الإجابة كتقرير نثري مقروء بفقرات طبيعية
- إذا كان هناك قائمة، اكتبها بالأرقام العربية: 1. 2. 3. أو ضمها في جمل متصلة
- الأسلوب: تقرير مختصر واضح مباشر بدون زخرفة

تعليمات المصادر والروابط:
- عند الإجابة عن أي موضوع يتعلق بالجامعة، أضف رابطاً ذا صلة من الروابط المتوفرة في قاعدة معرفتك
- اذكر الرابط مباشرة في نص الرد كـ URL كامل (https://...) بدون markdown
- مثال: "يمكنك التسجيل عبر البوابة الطلابية: https://students.ppu.edu.ps"
- إذا لم يكن هناك رابط مناسب، لا تخترع روابط وأشر للموقع الرسمي https://www.ppu.edu.ps`;
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

  res.json(
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      imageUrl: (m as Record<string, unknown>).imageUrl ?? null,
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

// POST /chat/messages
router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { message, imageBase64, mimeType } = req.body as {
    message?: string;
    imageBase64?: string;
    mimeType?: string;
  };

  if (!message?.trim() && !imageBase64) {
    res.status(400).json({ error: "الرسالة فارغة" });
    return;
  }

  const userContent = message?.trim() || (imageBase64 ? "صورة" : "");

  await db.insert(chatMessagesTable).values({
    id: generateId(),
    userId: req.userId!,
    role: "user",
    content: userContent,
  });

  const history = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId!))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(20);

  const historyForGemini = history
    .reverse()
    .slice(0, -1)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));

  let aiContent = "";
  try {
    const genAI = getGemini();
    const systemPrompt = await buildSystemPrompt(req.userId!);

    if (imageBase64 && mimeType) {
      // Use vision model for images
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const imagePart = {
        inlineData: { data: imageBase64, mimeType: mimeType as string },
      };
      const textPart = { text: `${systemPrompt}\n\n${userContent || "حلل هذه الصورة وأجب عليها"}` };
      const result = await model.generateContent([textPart, imagePart]);
      aiContent = result.response.text();
    } else {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          {
            role: "model",
            parts: [{ text: "مرحباً! أنا المساعد الذكي لجامعة بوليتكنك فلسطين. كيف أساعدك؟" }],
          },
          ...historyForGemini,
        ],
      });
      const result = await chat.sendMessage(userContent);
      aiContent = result.response.text();
    }
  } catch (err) {
    logger.error({ err }, "Gemini API error");
    aiContent = "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.";
  }

  const [saved] = await db
    .insert(chatMessagesTable)
    .values({ id: generateId(), userId: req.userId!, role: "assistant", content: aiContent })
    .returning();

  res.json({
    id: saved.id,
    role: saved.role,
    content: saved.content,
    imageUrl: null,
    createdAt: saved.createdAt.toISOString(),
  });
});

// DELETE /chat/messages/clear
router.delete("/chat/messages/clear", requireAuth, async (req, res): Promise<void> => {
  await db.delete(chatMessagesTable).where(eq(chatMessagesTable.userId, req.userId!));
  res.json({ success: true, message: "تم مسح سجل المحادثة" });
});

export default router;
