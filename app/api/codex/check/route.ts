import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  const number = searchParams.get("number");
  if (!number) {
    return NextResponse.json({error: "Missing codex number"}, {status: 400});
  }

  // Cherche une inscription qui contient ce codex
  const result = await db
    .select({id: inscriptions.id, codexData: inscriptions.codexData})
    .from(inscriptions);

  for (const row of result) {
    if (Array.isArray(row.codexData)) {
      if (row.codexData.some((c: any) => c.number === number)) {
        return NextResponse.json({exists: true, inscriptionId: row.id});
      }
    }
  }

  return NextResponse.json({exists: false});
}
