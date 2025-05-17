import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";
import {Competition} from "@/app/types";

export const PUT = async (
  request: Request,
  {params}: {params: Promise<{id: string}>}
) => {
  try {
    const {eventData} = (await request.json()) as {
      eventData: Competition;
    };

    const {id} = await params;
    const idNumber = parseInt(id);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        {message: "ID d'inscription invalide"},
        {status: 400}
      );
    }

    // Mise à jour des données de l'événement
    await db
      .update(inscriptions)
      .set({
        eventData,
      })
      .where(eq(inscriptions.id, idNumber));

    // Récupérer l'inscription mise à jour
    const updatedInscription = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, idNumber))
      .then((res) => res[0]);

    if (!updatedInscription) {
      return NextResponse.json(
        {message: "Inscription non trouvée"},
        {status: 404}
      );
    }

    return NextResponse.json({inscription: updatedInscription});
  } catch (error) {
    console.error("Error updating event data:", error);
    return NextResponse.json(
      {message: "Erreur lors de la mise à jour des données"},
      {status: 500}
    );
  }
};
