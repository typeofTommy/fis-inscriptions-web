import {Client} from "pg";
import {sendNotificationEmail} from "../app/lib/sendNotificationEmail";

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
      ic.codex_number
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

  let html = `<h2>Récapitulatif quotidien des inscriptions</h2>`;

  // Créations d'événements
  html += `<h3>Événements créés</h3>`;
  if (Object.keys(eventsById).length === 0) {
    html += `<i>Aucun événement créé aujourd'hui.</i>`;
  } else {
    for (const [, evts] of Object.entries(eventsById)) {
      const evt = evts[0];
      html += `<b>Codex ${evt.event_id} - ${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</b><br>`;
      html += `Créé le : ${evt.created_at}<br><br>`;
    }
  }

  // Ajouts de compétiteurs
  html += `<h3>Ajouts de coureurs</h3>`;
  if (Object.keys(competitorsByEvent).length === 0) {
    html += `<i>Aucun ajout de coureur aujourd'hui.</i>`;
  } else {
    for (const [, comps] of Object.entries(competitorsByEvent)) {
      const evt = comps[0];
      html += `<b>Codex ${evt.event_id} - ${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</b><ul>`;
      // Group by codex_number
      const byCodex = groupBy(comps, "codex_number");
      for (const [codex, runners] of Object.entries(byCodex)) {
        html += `<li><b>Codex ${codex}</b><ul>`;
        for (const runner of runners) {
          html += `<li>${runner.firstname} ${runner.lastname} (ajouté le ${runner.created_at})</li>`;
        }
        html += `</ul></li>`;
      }
      html += `</ul>`;
    }
  }

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
