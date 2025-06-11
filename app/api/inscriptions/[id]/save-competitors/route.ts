import {NextRequest, NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptionCompetitors} from "@/drizzle/schemaInscriptions";
import {getAuth} from "@clerk/nextjs/server";

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {userId} = getAuth(req);
  if (!userId) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  const {id} = await params;
  const inscriptionId = Number(id);
  const {competitorIds, codexNumbers} = await req.json();

  if (
    !inscriptionId ||
    !Array.isArray(competitorIds) ||
    !Array.isArray(codexNumbers) ||
    competitorIds.length === 0 ||
    codexNumbers.length === 0
  ) {
    return NextResponse.json({error: "Invalid payload"}, {status: 400});
  }

  // Créer les nouvelles liaisons sans supprimer les anciennes
  const toInsert = [];
  for (const competitorId of competitorIds) {
    for (const codexNumber of codexNumbers) {
      toInsert.push({
        inscriptionId,
        competitorId,
        codexNumber,
        addedBy: userId,
      });
    }
  }
  if (toInsert.length > 0) {
    await db
      .insert(inscriptionCompetitors)
      .values(toInsert)
      .onConflictDoNothing();
    // Envoi email notification
    /*
    try {
      // Récupérer infos compétiteur et event
      const [competitor] = await db
        .select()
        .from(competitors)
        .where(eq(competitors.competitorid, Number(competitorIds[0])));
      const [insc] = await db
        .select()
        .from(inscriptions)
        .where(eq(inscriptions.id, inscriptionId));
      const codexList = Array.isArray(codexNumbers)
        ? codexNumbers.join(", ")
        : codexNumbers;
      await sendNotificationEmail({
        to: ["tommymartin1234@gmail.com"],
        subject: `Ajout de compétiteur à l'événement (id: ${inscriptionId})`,
        html: `
          <div style='font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9f9f9; padding:24px; border-radius:8px;'>
            <h2 style='color:#1976d2;'>Ajout d'un compétiteur</h2>
            <table style='margin-bottom:24px;'>
              <tr><td style='font-weight:bold;'>Événement :</td><td>${insc?.eventData?.place || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Codex :</td><td>${codexList}</td></tr>
              <tr><td style='font-weight:bold;'>Nom :</td><td>${competitor?.lastname || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Prénom :</td><td>${competitor?.firstname || "-"}</td></tr>
              <tr><td style='font-weight:bold;'>Ajouté par :</td><td>__USER__</td></tr>
            </table>
            <a href='https://www.inscriptions-fis-etranger.fr/inscriptions/${inscriptionId}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
            <div style='margin-top:32px; color:#888; font-size:13px;'>
              ${new Date().toLocaleString("fr-FR")}
            </div>
          </div>
        `,
        userId,
      });
    } catch (e) {
      console.error(e);
    }
    */
  }

  return NextResponse.json({success: true});
}
