import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {
  inscriptions,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";
import {eq, inArray, isNull, and} from "drizzle-orm";

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const competitorId = Number((await params).id);
  if (!competitorId) {
    return NextResponse.json({error: "Missing competitor id"}, {status: 400});
  }

  // 1. Trouver toutes les inscriptions où ce compétiteur est inscrit (non supprimées)
  const links = await db
    .select({
      inscriptionId: inscriptionCompetitors.inscriptionId,
      codexNumber: inscriptionCompetitors.codexNumber,
    })
    .from(inscriptionCompetitors)
    .where(
      and(
        eq(inscriptionCompetitors.competitorId, competitorId),
        isNull(inscriptionCompetitors.deletedAt)
      )
    );

  if (!links.length) return NextResponse.json([]);

  // 2. Grouper par inscriptionId et filtrer les inscriptions non supprimées
  const inscriptionIds = Array.from(new Set(links.map((l) => l.inscriptionId)));
  const inscriptionsData: any[] = await db
    .select()
    .from(inscriptions)
    .where(
      and(
        inArray(inscriptions.id, inscriptionIds),
        isNull(inscriptions.deletedAt)
      )
    );

  // 3. Pour chaque inscription, retrouver les codex où ce compétiteur est inscrit
  const result = inscriptionsData.map((insc) => {
    // eventData.competitions est un tableau d'objets avec un champ codex
    const codexList = (insc.eventData?.competitions || []).filter(
      (c: {codex: string}) =>
        links.some(
          (l) =>
            l.inscriptionId === insc.id && l.codexNumber === String(c.codex)
        )
    );
    return {
      inscriptionId: insc.id,
      eventName: insc.eventData?.name || null,
      eventPlace: insc.eventData?.place || null,
      eventStartDate: insc.eventData?.startDate || null,
      eventEndDate: insc.eventData?.endDate || null,
      codexList,
    };
  });

  return NextResponse.json(result);
}
