import {NextRequest, NextResponse} from "next/server";
import {eq, and, inArray} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {fisDB} from "@/app/db/fisDB";
import {inscriptionCompetitors} from "@/drizzle/schemaInscriptions";
import {aCompetitor} from "@/drizzle/schemaFis";

export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
  const inscriptionId = Number(params.id);
  const {searchParams} = new URL(req.url);
  const codexNumber = searchParams.get("codexNumber");

  if (!inscriptionId || !codexNumber) {
    return NextResponse.json({error: "Missing parameters"}, {status: 400});
  }

  // 1. Récupérer les competitorIds liés à cette inscription et ce codex
  const links = await db
    .select({competitorId: inscriptionCompetitors.competitorId})
    .from(inscriptionCompetitors)
    .where(
      and(
        eq(inscriptionCompetitors.inscriptionId, inscriptionId),
        eq(inscriptionCompetitors.codexNumber, codexNumber)
      )
    );
  const competitorIds = links.map((l) => l.competitorId);

  if (competitorIds.length === 0) {
    return NextResponse.json([]);
  }

  // 2. Récupérer les infos des coureurs dans la base FIS
  const competitors = await fisDB
    .select()
    .from(aCompetitor)
    .where(inArray(aCompetitor.competitorid, competitorIds.map(Number)));

  return NextResponse.json(competitors);
}
