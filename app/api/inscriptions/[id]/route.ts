import {NextRequest, NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
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

export async function PATCH(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const json = await req.json();
    const {status} = json;
    const allowedStatuses = ["open", "frozen", "validated"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({error: "Statut invalide"}, {status: 400});
    }
    const updated = await db
      .update(inscriptions)
      .set({status})
      .where(eq(inscriptions.id, Number(id)))
      .returning();
    if (!updated.length) {
      return NextResponse.json(
        {error: "Inscription non trouvée"},
        {status: 404}
      );
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return NextResponse.json(
      {error: "Erreur interne du serveur"},
      {status: 500}
    );
  }
}
