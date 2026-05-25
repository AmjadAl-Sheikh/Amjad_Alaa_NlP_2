import { db, studentsTable, subjectsTable, doctorsTable, scheduleTable } from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Subjects
  await db.insert(subjectsTable).values([
    { id: "sub1", name: "مقدمة في الذكاء الاصطناعي", code: "CS401", major: "هندسة الحاسوب", level: 4, creditHours: 3, description: "أساسيات الذكاء الاصطناعي وتطبيقاته" },
    { id: "sub2", name: "هياكل البيانات", code: "CS201", major: "هندسة الحاسوب", level: 2, creditHours: 3, description: "المصفوفات والقوائم والأشجار والرسومات" },
    { id: "sub3", name: "قواعد البيانات", code: "CS301", major: "هندسة الحاسوب", level: 3, creditHours: 3, description: "تصميم قواعد البيانات العلائقية وSQL" },
    { id: "sub4", name: "تحليل وتصميم النظم", code: "IS301", major: "نظم المعلومات", level: 3, creditHours: 3, description: "تحليل متطلبات النظم وتصميمها" },
    { id: "sub5", name: "الشبكات الحاسوبية", code: "CS351", major: "هندسة الحاسوب", level: 3, creditHours: 3, description: "بروتوكولات الشبكات ونماذج OSI" },
    { id: "sub6", name: "البرمجة كائنية التوجه", code: "CS202", major: "هندسة الحاسوب", level: 2, creditHours: 3, description: "Java وأساسيات OOP" },
    { id: "sub7", name: "الرياضيات المتقطعة", code: "MATH201", major: "هندسة الحاسوب", level: 2, creditHours: 3, description: "المنطق والمجموعات والرسومات" },
    { id: "sub8", name: "الأمن السيبراني", code: "CS451", major: "هندسة الحاسوب", level: 4, creditHours: 3, description: "أساسيات أمن الشبكات والمعلومات" },
    { id: "sub9", name: "هندسة البرمجيات", code: "CS302", major: "هندسة الحاسوب", level: 3, creditHours: 3, description: "دورة حياة تطوير البرمجيات" },
    { id: "sub10", name: "الإدارة والأعمال", code: "BUS101", major: "إدارة الأعمال", level: 1, creditHours: 3, description: "مبادئ الإدارة الحديثة" },
  ]).onConflictDoNothing();

  // Doctors
  await db.insert(doctorsTable).values([
    { id: "doc1", name: "د. أحمد محمد الخطيب", email: "a.khatib@ppu.edu.ps", subjects: ["CS401", "CS351"], department: "هندسة الحاسوب", officeHours: "الأحد والثلاثاء 10:00-12:00" },
    { id: "doc2", name: "د. سمر علي نصار", email: "s.nassar@ppu.edu.ps", subjects: ["CS201", "CS202"], department: "هندسة الحاسوب", officeHours: "الاثنين والأربعاء 11:00-13:00" },
    { id: "doc3", name: "د. محمود يوسف حمدان", email: "m.hamdan@ppu.edu.ps", subjects: ["CS301", "CS302"], department: "هندسة الحاسوب", officeHours: "الثلاثاء والخميس 9:00-11:00" },
    { id: "doc4", name: "د. رنا إبراهيم عوض", email: "r.awad@ppu.edu.ps", subjects: ["IS301"], department: "نظم المعلومات", officeHours: "الأحد والثلاثاء 13:00-15:00" },
    { id: "doc5", name: "د. خالد عمر شاهين", email: "k.shahin@ppu.edu.ps", subjects: ["MATH201", "CS451"], department: "الرياضيات", officeHours: "الاثنين والأربعاء 8:00-10:00" },
  ]).onConflictDoNothing();

  // Students
  await db.insert(studentsTable).values([
    { id: "stu1", name: "محمد عبد الله الأحمد", email: "student@test.com", major: "هندسة الحاسوب" },
    { id: "stu2", name: "سارة يوسف المصري", email: "sara@test.com", major: "نظم المعلومات" },
  ]).onConflictDoNothing();

  // Schedule for student 1
  await db.insert(scheduleTable).values([
    { id: "sch1", studentId: "stu1", subjectName: "مقدمة في الذكاء الاصطناعي", subjectCode: "CS401", dayOfWeek: "الأحد", startTime: "08:00", endTime: "09:30", room: "B201", doctorName: "د. أحمد محمد الخطيب" },
    { id: "sch2", studentId: "stu1", subjectName: "هياكل البيانات", subjectCode: "CS201", dayOfWeek: "الاثنين", startTime: "10:00", endTime: "11:30", room: "A101", doctorName: "د. سمر علي نصار" },
    { id: "sch3", studentId: "stu1", subjectName: "قواعد البيانات", subjectCode: "CS301", dayOfWeek: "الثلاثاء", startTime: "09:00", endTime: "10:30", room: "C305", doctorName: "د. محمود يوسف حمدان" },
    { id: "sch4", studentId: "stu1", subjectName: "الشبكات الحاسوبية", subjectCode: "CS351", dayOfWeek: "الأربعاء", startTime: "11:00", endTime: "12:30", room: "D102", doctorName: "د. أحمد محمد الخطيب" },
    { id: "sch5", studentId: "stu1", subjectName: "الأمن السيبراني", subjectCode: "CS451", dayOfWeek: "الخميس", startTime: "08:00", endTime: "09:30", room: "B104", doctorName: "د. خالد عمر شاهين" },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
