import {NextResponse} from "next/server";
import {like, or} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {competitors} from "@/drizzle/schemaInscriptions";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";

    // if (search.length < 1) {
    //   return new NextResponse("Recherche trop courte", {status: 400});
    // }

    const c = await db
      .select()
      .from(competitors)
      .where(
        or(
          like(competitors.lastname, `%${search}%`),
          like(competitors.firstname, `%${search}%`)
        )
      );
    if (!c) {
      return new NextResponse("Compétiteurs non trouvés", {status: 404});
    }

    return NextResponse.json(c);
  } catch (error) {
    console.error("Erreur lors de la récupération des compétiteurs:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
