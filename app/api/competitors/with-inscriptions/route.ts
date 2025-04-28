import {NextResponse} from "next/server";
import {eq, and} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  competitors,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gender = url.searchParams.get("gender");
    if (gender !== "M" && gender !== "W") {
      return new NextResponse("Genre invalide", {status: 400});
    }

    const where = and(eq(competitors.gender, gender));

    // On récupère les compétiteurs du genre demandé qui ont au moins une inscription dans inscriptionCompetitors
    const c = await db
      .selectDistinctOn([competitors.competitorid])
      .from(competitors)
      .innerJoin(
        inscriptionCompetitors,
        eq(competitors.competitorid, inscriptionCompetitors.competitorId)
      )
      .where(where)
      .orderBy(competitors.competitorid, competitors.lastname);
    if (!c || c.length === 0) {
      console.warn("Aucun compétiteur trouvé pour le genre:", gender);
      return NextResponse.json([]);
    }

    // On retourne uniquement la liste des compétiteurs
    return NextResponse.json(
      c.map((row: any) => row.competitors).filter((comp: any) => !!comp)
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des compétiteurs:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
