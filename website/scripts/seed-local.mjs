// Seed a small, realistic slice of data into the local dynalite tables so the
// admin portal isn't empty on first load. Idempotent-ish (uses fixed ids).
//
//   node scripts/seed-local.mjs
//
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "mathitude-staging";
const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION || "us-west-2",
    endpoint: process.env.AWS_ENDPOINT_URL_DYNAMODB || "http://localhost:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  }),
  { marshallOptions: { removeUndefinedValues: true } },
);
const T = (n) => `${PREFIX}-${n}`;
const put = (table, Item) => ddb.send(new PutCommand({ TableName: T(table), Item }));
const now = "2026-06-07T16:00:00.000Z";

const tutor = { id: "tut_paula", firstName: "Paula", lastName: "Stardrop", email: "paula@mathitude.com", role: "master_admin", createdAt: now };

const families = [
  { id: "fam_chen", name: "Chen Family", primaryPayerParentId: "par_chen", createdAt: now },
  { id: "fam_okafor", name: "Okafor Family", primaryPayerParentId: "par_okafor", createdAt: now },
];
const parents = [
  { id: "par_chen", familyId: "fam_chen", firstName: "Mei", lastName: "Chen", email: "mei.chen@example.com", phone: "415-555-0142", isPrimaryPayer: true, createdAt: now },
  { id: "par_okafor", familyId: "fam_okafor", firstName: "Ada", lastName: "Okafor", email: "ada.okafor@example.com", phone: "510-555-0199", isPrimaryPayer: true, createdAt: now },
];
const students = [
  { id: "stu_lily_chen", firstName: "Lily", lastName: "Chen", grade: "5", school: "Willard", status: "active", familyId: "fam_chen", parentName: "Mei Chen", parentEmail: "mei.chen@example.com", sessionType: "individual", rate: 80, createdAt: now },
  { id: "stu_sam_okafor", firstName: "Sam", lastName: "Okafor", grade: "8", school: "MLK Middle", status: "active", familyId: "fam_okafor", parentName: "Ada Okafor", parentEmail: "ada.okafor@example.com", sessionType: "individual", rate: 90, createdAt: now },
  { id: "stu_noah_okafor", firstName: "Noah", lastName: "Okafor", grade: "3", school: "Emerson", status: "waitlist", familyId: "fam_okafor", parentName: "Ada Okafor", parentEmail: "ada.okafor@example.com", sessionType: "group", rate: 60, createdAt: now },
];
const sessions = [
  { studentId: "stu_lily_chen", dateTime: "2026-06-09T23:00:00.000Z", date: "2026-06-09", time: "16:00", tutorId: "tut_paula", status: "scheduled", durationMin: 60, rate: 80, students: ["stu_lily_chen"], createdAt: now },
  { studentId: "stu_sam_okafor", dateTime: "2026-06-10T22:00:00.000Z", date: "2026-06-10", time: "15:00", tutorId: "tut_paula", status: "scheduled", durationMin: 60, rate: 90, students: ["stu_sam_okafor"], createdAt: now },
  { studentId: "stu_lily_chen", dateTime: "2026-06-02T23:00:00.000Z", date: "2026-06-02", time: "16:00", tutorId: "tut_paula", status: "completed", durationMin: 60, rate: 80, students: ["stu_lily_chen"], privateNotes: "Fractions review — strong progress on equivalent fractions.", createdAt: now },
];
const payments = [
  { studentId: "stu_lily_chen", createdAt: "2026-06-03T10:00:00.000Z", amount: 80, paymentStatus: "paid", method: "card", description: "Session 6/2", id: "pay_1" },
  { studentId: "stu_sam_okafor", createdAt: "2026-06-01T10:00:00.000Z", amount: 360, paymentStatus: "pending", method: "invoice", description: "June package (4 sessions)", id: "pay_2" },
];
const events = [
  { id: "evt_summer_camp", date: "2026-07-15", type: "camp", title: "Summer Math Camp", description: "Two-week enrichment camp, grades 3-6.", capacity: 24, createdAt: now },
];
const bookings = [
  { id: "bk_1", createdAt: now, status: "new", name: "Jordan Rivera", email: "jordan@example.com", phone: "650-555-0123", message: "Looking for Algebra 1 help for my 9th grader.", grade: "9" },
];

await Promise.all([
  put("tutors", tutor),
  ...families.map((f) => put("families", f)),
  ...parents.map((p) => put("parents", p)),
  ...students.map((s) => put("students", s)),
  ...sessions.map((s) => put("sessions", s)),
  ...payments.map((p) => put("payments", p)),
  ...events.map((e) => put("events", e)),
  ...bookings.map((b) => put("bookings", b)),
]);

console.log("Seeded: 1 tutor, 2 families, 2 parents, 3 students, 3 sessions, 2 payments, 1 event, 1 booking.");
