import { Router, type IRouter } from "express";
import { db, subjectsTable, doctorsTable, studentsTable, chatMessagesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const [subjectCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subjectsTable);
  const [doctorCount] = await db.select({ count: sql<number>`count(*)::int` }).from(doctorsTable);
  const [studentCount] = await db.select({ count: sql<number>`count(*)::int` }).from(studentsTable);
  const [msgCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId!));

  // Recent activity: last 5 chat messages
  const recentMsgs = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.userId, req.userId!))
    .orderBy(sql`created_at DESC`)
    .limit(5);

  res.json({
    totalSubjects: subjectCount?.count ?? 0,
    totalDoctors: doctorCount?.count ?? 0,
    totalStudents: studentCount?.count ?? 0,
    totalChatMessages: msgCount?.count ?? 0,
    recentActivity: recentMsgs.map(m => ({
      id: m.id,
      description: m.role === "user" ? `سؤالك: ${m.content.slice(0, 60)}...` : `رد المساعد: ${m.content.slice(0, 60)}...`,
      timestamp: m.createdAt.toISOString(),
    })),
  });
});

export default router;
