import {NextResponse} from "next/server";
import {eq, or, and, ilike} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {getUserOrganizationCode} from "@/app/lib/getUserOrganization";

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

    const { competitors, organizations } = getDbTables();

    // Get organization config dynamically based on user
    const organizationCode = await getUserOrganizationCode();
    const org = await db.select().from(organizations).where(eq(organizations.code, organizationCode)).limit(1);
    const country = org[0]?.country || "FRA";

    const where = and(
      or(
        ilike(competitors.lastname, `%${search}%`),
        ilike(competitors.firstname, `%${search}%`)
      ),
      eq(competitors.gender, gender),
      eq(competitors.nationcode, country)
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
