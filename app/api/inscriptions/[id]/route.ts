import {NextRequest, NextResponse} from "next/server";
import {eq} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  inscriptions,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const idNum = Number(id);
    if (isNaN(idNum)) {
      return NextResponse.json({error: "Invalid id"}, {status: 400});
    }
    const inscription = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, idNum))
      .limit(1);

    // Check if inscription exists and has data
    if (!inscription || inscription.length === 0) {
      return new NextResponse("Inscription non trouvée", {status: 404});
    }

    const foundInscription = {
      ...inscription[0],
    };

    // Retourne simplement l'id de la station (number ou null)
    return NextResponse.json(foundInscription);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'inscription:", error);
    return new NextResponse("Erreur interne du serveur", {status: 500});
  }
}

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const {id} = await params;
    const inscriptionId = Number(id);

    if (isNaN(inscriptionId)) {
      return NextResponse.json(
        {error: "ID d'inscription invalide"},
        {status: 400}
      );
    }

    // Since neon-http driver doesn't support transactions, delete sequentially.
    // 1. Delete related competitors first
    await db
      .delete(inscriptionCompetitors)
      .where(eq(inscriptionCompetitors.inscriptionId, inscriptionId));

    // 2. Delete the inscription itself
    const deletedInscription = await db
      .delete(inscriptions)
      .where(eq(inscriptions.id, inscriptionId))
      .returning({deletedId: inscriptions.id});

    // Check if the inscription was actually deleted
    if (!deletedInscription || deletedInscription.length === 0) {
      // If competitors were deleted but inscription wasn't found, it's a specific state.
      // We might log this, but for the client, a 404 is appropriate.
      console.warn(
        `Inscription ID ${inscriptionId} not found for deletion, but related competitors might have been removed.`
      );
      return NextResponse.json(
        {error: "Inscription non trouvée ou déjà supprimée"},
        {status: 404}
      );
    }

    console.log(`Inscription with ID ${inscriptionId} deleted successfully.`);
    return NextResponse.json(
      {message: "Inscription supprimée avec succès"},
      {status: 200}
    );
  } catch (error: any) {
    console.error("Erreur lors de la suppression de l'inscription:", error);

    // Handle potential database constraint errors or other issues
    return NextResponse.json(
      {error: "Erreur interne du serveur lors de la suppression"},
      {status: 500}
    );
  }
}
