import {NextResponse} from "next/server";
import {like, or} from "drizzle-orm";
import {fisDB} from "@/app/db/fisDB";
import {aCompetitor} from "@/drizzle/schemaFis";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";

    if (search.length < 7) {
      return new NextResponse("Recherche trop courte", {status: 400});
    }

    const competitors = await fisDB
      .select()
      .from(aCompetitor)
      .where(
        or(
          like(aCompetitor.lastname, `%${search}%`),
          like(aCompetitor.firstname, `%${search}%`)
        )
      );
    if (!competitors) {
      return new NextResponse("Inscription non trouvée", {status: 404});
    }

    return NextResponse.json(competitors);
  } catch (error) {
    console.error("Erreur lors de la récupération des compétiteurs:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
