import { AcademicCalendar } from "@/components/calendar/academic-calendar";
import { ACADEMIC_YEAR } from "@/lib/academic-calendar";

export default function AdminAcademicCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Academic Calendar
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Mathitude&apos;s own {ACADEMIC_YEAR.label} academic year — term
          start/end, holiday closures, and the summer schedule. This is the
          same calendar families see at{" "}
          <span className="font-mono text-neutral-600">/calendar</span>.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
        <AcademicCalendar />
      </div>
    </div>
  );
}
