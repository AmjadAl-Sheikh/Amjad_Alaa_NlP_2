import { pgTable, text, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  major: text("major").notNull(),
  gpa: real("gpa"),
  completedHours: integer("completed_hours"),
  level: integer("level"),
  enrollmentYear: integer("enrollment_year"),
});

export const insertStudentSchema = createInsertSchema(studentsTable);
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
