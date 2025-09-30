import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {eq} from "drizzle-orm";
import {Competition} from "@/app/types";
import {sendNotificationEmail} from "@/app/lib/sendNotificationEmail";
import {getAuth} from "@clerk/nextjs/server";
import type {NextRequest} from "next/server";
import {selectNotDeleted} from "@/lib/soft-delete";
import type {Inscription} from "@/app/types";
import {getUserOrganizationCode} from "@/app/lib/getUserOrganization";

export const PUT = async (
  request: Request,
  {params}: {params: Promise<{id: string}>}
) => {
  try {
    const { inscriptions } = getDbTables();
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

    // Mise à jour des données de l'événement (seulement si non supprimée)
    await db
      .update(inscriptions)
      .set({
        eventData,
      })
      .where(selectNotDeleted(inscriptions, eq(inscriptions.id, idNumber)));

    // Récupérer l'inscription mise à jour (seulement si non supprimée)
    const updatedInscription = await db
      .select()
      .from(inscriptions)
      .where(selectNotDeleted(inscriptions, eq(inscriptions.id, idNumber)))
      .then((res: Inscription[]) => res[0]);

    if (!updatedInscription) {
      return NextResponse.json(
        {message: "Inscription non trouvée"},
        {status: 404}
      );
    }

    // Get organization configuration for email
    const {userId} = await getAuth(request as NextRequest);
    try {
      const organizationCode = await getUserOrganizationCode();
      const { organizations } = getDbTables();
      const org = await db.select().from(organizations).where(eq(organizations.code, organizationCode)).limit(1);

      const baseUrl = org[0]?.baseUrl || "https://www.inscriptions-fis-etranger.fr";
      const fromEmail = org[0]?.fromEmail;

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
            <a href='${baseUrl}/inscriptions/${idNumber}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
            <div style='margin-top:32px; color:#888; font-size:13px;'>
              ${new Date().toLocaleString("fr-FR")}
            </div>
          </div>
        `,
        userId: userId ?? undefined,
        fromEmail,
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
