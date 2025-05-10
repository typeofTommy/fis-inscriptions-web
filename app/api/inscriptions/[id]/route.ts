import {NextRequest, NextResponse} from "next/server";
import {eq, and, inArray} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  inscriptions,
  inscriptionCompetitors,
  stations,
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

    const station = await db
      .select()
      .from(stations)
      .where(eq(stations.id, inscription[0].location || 0));

    // Check if inscription exists and has data
    if (!inscription || inscription.length === 0) {
      return new NextResponse("Inscription non trouvée", {status: 404});
    }

    const foundInscription = {
      ...inscription[0],
      station: station[0],
    };

    // Retourne simplement l'id de la station (number ou null)
    return NextResponse.json(foundInscription);
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
    const inscriptionId = Number(id);
    const json = await req.json();

    // Extract editable fields from the request body
    // Status updates are handled separately, so we don't expect status here.
    let location = json.location;
    const customStation = json.customStation;
    const country = json.country;
    const firstRaceDate = json.firstRaceDate;
    const lastRaceDate = json.lastRaceDate;
    const codexData = json.codexData;

    // Basic validation (more can be added with Zod if needed)
    if (!country || !firstRaceDate || !lastRaceDate || !codexData) {
      return NextResponse.json(
        {error: "Données manquantes pour la mise à jour."},
        {status: 400}
      );
    }

    // Si customStation est présent, insérer ou retrouver la station et utiliser son id
    if (customStation && (!location || location === null)) {
      const station = await db
        .select()
        .from(stations)
        .where(eq(stations.name, customStation.toLowerCase()));
      if (!station.length) {
        const inserted = await db
          .insert(stations)
          .values({name: customStation.toLowerCase(), country})
          .returning();
        location = inserted[0].id;
      } else {
        location = station[0].id;
      }
    }

    // Get current inscription data to compare codex data
    const currentInscription = await db
      .select({codexData: inscriptions.codexData})
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId))
      .limit(1);

    if (!currentInscription.length) {
      return NextResponse.json(
        {error: "Inscription non trouvée"},
        {status: 404}
      );
    }

    // Find removed codex numbers
    const currentCodices = new Set(
      currentInscription[0].codexData.map((cd: any) => cd.number)
    );
    const newCodices = new Set(codexData.map((cd: any) => cd.number));
    const removedCodices = [...currentCodices].filter(
      (codex) => !newCodices.has(codex)
    );

    // If there are removed codices, delete their inscription_competitors entries
    if (removedCodices.length > 0) {
      await db
        .delete(inscriptionCompetitors)
        .where(
          and(
            eq(inscriptionCompetitors.inscriptionId, inscriptionId),
            inArray(inscriptionCompetitors.codexNumber, removedCodices)
          )
        );
    }

    // Update the inscription with the new data
    const updated = await db
      .update(inscriptions)
      .set({
        location,
        firstRaceDate,
        lastRaceDate,
        codexData,
      })
      .where(eq(inscriptions.id, inscriptionId))
      .returning();

    if (!updated.length) {
      return NextResponse.json(
        {error: "Inscription non trouvée"},
        {status: 404}
      );
    }
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'inscription:", error);
    return NextResponse.json(
      {error: "Erreur interne du serveur"},
      {status: 500}
    );
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
