import {NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

export async function GET(request: Request, {params}: {params: {id: string}}) {
  try {
    const {id} = params;
    const inscription = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, Number(id)))
      .limit(1);
    if (!inscription) {
      return new NextResponse("Inscription non trouvée", {status: 404});
    }

    return NextResponse.json(inscription[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'inscription:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}
