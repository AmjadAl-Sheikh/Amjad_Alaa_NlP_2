import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  major: text("major").notNull(),
  level: integer("level").notNull(),
  creditHours: integer("credit_hours").notNull(),
  description: text("description"),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable);
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
