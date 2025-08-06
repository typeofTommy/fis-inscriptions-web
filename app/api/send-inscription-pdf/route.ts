import {NextResponse} from "next/server";
import {Resend} from "resend";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";
import {format} from "date-fns";
import {selectNotDeleted} from "@/lib/soft-delete";

export const dynamic = "force-dynamic";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  return new Resend(apiKey);
}

export async function POST(request: Request) {
  try {
    // On attend un formData (multipart)
    const formData = await request.formData();
    const pdfFile = formData.get("pdf");
    const toRaw = formData.get("to");
    const inscriptionId = formData.get("inscriptionId") as string | null;
    const subject = formData.get("subject") as string | null;
    const gender = formData.get("gender") as string | null;

    if (!pdfFile || !toRaw || !inscriptionId || !subject) {
      return NextResponse.json(
        {error: "Missing required fields: pdf, to, inscriptionId, subject"},
        {status: 400}
      );
    }

    // toRaw est un JSON.stringify d'un array
    let to: string[] = [];
    try {
      to = JSON.parse(toRaw as string);
    } catch {
      return NextResponse.json(
        {error: "Invalid 'to' field: must be a JSON array of emails."},
        {status: 400}
      );
    }

    // Récupérer les informations de l'inscription depuis la base de données (non supprimée)
    const inscription = await db
      .select()
      .from(inscriptions)
      .where(
        selectNotDeleted(
          inscriptions,
          eq(inscriptions.id, Number(inscriptionId))
        )
      )
      .limit(1);

    if (!inscription.length) {
      return NextResponse.json({error: "Inscription not found"}, {status: 404});
    }

    const eventData = inscription[0].eventData;

    // pdfFile est un Blob (File)
    const arrayBuffer = await (pdfFile as Blob).arrayBuffer();
    const pdfAsBuffer = Buffer.from(arrayBuffer);

    const fromAddress =
      process.env.RESEND_FROM_EMAIL ||
      "Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>";

    // Use the subject provided by the frontend
    const subjectLine = subject;
    
    // Extract gender information for email body and filename
    const isMen = gender === "M";
    const isWomen = gender === "W";
    const subjectGender = isMen ? "MEN" : isWomen ? "WOMEN" : "TEAM";
    
    // Format date for the email body and filename
    const formatShortDate = (start: Date, end: Date) => {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const startD = new Date(start);
      const endD = new Date(end);
      const sameMonth = startD.getMonth() === endD.getMonth();
      const sameYear = startD.getFullYear() === endD.getFullYear();
      const yearStr = String(endD.getFullYear()).slice(-2);
      if (sameMonth && sameYear) {
        return `${startD.getDate()}-${endD.getDate()} ${months[endD.getMonth()]} ${yearStr}`;
      } else {
        return `${format(startD, "dd/MM/yyyy")}-${format(endD, "dd/MM/yyyy")}`;
      }
    };
    const shortDate = formatShortDate(
      new Date(eventData.startDate),
      new Date(eventData.endDate)
    );
    const place = eventData.place || "";
    const nation = eventData.placeNationCode
      ? `(${eventData.placeNationCode})`
      : "";

    const resend = getResendClient();
    const {data, error: emailError} = await resend.emails.send({
      from: fromAddress,
      to: to,
      subject: subjectLine,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f6f7; padding: 24px; color: #222;">
          <p style="font-size: 18px; margin-bottom: 18px;">Dear Ski Friend,</p>
          <p style="font-size: 16px; margin-bottom: 18px;">
            Please find attached the French 🇫🇷 <b><i>${subjectGender}</i></b> Team entries for the following races:
          </p>
          <ul style="margin-bottom: 18px;">
            <li style="font-size: 16px;">
              <a style="color: #1976d2; text-decoration: underline;" href="https://www.inscriptions-fis-etranger.fr/inscriptions/${inscriptionId}">${shortDate}</a>
              ➞ ${place} ${nation}-FIS
            </li>
          </ul>
          <p style="font-size: 16px; margin-bottom: 18px;">
            We kindly ask you to <b><a style="color: #1976d2; text-decoration: underline;" href="mailto:${to.join(",")}?subject=Re:%20${encodeURIComponent(subjectLine)}">reply to all</a></b> to confirm receipt, or if you need to provide us with any information or the program.
          </p>
          <p style="font-size: 16px; margin-bottom: 18px;">
            We wish you great races, and please feel free to contact me at <a href="mailto:${isWomen ? "jmagnellet@orange.fr" : "pmartin@ffs.fr"}" style="color: #1976d2; text-decoration: underline;">${isWomen ? "jmagnellet@orange.fr" : "pmartin@ffs.fr"}</a> if you have any questions.
          </p>
          <p style="font-size: 16px;">Best regards.</p>
          <div style="text-align: center; margin-top: 32px;">
            <img src="${isWomen ? "https://i.imgur.com/ISeoDQp.jpeg" : "https://i.imgur.com/tSwmL0f.png"}" alt="French Team Email Signature" style="max-width: 300px; width: 100%; height: auto; display: inline-block;" />
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `${shortDate} ➞ ${place} ${nation}-FIS-${subjectGender}.pdf`
            .replace(/ +/g, " ")
            .replace(" ()", "")
            .trim(),
          content: pdfAsBuffer,
        },
      ],
    });

    if (emailError) {
      return NextResponse.json(
        {error: "Failed to send email", details: emailError},
        {status: 500}
      );
    }

    // Update inscription status to "email_sent" and set email sent timestamp
    try {
      await db
        .update(inscriptions)
        .set({
          status: "email_sent",
          emailSentAt: new Date(),
        })
        .where(eq(inscriptions.id, Number(inscriptionId)));
    } catch {
      // Don't fail the request if status update fails, email was sent successfully
    }

    return NextResponse.json({
      message: "Email sent successfully!",
      emailId: data?.id,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {error: "Failed to process request", details: (error as Error).message},
      {status: 500}
    );
  }
}
