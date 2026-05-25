import { Router, type IRouter } from "express";
import { db, subjectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListSubjectsQueryParams, GetSubjectParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

// GET /subjects
router.get("/subjects", requireAuth, async (req, res): Promise<void> => {
  const params = ListSubjectsQueryParams.safeParse(req.query);
  let query = db.select().from(subjectsTable);

  const rows = await db.select().from(subjectsTable);
  const filtered = rows.filter(s => {
    if (params.success && params.data.major && s.major !== params.data.major) return false;
    if (params.success && params.data.level && s.level !== params.data.level) return false;
    return true;
  });

  res.json(filtered.map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    major: s.major,
    level: s.level,
    creditHours: s.creditHours,
    description: s.description ?? null,
  })));
});

// GET /subjects/:id
router.get("/subjects/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, raw));
  if (!subject) {
    res.status(404).json({ error: "المادة غير موجودة" });
    return;
  }
  res.json({
    id: subject.id,
    name: subject.name,
    code: subject.code,
    major: subject.major,
    level: subject.level,
    creditHours: subject.creditHours,
    description: subject.description ?? null,
  });
});

export default router;
