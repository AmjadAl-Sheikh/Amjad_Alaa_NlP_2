import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const doctorsTable = pgTable("doctors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  subjects: text("subjects").array().notNull().default([]),
  department: text("department"),
  officeHours: text("office_hours"),
});

export const insertDoctorSchema = createInsertSchema(doctorsTable);
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctorsTable.$inferSelect;
