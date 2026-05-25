import { Router, type IRouter } from "express";
import { db, studentsTable, scheduleTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

// GET /students/me
router.get("/students/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ error: "المستخدم غير موجود" });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, user.email));
  if (!student) {
    res.status(404).json({ error: "لم يتم العثور على ملف الطالب" });
    return;
  }
  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    major: student.major,
    enrolledSubjects: student.major ? [student.major] : [],
  });
});

// GET /students/schedule
router.get("/students/schedule", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود" });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.email, user.email));
  if (!student) {
    res.json([]);
    return;
  }
  const entries = await db.select().from(scheduleTable).where(eq(scheduleTable.studentId, student.id));
  res.json(entries.map(e => ({
    id: e.id,
    subjectName: e.subjectName,
    subjectCode: e.subjectCode,
    dayOfWeek: e.dayOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
    room: e.room,
    doctorName: e.doctorName,
  })));
});

export default router;
