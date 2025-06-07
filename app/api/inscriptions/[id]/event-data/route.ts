import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";
import {Competition} from "@/app/types";
import {sendNotificationEmail} from "@/app/lib/sendNotificationEmail";
import {getAuth} from "@clerk/nextjs/server";
import type {NextRequest} from "next/server";

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

    // Après la mise à jour, envoyer un email
    const {userId} = await getAuth(request as NextRequest);
    try {
      await sendNotificationEmail({
        to: ["pmartin@ffs.fr"],
        subject: `Mise à jour des données de l'événement (id: ${idNumber})`,
        html: `
          <div style='font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9f9f9; padding:24px; border-radius:8px;'>
            <h2 style='color:#1976d2;'>Mise à jour des données de l'événement</h2>
            <table style='margin-bottom:24px;'>
              <tr><td style='font-weight:bold;'>Nom :</td><td>${eventData?.name || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Lieu :</td><td>${eventData?.place || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Date :</td><td>${eventData?.startDate || "-"} au ${eventData?.endDate || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Modifié par :</td><td>__USER__</td></tr>
            </table>
            <a href='https://www.inscriptions-fis-etranger.fr/inscriptions/${idNumber}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
            <div style='margin-top:32px; color:#888; font-size:13px;'>
              ${new Date().toLocaleString("fr-FR")}
            </div>
          </div>
        `,
        userId: userId ?? undefined,
      });
    } catch (e) {
      console.error(e);
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
