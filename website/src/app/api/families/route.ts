import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, Tables, requireUser } from "@/lib/server/ddb";

interface FamilyRow {
  id: string;
  primaryPayerId?: string;
  address?: { street?: string; city?: string; state?: string; zip?: string };
  notes?: string;
}
interface ParentRow {
  id: string;
  familyId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}
interface StudentRow {
  id: string;
  familyId: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  status?: string;
}

export async function GET() {
  const auth = await requireUser();
  if (auth.response) return auth.response;

  try {
    const [famRes, parRes, stuRes] = await Promise.all([
      ddb().send(new ScanCommand({ TableName: Tables.families })),
      ddb().send(new ScanCommand({ TableName: Tables.parents })),
      ddb().send(new ScanCommand({ TableName: Tables.students })),
    ]);

    const parents = (parRes.Items || []) as ParentRow[];
    const students = (stuRes.Items || []) as StudentRow[];

    const families = ((famRes.Items || []) as FamilyRow[]).map((f) => {
      const fParents = parents.filter((p) => p.familyId === f.id);
      const fStudents = students.filter((s) => s.familyId === f.id);
      const primary =
        fParents.find((p) => p.id === f.primaryPayerId) || fParents[0];
      return { ...f, parents: fParents, students: fStudents, primary };
    });

    families.sort((a, b) => {
      const an = (a.primary?.lastName || a.primary?.firstName || a.id).toLowerCase();
      const bn = (b.primary?.lastName || b.primary?.firstName || b.id).toLowerCase();
      return an.localeCompare(bn);
    });

    return Response.json({ families });
  } catch (err) {
    console.error("[GET /api/families] failed:", err);
    return Response.json(
      { error: "Scan failed", detail: String(err), table: Tables.families },
      { status: 500 },
    );
  }
}
