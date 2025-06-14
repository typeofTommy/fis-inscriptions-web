import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import type {Competition} from "@/app/types";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  const number = searchParams.get("number");
  const excludeId = searchParams.get("excludeId");
  if (!number) {
    return NextResponse.json({error: "Missing codex number"}, {status: 400});
  }

  // Cherche une inscription qui contient ce codex
  const result = await db
    .select({
      id: inscriptions.id,
      eventData: inscriptions.eventData,
    })
    .from(inscriptions);

  for (const row of result) {
    if (excludeId && String(row.id) === String(excludeId)) continue;
    const competitions = (row.eventData as Competition).competitions;
    if (Array.isArray(competitions)) {
      if (competitions.some((c) => String(c.codex) === number)) {
        return NextResponse.json({exists: true, inscriptionId: row.id});
      }
    }
  }

  return NextResponse.json({exists: false});
}
