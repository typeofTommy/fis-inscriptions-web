import {Client} from "pg";
import {sendNotificationEmail} from "../app/lib/sendNotificationEmail";
import {format} from "date-fns";
import {fr} from "date-fns/locale";

const dbUrl = process.env.NEON_DATABASE_URL!;
const emailTo = process.env.RECAP_EMAIL_TO!.split(",");

const main = async () => {
  const client = new Client({connectionString: dbUrl});
  await client.connect();

  // Récupère les ajouts de compétiteurs du jour
  const {rows: competitors} = await client.query(`
    SELECT
      'competitor_added' AS action_type,
      ic.id,
      ic.inscription_id,
      i.event_id,
      i.event_data->>'place' AS event_location,
      i.event_data->>'startDate' AS event_start_date,
      i.event_data->>'endDate' AS event_end_date,
      ic.created_at,
      c.firstname,
      c.lastname,
      ic.codex_number,
      ic.added_by
    FROM "inscriptionsDB".inscription_competitors ic
    JOIN "inscriptionsDB".competitors c ON ic.competitor_id = c.competitorid
    JOIN "inscriptionsDB".inscriptions i ON ic.inscription_id = i.id
    WHERE ic.created_at >= CURRENT_DATE
      AND ic.created_at < CURRENT_DATE + INTERVAL '1 day'
    ORDER BY ic.created_at ASC;
  `);

  // Récupère les créations d'événements du jour
  const {rows: events} = await client.query(`
    SELECT
      'event_created' AS action_type,
      id,
      event_id,
      event_data->>'place' AS event_location,
      event_data->>'startDate' AS event_start_date,
      event_data->>'endDate' AS event_end_date,
      created_at
    FROM "inscriptionsDB".inscriptions
    WHERE created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
    ORDER BY created_at ASC;
  `);

  await client.end();

  // Groupement utilitaire
  const groupBy = <T, K extends keyof T>(arr: T[], key: K) =>
    arr.reduce(
      (acc, item) => {
        const k = item[key] as string;
        acc[k] = acc[k] || [];
        acc[k].push(item);
        return acc;
      },
      {} as Record<string, T[]>
    );

  // Group by type, then by event, then by codex
  const eventsById = groupBy(events, "event_id");
  const competitorsByEvent = groupBy(competitors, "event_id");

  // Récupère tous les userId Clerk uniques pour fetch les emails
  const userIds = Array.from(
    new Set(competitors.map((c) => c.added_by).filter(Boolean))
  );
  const userIdToEmail: Record<string, string> = {};
  for (const userId of userIds) {
    try {
      const user = await (
        await import("@clerk/clerk-sdk-node")
      ).clerkClient.users.getUser(userId);
      const email =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        user.username ||
        user.id;
      userIdToEmail[userId] = email;
    } catch {
      userIdToEmail[userId] = userId;
    }
  }

  const html = `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f9fafb;padding:32px;">
    <h2 style="color:#2563eb;">Récapitulatif quotidien des inscriptions</h2>
    <div style="margin-bottom:32px;">
      <h3 style="color:#111827;">Événements créés</h3>
      ${
        Object.keys(eventsById).length === 0
          ? `<i style='color:#6b7280;'>Aucun événement créé aujourd'hui.</i>`
          : Object.values(eventsById)
              .map((evts) => {
                const evt = evts[0];
                const formattedDate = format(
                  new Date(evt.created_at),
                  "dd MMMM yyyy 'à' HH:mm",
                  {locale: fr}
                );
                return `<div style='margin-bottom:16px;'>
              <a href="https://www.inscriptions-fis-etranger.fr/inscriptions/${evt.id}" style="color:#2563eb;text-decoration:underline;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</a><br>
              <span style='color:#6b7280;'>Créé le : ${formattedDate}</span>
            </div>`;
              })
              .join("")
      }
    </div>
    <div>
      <h3 style="color:#111827;">Ajouts de coureurs</h3>
      ${
        Object.keys(competitorsByEvent).length === 0
          ? `<i style='color:#6b7280;'>Aucun ajout de coureur aujourd'hui.</i>`
          : Object.values(competitorsByEvent)
              .map((comps) => {
                const evt = comps[0];
                return `<div style='margin-bottom:24px;'>
              <a href="https://www.inscriptions-fis-etranger.fr/inscriptions/${evt.inscription_id}" style="color:#2563eb;text-decoration:underline;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</a>
              <ul style='margin:8px 0 0 16px;padding:0;'>
                ${(() => {
                  const byCodex = groupBy(comps, "codex_number");
                  return Object.entries(byCodex)
                    .map(
                      ([codex, runners]) => `
                    <li style='margin-bottom:8px;'>
                      <span style='color:#111827;font-weight:500;'>Codex ${codex}</span>
                      <ul style='margin:4px 0 0 16px;padding:0;'>
                        ${runners
                          .map((runner) => {
                            const email =
                              userIdToEmail[runner.added_by] || runner.added_by;
                            const formattedDate = format(
                              new Date(runner.created_at),
                              "dd MMMM yyyy 'à' HH:mm",
                              {locale: fr}
                            );
                            return `<li style='color:#374151;'>${runner.firstname} ${runner.lastname} <span style='color:#6b7280;'>(ajouté le ${formattedDate} par ${email})</span></li>`;
                          })
                          .join("")}
                      </ul>
                    </li>
                  `
                    )
                    .join("");
                })()}
              </ul>
            </div>`;
              })
              .join("")
      }
    </div>
  </div>`;

  // Envoi du mail via Resend
  await sendNotificationEmail({
    to: emailTo,
    subject: "Récapitulatif quotidien des inscriptions",
    html,
  });

  console.log("Récapitulatif envoyé !");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
