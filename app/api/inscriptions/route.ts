import {NextResponse} from "next/server";
import * as z from "zod";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {Resend} from "resend";
import {clerkClient} from "@clerk/clerk-sdk-node";

// Define the schema for the request body (matching the form schema)
const inscriptionSchema = z.object({
  eventId: z.number(),
  eventData: z.any(),
  createdBy: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = inscriptionSchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json(
        {error: "Invalid input", details: body.error.format()},
        {status: 400}
      );
    }

    const newInscription = body.data;

    const result = await db
      .insert(inscriptions)
      .values({
        createdBy: newInscription.createdBy,
        eventId: newInscription.eventId,
        eventData: newInscription.eventData,
      })
      .returning();

    // Récupérer le vrai npm Clerk (username ou email)
    let creatorDisplay = newInscription.createdBy;
    try {
      const user = await clerkClient.users.getUser(newInscription.createdBy);
      creatorDisplay =
        user.username || user.emailAddresses?.[0]?.emailAddress || user.id;
    } catch {
      // fallback: id Clerk
    }

    // Infos eventData
    const eventData = newInscription.eventData || {};
    const place = eventData.place || "-";
    const nation = eventData.placeNationCode
      ? `(${eventData.placeNationCode})`
      : "";
    const startDate = eventData.startDate
      ? new Date(eventData.startDate)
      : null;
    const endDate = eventData.endDate ? new Date(eventData.endDate) : null;
    const formatDate = (d: Date) => d.toLocaleDateString("fr-FR");
    const dateStr =
      startDate && endDate
        ? `${formatDate(startDate)} au ${formatDate(endDate)}`
        : "-";
    let gender = "-";
    if (Array.isArray(eventData.genderCodes)) {
      if (
        eventData.genderCodes.includes("M") &&
        eventData.genderCodes.includes("W")
      )
        gender = "Mixte";
      else if (eventData.genderCodes.includes("M")) gender = "Hommes";
      else if (eventData.genderCodes.includes("W")) gender = "Femmes";
    }
    // Lien vers l'événement
    const eventUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.inscriptions-fis-etranger.fr"}/inscriptions/${result[0].id}`;

    // Envoi de l'email de notification via Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from:
          process.env.RESEND_FROM_EMAIL ||
          "Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>",
        to: ["pmartin@ffs.fr"],
        subject: `Nouvelle inscription créée (eventId: ${newInscription.eventId})`,
        html: `
          <div style='font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9f9f9; padding:24px; border-radius:8px;'>
            <h2 style='color:#1976d2;'>Nouvelle inscription créée</h2>
            <table style='margin-bottom:24px;'>
              <tr><td style='font-weight:bold;'>Lieu :</td><td>${place} ${nation}</td></tr>
              <tr><td style='font-weight:bold;'>Genre :</td><td>${gender}</td></tr>
              <tr><td style='font-weight:bold;'>Date :</td><td>${dateStr}</td></tr>
              <tr><td style='font-weight:bold;'>eventId :</td><td>${newInscription.eventId}</td></tr>
              <tr><td style='font-weight:bold;'>Créateur :</td><td>${creatorDisplay}</td></tr>
            </table>
            <a href='${eventUrl}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
            <div style='margin-top:32px; color:#888; font-size:13px;'>
              ${new Date().toLocaleString("fr-FR")}
            </div>
          </div>
        `,
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'email de notification:", err);
      // On ne bloque pas la création si l'email échoue
    }

    return NextResponse.json({
      inscription: result[0],
    });
  } catch (error) {
    console.error("Failed to create inscription:", error);
    // Generic error for security
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function GET() {
  const inscripList = await db.select().from(inscriptions);
  return NextResponse.json(inscripList);
}
