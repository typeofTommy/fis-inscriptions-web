import {Resend} from "resend";
import {clerkClient} from "@clerk/clerk-sdk-node";

export const sendNotificationEmail = async ({
  to,
  subject,
  html,
  userId,
  cc,
  fromEmail,
}: {
  to: string[];
  subject: string;
  html: string;
  userId?: string;
  cc?: string[];
  fromEmail?: string;
}) => {
  let userDisplay = userId;
  if (userId) {
    try {
      const user = await clerkClient.users.getUser(userId);
      userDisplay =
        user.username || user.emailAddresses?.[0]?.emailAddress || user.id;
    } catch {
      // fallback: id Clerk
    }
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: fromEmail || process.env.RESEND_FROM_EMAIL || "Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>",
    to,
    subject,
    html: html.replace(/__USER__/g, userDisplay || "-"),
    ...(cc ? {cc} : {}),
  });
};
