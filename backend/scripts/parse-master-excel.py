#!/usr/bin/env python3
"""
Parse Paula's master Excel sessions tab (NEWEST_MATH_CLIENT_INFO export).

Input format: tab-separated with multi-line quoted cells. Per Paula's Mathitude
Data Structure Notes:

  Col A (Check)            -> ignore
  Col B (PAY_NOTE)         -> Session.rate  ($X.XX or "$ -" for no charge)
  Col C (MS)               -> ignore (legacy "O" marker)
  Col D (Date)             -> Session.date  (M/D/YYYY)
  Col E (Student)          -> Student name (may be multi-line for joint sessions)
  Col F (Grade)            -> Student.grade
  Col G (School)           -> Student.school (coded — WL, MS, PA, etc.)
  Col H (Work Summary)     -> Session.privateNotes (part 1)
  Col I (Strengths)        -> ignore
  Col J (Focus Area)       -> Session.privateNotes (part 2)
  beyond Col J             -> ignore

Outputs a JSON file with parsed records and a summary report.
DOES NOT IMPORT to DynamoDB. That's a separate step requiring user approval.
"""

import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

INPUT = Path(__file__).parent.parent / "data" / "master-sessions.tsv"
OUTPUT_JSON = Path(__file__).parent.parent / "data" / "master-sessions-parsed.json"
OUTPUT_REPORT = Path(__file__).parent.parent / "data" / "master-sessions-report.md"


def parse_rate(s: str) -> int | None:
    """'$ 125.00' -> 12500 cents. '$ -' -> None (cancellation)."""
    s = s.strip()
    if not s or s in {"$ -", "$-", "-"}:
        return None
    m = re.search(r"([\d,]+\.?\d*)", s)
    if not m:
        return None
    return int(round(float(m.group(1).replace(",", "")) * 100))


def parse_date(s: str) -> str | None:
    """'1/3/2023' -> '2023-01-03'."""
    s = s.strip()
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{2,4})$", s)
    if not m:
        return None
    mo, d, y = m.groups()
    if len(y) == 2:
        y = "20" + y if int(y) < 50 else "19" + y
    return f"{int(y):04d}-{int(mo):02d}-{int(d):02d}"


def parse_students(name: str, grade: str) -> list[dict]:
    """Joint sessions appear as 'ADELAIDE\\nHENRY' with grade '2\\nK'."""
    names = [n.strip() for n in name.split("\n") if n.strip()]
    grades = [g.strip() for g in grade.split("\n") if g.strip()]
    if len(names) == len(grades):
        return [{"name": n, "grade": g} for n, g in zip(names, grades)]
    if len(grades) == 1 and len(names) > 1:
        return [{"name": n, "grade": grades[0]} for n in names]
    return [{"name": " / ".join(names), "grade": " / ".join(grades)}]


def main():
    if not INPUT.exists():
        print(f"Input not found: {INPUT}")
        print("Save Paula's Excel paste to that path first.")
        sys.exit(1)

    rows = []
    skipped_header = False
    with INPUT.open() as f:
        reader = csv.reader(f, delimiter="\t", quotechar='"')
        for fields in reader:
            if not skipped_header:
                if fields and "PAY_NOTE" in " ".join(fields).upper():
                    skipped_header = True
                continue

            # Pad to 10 columns to safely index
            fields = (fields + [""] * 10)[:10]
            _check, pay, _ms, date, student, grade, school, work, _strengths, focus = fields

            iso_date = parse_date(date)
            if not iso_date:
                continue

            students = parse_students(student, grade)
            rate_cents = parse_rate(pay)
            cancelled = rate_cents is None

            for stu in students:
                rows.append({
                    "date": iso_date,
                    "studentName": stu["name"].strip(),
                    "grade": stu["grade"].strip(),
                    "school": school.strip(),
                    "rateCents": rate_cents,
                    "status": "cancelled" if cancelled else "completed",
                    "isJoint": len(students) > 1,
                    "groupSize": len(students),
                    "workSummary": work.strip(),
                    "focusArea": focus.strip(),
                })

    # Write the parsed JSON
    OUTPUT_JSON.write_text(json.dumps(rows, indent=2))
    print(f"Wrote {len(rows)} session-rows to {OUTPUT_JSON}")

    # Build the summary report
    distinct_students = Counter()
    for r in rows:
        if r["studentName"]:
            distinct_students[r["studentName"]] += 1

    schools = Counter(r["school"] for r in rows if r["school"])
    grades = Counter(r["grade"] for r in rows if r["grade"])
    rates = Counter(r["rateCents"] for r in rows if r["rateCents"] is not None)
    cancellations = sum(1 for r in rows if r["status"] == "cancelled")
    joints = sum(1 for r in rows if r["isJoint"])
    dates = sorted({r["date"] for r in rows})
    revenue = sum(r["rateCents"] or 0 for r in rows if r["status"] == "completed")

    lines = [
        "# Master Excel sessions — parse report",
        "",
        f"Source: `{INPUT.name}`",
        f"Parsed rows: **{len(rows)}** (one row per student per session — joint sessions are exploded)",
        f"Date range: **{dates[0]} → {dates[-1]}**" if dates else "(no dates)",
        f"Cancellations / no-charge rows: **{cancellations}**",
        f"Joint-session rows: **{joints}**",
        f"Distinct students: **{len(distinct_students)}**",
        f"Total revenue (completed only): **${revenue / 100:,.2f}**",
        "",
        "## Top 30 students by session count",
        "",
        "| Student | Sessions |",
        "|---|---:|",
    ]
    for name, count in distinct_students.most_common(30):
        lines.append(f"| {name} | {count} |")

    lines += [
        "",
        "## Schools (sessions per school code)",
        "",
        "| Code | Sessions |",
        "|---|---:|",
    ]
    for code, count in schools.most_common():
        lines.append(f"| {code or '(blank)'} | {count} |")

    lines += [
        "",
        "## Grades observed",
        "",
        "| Grade | Sessions |",
        "|---|---:|",
    ]
    for g, count in sorted(grades.items()):
        lines.append(f"| {g} | {count} |")

    lines += [
        "",
        "## Rate distribution",
        "",
        "| Rate | Count |",
        "|---|---:|",
    ]
    for cents, count in sorted(rates.items()):
        lines.append(f"| ${cents / 100:,.2f} | {count} |")

    OUTPUT_REPORT.write_text("\n".join(lines) + "\n")
    print(f"Wrote summary to {OUTPUT_REPORT}")


if __name__ == "__main__":
    main()
