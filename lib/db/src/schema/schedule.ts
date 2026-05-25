import { pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduleTable = pgTable("schedule", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  subjectName: text("subject_name").notNull(),
  subjectCode: text("subject_code").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  room: text("room").notNull().default(""),
  doctorName: text("doctor_name").notNull().default(""),
});

export const insertScheduleSchema = createInsertSchema(scheduleTable);
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof scheduleTable.$inferSelect;
