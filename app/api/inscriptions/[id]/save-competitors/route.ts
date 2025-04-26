import {NextRequest, NextResponse} from "next/server";
import {eq, inArray, and} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptionCompetitors} from "@/drizzle/schemaInscriptions";

export async function POST(req: NextRequest, {params}: {params: {id: string}}) {
  const inscriptionId = Number(params.id);
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

  // Supprimer les anciennes liaisons pour ces codex/inscription
  await db
    .delete(inscriptionCompetitors)
    .where(
      and(
        eq(inscriptionCompetitors.inscriptionId, inscriptionId),
        inArray(inscriptionCompetitors.codexNumber, codexNumbers)
      )
    );

  // Créer les nouvelles liaisons
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
    await db.insert(inscriptionCompetitors).values(toInsert);
  }

  return NextResponse.json({success: true});
}
