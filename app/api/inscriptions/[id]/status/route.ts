import {db} from "@/app/db/inscriptionsDB";
import {Status} from "@/app/types";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";
import {NextRequest, NextResponse} from "next/server";

export async function PATCH(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") as Status;
    const inscriptionId = Number(id);

    // Basic validation (more can be added with Zod if needed)
    if (!id || !status) {
      return NextResponse.json(
        {error: "Données manquantes pour la mise à jour."},
        {status: 400}
      );
    }

    if (status !== "open" && status !== "validated") {
      return NextResponse.json({error: "Statut invalide"}, {status: 400});
    }

    await db
      .update(inscriptions)
      .set({status})
      .where(eq(inscriptions.id, inscriptionId));
    return NextResponse.json({message: "Inscription mise à jour avec succès"});
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'inscription:", error);
    return NextResponse.json(
      {error: "Erreur interne du serveur"},
      {status: 500}
    );
  }
}
