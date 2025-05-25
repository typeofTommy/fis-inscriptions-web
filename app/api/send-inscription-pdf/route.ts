import {NextResponse} from "next/server";
import {Resend} from "resend";
import puppeteer from "puppeteer";
// Suppression de chrome-aws-lambda

// Initialize Resend with your API key
// It's best to use an environment variable for the API key
const resend = new Resend(process.env.RESEND_API_KEY);

// Ensure NEXT_PUBLIC_APP_URL is set in your environment variables
const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export async function POST(request: Request) {
  try {
    if (!APP_URL) {
      console.error("NEXT_PUBLIC_APP_URL is not set in environment variables.");
      return NextResponse.json(
        {error: "Application URL is not configured."},
        {status: 500}
      );
    }

    const body = await request.json();
    // Destructure gender, default to undefined if not provided
    const {to, inscriptionId, subject, gender} = body as {
      to: string[];
      inscriptionId: string;
      subject: string;
      gender?: "M" | "W";
    };

    if (!to || to.length === 0 || !inscriptionId || !subject) {
      return NextResponse.json(
        {
          error: "Missing required fields: to (array), inscriptionId, subject",
        },
        {status: 400}
      );
    }

    // Construct the PDF page URL
    // Example: https://your-app.com/inscriptions/123/pdf?gender=M
    let pdfPageUrl = `${APP_URL}/inscriptions/${inscriptionId}/pdf`;
    if (gender) {
      pdfPageUrl += `?gender=${gender}`;
    }

    // 1. Generate PDF using Puppeteer
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: "new", // ou true selon ta version de puppeteer
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      console.log(`Navigating to PDF page: ${pdfPageUrl}`);
      await page.goto(pdfPageUrl, {waitUntil: "networkidle0", timeout: 15000}); // Increased timeout for page loading

      // Optional: Add a small delay to ensure all dynamic content (if any) is loaded
      // await new Promise(resolve => setTimeout(resolve, 1000));

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {top: "1cm", right: "1cm", bottom: "1cm", left: "1cm"}, // Standard margins
        preferCSSPageSize: true, // Use CSS @page size if defined
      });

      // Convert Uint8Array to Buffer for Resend
      const pdfAsBuffer = Buffer.from(pdfBuffer);

      // 2. Send email with PDF attachment using Resend
      // IMPORTANT: Replace with your verified sender domain in Resend
      const fromAddress =
        process.env.RESEND_FROM_EMAIL ||
        "FIS Inscriptions <noreply@yourdomain.com>";

      console.log(`Sending PDF to: ${to.join(", ")}, from: ${fromAddress}`);

      const {data, error: emailError} = await resend.emails.send({
        from: fromAddress,
        // to: to,
        to: "tommymartin1234@gmail.com",
        subject: subject,
        html: "<p>Veuillez trouver ci-joint l'inscription PDF demandée.</p>",
        attachments: [
          {
            filename: `inscription-${inscriptionId}-${gender ? gender : "ALL"}.pdf`,
            content: pdfAsBuffer,
          },
        ],
      });

      if (emailError) {
        console.error(
          "Error sending email:",
          JSON.stringify(emailError, null, 2)
        );
        return NextResponse.json(
          {error: "Failed to send email", details: emailError},
          {status: 500}
        );
      }

      console.log("Email sent successfully! ID:", data?.id);
      return NextResponse.json({
        message: "Email sent successfully!",
        emailId: data?.id,
      });
    } catch (e: unknown) {
      console.error("Error during PDF generation or page navigation:", e);
      // Ensure browser is closed even if page.goto or page.pdf fails
      if (browser !== null) {
        try {
          await browser.close();
        } catch (closeError) {
          console.error("Error closing browser after failure:", closeError);
        }
      }
      return NextResponse.json(
        {error: "Failed to generate PDF", details: (e as Error).message},
        {status: 500}
      );
    } finally {
      if (browser !== null && browser.isConnected()) {
        // Check if browser is still connected before trying to close
        console.log("Closing browser...");
        try {
          await browser.close();
          console.log("Browser closed successfully.");
        } catch (closeError: unknown) {
          // Handle cases where browser might already be closing or closed
          if (
            closeError instanceof Error &&
            closeError.message.includes("Target closed")
          ) {
            console.warn("Browser was already closing or closed.");
          } else {
            console.error(
              "Error closing browser in finally block:",
              closeError
            );
          }
        }
      }
    }
  } catch (error: unknown) {
    console.error("Error in send-inscription-pdf POST handler:", error);
    return NextResponse.json(
      {error: "Failed to process request", details: (error as Error).message},
      {status: 500}
    );
  }
}
