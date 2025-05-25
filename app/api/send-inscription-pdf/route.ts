import {NextResponse} from "next/server";
import {Resend} from "resend";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";
import {format} from "date-fns";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log("Starting PDF email send process...");

    // On attend un formData (multipart)
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");
    const toRaw = formData.get("to");
    const inscriptionId = formData.get("inscriptionId") as string | null;
    const subject = formData.get("subject") as string | null;
    const gender = formData.get("gender") as string | null;

    console.log("Received form data:", {
      hasPdfFile: !!pdfFile,
      toRaw,
      inscriptionId,
      subject,
      gender,
    });

    if (!pdfFile || !toRaw || !inscriptionId || !subject) {
      console.log("Missing required fields");
      return NextResponse.json(
        {error: "Missing required fields: pdf, to, inscriptionId, subject"},
        {status: 400}
      );
    }

    // toRaw est un JSON.stringify d'un array
    let to: string[] = [];
    try {
      to = JSON.parse(toRaw as string);
      console.log("Parsed recipients:", to);
    } catch (error) {
      console.error("Error parsing recipients:", error);
      return NextResponse.json(
        {error: "Invalid 'to' field: must be a JSON array of emails."},
        {status: 400}
      );
    }

    // Récupérer les informations de l'inscription depuis la base de données
    const inscription = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, Number(inscriptionId)))
      .limit(1);

    if (!inscription.length) {
      console.log("Inscription not found:", inscriptionId);
      return NextResponse.json({error: "Inscription not found"}, {status: 404});
    }

    const eventData = inscription[0].eventData;
    const formattedStartDate = format(
      new Date(eventData.startDate),
      "dd/MM/yyyy"
    );
    const formattedEndDate = format(new Date(eventData.endDate), "dd/MM/yyyy");

    // pdfFile est un Blob (File)
    const arrayBuffer = await (pdfFile as Blob).arrayBuffer();
    const pdfAsBuffer = Buffer.from(arrayBuffer);

    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>";

    console.log("Sending email to:", to);
    console.log("From address:", fromAddress);

    // Construction du subject complet côté serveur
    const subjectParts = [
      "Inscription FIS Etranger :",
      eventData.name,
      eventData.place ? `- ${eventData.place}` : "",
      eventData.startDate && eventData.endDate
        ? `- du ${formattedStartDate} au ${formattedEndDate}`
        : "",
      gender ? `(${gender})` : "",
    ];
    const fullSubject = subjectParts
      .filter(Boolean)
      .join(" ")
      .replace(/ +/g, " ")
      .trim();

    console.log("Subject:", fullSubject);

    const {data, error: emailError} = await resend.emails.send({
      from: fromAddress,
      to: to,
      subject: fullSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">${eventData.name}</h2>
          <p>Lieu : ${eventData.place} (${eventData.placeNationCode})</p>
          <p>Dates : du ${formattedStartDate} au ${formattedEndDate}</p>
          <p>Catégorie : ${gender === "M" ? "Hommes (M)" : gender === "W" ? "Femmes (W)" : "Non précisé"}</p>
        </div>
      `,
      attachments: [
        {
          filename: `inscription-${inscriptionId}-${gender ? gender : "ALL"}.pdf`,
          content: pdfAsBuffer,
        },
      ],
    });

    if (emailError) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        {error: "Failed to send email", details: emailError},
        {status: 500}
      );
    }

    console.log("Email sent successfully:", data?.id);
    return NextResponse.json({
      message: "Email sent successfully!",
      emailId: data?.id,
    });
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {error: "Failed to process request", details: (error as Error).message},
      {status: 500}
    );
  }
}
