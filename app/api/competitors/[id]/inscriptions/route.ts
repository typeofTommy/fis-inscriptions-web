import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {
  inscriptions,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";
import {eq, inArray} from "drizzle-orm";

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const competitorId = Number((await params).id);
  if (!competitorId) {
    return NextResponse.json({error: "Missing competitor id"}, {status: 400});
  }

  // 1. Trouver toutes les inscriptions où ce compétiteur est inscrit
  const links = await db
    .select({
      inscriptionId: inscriptionCompetitors.inscriptionId,
      codexNumber: inscriptionCompetitors.codexNumber,
    })
    .from(inscriptionCompetitors)
    .where(eq(inscriptionCompetitors.competitorId, competitorId));

  if (!links.length) return NextResponse.json([]);

  // 2. Grouper par inscriptionId
  const inscriptionIds = Array.from(new Set(links.map((l) => l.inscriptionId)));
  const inscriptionsData = await db
    .select()
    .from(inscriptions)
    .where(inArray(inscriptions.id, inscriptionIds));

  // 3. Pour chaque inscription, retrouver les codex où ce compétiteur est inscrit
  const result = inscriptionsData.map((insc) => {
    const codexList = (insc.codexData || []).filter((c: any) =>
      links.some(
        (l) => l.inscriptionId === insc.id && l.codexNumber === c.number
      )
    );
    return {
      inscriptionId: insc.id,
      eventName: insc.fullName || null,
      location: insc.location || null,
      firstRaceDate: insc.firstRaceDate || null,
      codexList,
    };
  });

  return NextResponse.json(result);
}
