import {NextResponse} from "next/server";
import {eq, and, isNull} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {Competitor} from "@/app/types";

export async function GET(request: Request) {
  try {
    const { competitors, inscriptionCompetitors, inscriptions } = getDbTables();
    const url = new URL(request.url);
    const gender = url.searchParams.get("gender");
    if (gender !== "M" && gender !== "W") {
      return new NextResponse("Genre invalide", {status: 400});
    }

    const where = and(
      eq(competitors.gender, gender),
      isNull(inscriptionCompetitors.deletedAt),
      isNull(inscriptions.deletedAt)
    );

    // On récupère les compétiteurs du genre demandé qui ont au moins une inscription dans inscriptionCompetitors (non supprimées) et dont l'inscription n'est pas supprimée
    const c: {competitors: Competitor}[] = await db
      .selectDistinctOn([competitors.competitorid])
      .from(competitors)
      .innerJoin(
        inscriptionCompetitors,
        eq(competitors.competitorid, inscriptionCompetitors.competitorId)
      )
      .innerJoin(
        inscriptions,
        eq(inscriptionCompetitors.inscriptionId, inscriptions.id)
      )
      .where(where)
      .orderBy(competitors.competitorid, competitors.lastname);
    if (!c || c.length === 0) {
      console.warn("Aucun compétiteur trouvé pour le genre:", gender);
      return NextResponse.json([]);
    }

    // On retourne uniquement la liste des compétiteurs
    return NextResponse.json(
      c.map((row) => row.competitors).filter((comp) => !!comp)
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des compétiteurs:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
