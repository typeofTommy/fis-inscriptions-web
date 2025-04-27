import {NextResponse} from "next/server";
import {eq, or, and, ilike} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {competitors} from "@/drizzle/schemaInscriptions";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const gender = url.searchParams.get("gender");
    if (search.length < 3) {
      return new NextResponse("Recherche trop courte", {status: 400});
    }

    if (gender !== "M" && gender !== "W") {
      return new NextResponse("Genre invalide", {status: 400});
    }

    const where = and(
      or(
        ilike(competitors.lastname, `%${search}%`),
        ilike(competitors.firstname, `%${search}%`)
      ),
      eq(competitors.gender, gender)
    );

    const c = await db.select().from(competitors).where(where);
    if (!c) {
      return new NextResponse("Compétiteurs non trouvés", {status: 404});
    }

    return NextResponse.json(c);
  } catch (error) {
    console.error("Erreur lors de la récupération des compétiteurs:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
