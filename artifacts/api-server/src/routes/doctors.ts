import { Router, type IRouter } from "express";
import { db, doctorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

// GET /doctors
router.get("/doctors", requireAuth, async (req, res): Promise<void> => {
  const subject = req.query.subject as string | undefined;
  const rows = await db.select().from(doctorsTable);
  const filtered = subject
    ? rows.filter(d => d.subjects.includes(subject))
    : rows;

  res.json(filtered.map(d => ({
    id: d.id,
    name: d.name,
    email: d.email ?? null,
    subjects: d.subjects,
    department: d.department ?? null,
    officeHours: d.officeHours ?? null,
  })));
});

// GET /doctors/:id
router.get("/doctors/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [doctor] = await db.select().from(doctorsTable).where(eq(doctorsTable.id, raw));
  if (!doctor) {
    res.status(404).json({ error: "الدكتور غير موجود" });
    return;
  }
  res.json({
    id: doctor.id,
    name: doctor.name,
    email: doctor.email ?? null,
    subjects: doctor.subjects,
    department: doctor.department ?? null,
    officeHours: doctor.officeHours ?? null,
  });
});

export default router;
