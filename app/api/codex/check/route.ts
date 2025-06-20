import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {isNull} from "drizzle-orm";
import type {Competition} from "@/app/types";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const {searchParams} = new URL(req.url);
  const number = searchParams.get("number");
  const excludeId = searchParams.get("excludeId");
  const seasonCode = searchParams.get("seasonCode"); // Nouveau paramètre pour différencier les saisons
  if (!number) {
    return NextResponse.json({error: "Missing codex number"}, {status: 400});
  }

  // Cherche une inscription qui contient ce codex (excluant les soft-deleted)
  const result = await db
    .select({
      id: inscriptions.id,
      eventData: inscriptions.eventData,
    })
    .from(inscriptions)
    .where(isNull(inscriptions.deletedAt));

  for (const row of result) {
    if (excludeId && String(row.id) === String(excludeId)) continue;
    const competitions = (row.eventData as Competition).competitions;
    if (Array.isArray(competitions)) {
      const matchingCompetition = competitions.find((c) => {
        const codexMatch = String(c.codex) === number;
        
        // Si aucun seasonCode n'est fourni, ne pas considérer comme un doublon
        // (cela permet aux anciens codex d'être réutilisés)
        if (!seasonCode) {
          return false;
        }
        
        // Si un seasonCode est fourni, vérifier que les deux correspondent
        return codexMatch && String(c.seasonCode) === seasonCode;
      });
      
      if (matchingCompetition) {
        return NextResponse.json({
          exists: true, 
          inscriptionId: row.id,
          competition: matchingCompetition
        });
      }
    }
  }

  return NextResponse.json({exists: false});
}
