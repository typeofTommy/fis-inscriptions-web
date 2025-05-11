import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {
  inscriptions,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";
import {eq, inArray} from "drizzle-orm";
import type {InferSelectModel} from "drizzle-orm";
import {stations as stationsTable} from "@/drizzle/schemaInscriptions";

// Types
import type {inscriptions as inscriptionsTable} from "@/drizzle/schemaInscriptions";
type Inscription = InferSelectModel<typeof inscriptionsTable>;
type Station = InferSelectModel<typeof stationsTable>;

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
  const inscriptionsData: Inscription[] = await db
    .select()
    .from(inscriptions)
    .where(inArray(inscriptions.id, inscriptionIds));

  // Récupérer tous les ids de station utilisés
  const stationIds = Array.from(
    new Set(
      inscriptionsData
        .map((insc) => insc.location)
        .filter((id): id is number => typeof id === "number" && !isNaN(id))
    )
  );
  let stationsMap: Record<number, string> = {};
  if (stationIds.length > 0) {
    const stationsData: Station[] = await db
      .select()
      .from(stationsTable)
      .where(inArray(stationsTable.id, stationIds));
    stationsMap = Object.fromEntries(stationsData.map((s) => [s.id, s.name]));
  }

  // 3. Pour chaque inscription, retrouver les codex où ce compétiteur est inscrit
  const result = inscriptionsData.map((insc) => {
    const codexList = (insc.codexData || []).filter((c: {number: string}) =>
      links.some(
        (l) => l.inscriptionId === insc.id && l.codexNumber === c.number
      )
    );
    return {
      inscriptionId: insc.id,
      eventName: insc.fullName || null,
      location: insc.location ? stationsMap[insc.location] || null : null,
      firstRaceDate: insc.firstRaceDate || null,
      codexList,
    };
  });

  return NextResponse.json(result);
}
