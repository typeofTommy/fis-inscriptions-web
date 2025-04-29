import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

// Define the codex data type
interface CodexEntry {
  number: string;
  [key: string]: unknown;
}

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  const number = searchParams.get("number");
  const excludeId = searchParams.get("excludeId");
  if (!number) {
    return NextResponse.json({error: "Missing codex number"}, {status: 400});
  }

  // Cherche une inscription qui contient ce codex
  const result = await db
    .select({id: inscriptions.id, codexData: inscriptions.codexData})
    .from(inscriptions);

  for (const row of result) {
    if (excludeId && String(row.id) === String(excludeId)) continue;
    if (Array.isArray(row.codexData)) {
      if (row.codexData.some((c: CodexEntry) => c.number === number)) {
        return NextResponse.json({exists: true, inscriptionId: row.id});
      }
    }
  }

  return NextResponse.json({exists: false});
}
