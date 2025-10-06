import {NextRequest, NextResponse} from "next/server";
import {z} from "zod";
import {currentUser} from "@clerk/nextjs/server";
import {sendNotificationEmail} from "@/app/lib/sendNotificationEmail";
import {db} from "@/app/db/inscriptionsDB";
import {eq} from "drizzle-orm";
import {getDbTables} from "@/app/lib/getDbTables";
import {getUserOrganizationCode} from "@/app/lib/getUserOrganization";

const contactSchema = z.object({
  inscriptionId: z.string(),
  subject: z.string().min(1, "Le sujet est requis"),
  message: z.string().min(1, "Le message est requis"),
});

export async function POST(request: NextRequest) {
  try {
    const { inscriptions, organizations } = getDbTables();
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({error: "Non autorisé"}, {status: 401});
    }

    const body = await request.json();
    const validatedData = contactSchema.parse(body);

    // Récupérer les détails de l'inscription
    const inscriptionRows = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, parseInt(validatedData.inscriptionId)))
      .limit(1);

    const inscription = inscriptionRows[0];

    if (!inscription) {
      return NextResponse.json(
        {error: "Inscription non trouvée"},
        {status: 404}
      );
    }

    // Get organization configuration
    const organizationCode = await getUserOrganizationCode();
    const org = await db.select().from(organizations).where(eq(organizations.code, organizationCode)).limit(1);

    if (!org[0]) {
      return NextResponse.json({error: "Organization not found"}, {status: 404});
    }

    const baseUrl = org[0].baseUrl;
    const fromEmail = org[0].fromEmail;

    // Préparer l'email
    const userEmail = user.emailAddresses?.[0]?.emailAddress;
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || userEmail || "Utilisateur";

    const eventUrl = `${baseUrl}/inscriptions/${inscription.id}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Question concernant une inscription</h2>

        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Détails du contact</h3>
          <p><strong>De :</strong> ${userName} (${userEmail})</p>
          <p><strong>Sujet :</strong> ${validatedData.subject}</p>
        </div>

        <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #374151; margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${validatedData.message}</p>
        </div>

        <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Inscription concernée</h3>
          <p><strong>Événement :</strong> ${inscription.eventData?.eventName || "Non renseigné"}</p>
          <p><strong>Lieu :</strong> ${inscription.eventData?.place || "Non renseigné"}</p>
          <p><strong>Dates :</strong> ${inscription.eventData?.startDate ? new Date(inscription.eventData.startDate).toLocaleDateString("fr-FR") : "Non renseigné"} - ${inscription.eventData?.endDate ? new Date(inscription.eventData.endDate).toLocaleDateString("fr-FR") : "Non renseigné"}</p>
          <p><strong>Statut :</strong> ${
            inscription.status === "open" 
              ? "Ouverte" 
              : inscription.status === "cancelled" 
                ? "Course annulée" 
                : "Validée"
          }</p>
          <p><strong>Lien :</strong> <a href="${eventUrl}" style="color: #2563eb;">Voir l'inscription</a></p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Cet email a été envoyé automatiquement depuis la plateforme d'inscriptions FIS Étranger.</p>
        </div>
      </div>
    `;

    // Get recipients from organization config
    const emailTemplates = org[0].emailTemplates;
    const recipients = emailTemplates?.contact_inscription?.recipients || ["pmartin@ffs.fr"]; // fallback

    // Envoyer l'email
    await sendNotificationEmail({
      to: recipients,
      subject: `[Contact Inscription] ${validatedData.subject}`,
      html: htmlContent,
      userId: user.id,
      fromEmail,
    });

    return NextResponse.json({success: true});
  } catch (error) {
    console.error("Erreur lors de l'envoi du message de contact:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {error: "Données invalides", details: error.errors},
        {status: 400}
      );
    }

    return NextResponse.json(
      {error: "Erreur lors de l'envoi du message"},
      {status: 500}
    );
  }
}
