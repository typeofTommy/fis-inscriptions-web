import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {stations} from "@/drizzle/schemaInscriptions";

export async function GET() {
  try {
    const s = await db.select().from(stations);

    return NextResponse.json(s);
  } catch (error) {
    console.error("Erreur lors de la récupération des stations:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
