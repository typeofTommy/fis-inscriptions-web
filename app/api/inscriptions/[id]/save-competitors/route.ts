import {NextRequest, NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptionCompetitors} from "@/drizzle/schemaInscriptions";

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const inscriptionId = Number(id);
  const {competitorIds, codexNumbers} = await req.json();

  if (
    !inscriptionId ||
    !Array.isArray(competitorIds) ||
    !Array.isArray(codexNumbers) ||
    competitorIds.length === 0 ||
    codexNumbers.length === 0
  ) {
    return NextResponse.json({error: "Invalid payload"}, {status: 400});
  }

  // Créer les nouvelles liaisons sans supprimer les anciennes
  const toInsert = [];
  for (const competitorId of competitorIds) {
    for (const codexNumber of codexNumbers) {
      toInsert.push({
        inscriptionId,
        competitorId,
        codexNumber,
      });
    }
  }
  if (toInsert.length > 0) {
    await db
      .insert(inscriptionCompetitors)
      .values(toInsert)
      .onConflictDoNothing();
  }

  return NextResponse.json({success: true});
}
