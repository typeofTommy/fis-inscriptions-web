import {Client} from "pg";
import {sendNotificationEmail} from "../app/lib/sendNotificationEmail";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {clerkClient} from "@clerk/clerk-sdk-node";

const dbUrl = process.env.NEON_DATABASE_URL!;
const emailTo = process.env.RECAP_EMAIL_TO!.split(",");
const emailCc = process.env.RECAP_EMAIL_CC
  ? process.env.RECAP_EMAIL_CC.split(",")
  : undefined;

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
      AND ic.deleted_at IS NULL
      AND i.deleted_at IS NULL
      AND i.status != 'cancelled'
    ORDER BY ic.created_at ASC;
  `);

  // Récupère les suppressions de compétiteurs du jour
  const {rows: deletedCompetitors} = await client.query(`
    SELECT
      'competitor_deleted' AS action_type,
      ic.id,
      ic.inscription_id,
      i.event_id,
      i.event_data->>'place' AS event_location,
      i.event_data->>'startDate' AS event_start_date,
      i.event_data->>'endDate' AS event_end_date,
      ic.deleted_at,
      c.firstname,
      c.lastname,
      ic.codex_number,
      ic.added_by
    FROM "inscriptionsDB".inscription_competitors ic
    JOIN "inscriptionsDB".competitors c ON ic.competitor_id = c.competitorid
    JOIN "inscriptionsDB".inscriptions i ON ic.inscription_id = i.id
    WHERE ic.deleted_at >= CURRENT_DATE
      AND ic.deleted_at < CURRENT_DATE + INTERVAL '1 day'
      AND i.deleted_at IS NULL
      AND i.status != 'cancelled'
    ORDER BY ic.deleted_at ASC;
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
      created_at,
      created_by
    FROM "inscriptionsDB".inscriptions
    WHERE created_at >= CURRENT_DATE
      AND created_at < CURRENT_DATE + INTERVAL '1 day'
      AND deleted_at IS NULL
    ORDER BY created_at ASC;
  `);

  // Récupère les suppressions d'événements du jour
  const {rows: deletedEvents} = await client.query(`
    SELECT
      'event_deleted' AS action_type,
      id,
      event_id,
      event_data->>'place' AS event_location,
      event_data->>'startDate' AS event_start_date,
      event_data->>'endDate' AS event_end_date,
      deleted_at,
      created_by
    FROM "inscriptionsDB".inscriptions
    WHERE deleted_at >= CURRENT_DATE
      AND deleted_at < CURRENT_DATE + INTERVAL '1 day'
    ORDER BY deleted_at ASC;
  `);

  // Récupère les ajouts de coachs/staff du jour
  const {rows: coaches} = await client.query(`
    SELECT
      'coach_added' AS action_type,
      ic.id,
      ic.inscription_id,
      i.event_id,
      i.event_data->>'place' AS event_location,
      i.event_data->>'startDate' AS event_start_date,
      i.event_data->>'endDate' AS event_end_date,
      ic.created_at,
      ic.first_name,
      ic.last_name,
      ic.team,
      ic.start_date,
      ic.end_date,
      ic.added_by
    FROM "inscriptionsDB".inscription_coaches ic
    JOIN "inscriptionsDB".inscriptions i ON ic.inscription_id = i.id
    WHERE ic.created_at >= CURRENT_DATE
      AND ic.created_at < CURRENT_DATE + INTERVAL '1 day'
      AND ic.deleted_at IS NULL
      AND i.deleted_at IS NULL
      AND i.status != 'cancelled'
    ORDER BY ic.created_at ASC;
  `);

  // Récupère les suppressions de coachs/staff du jour
  const {rows: deletedCoaches} = await client.query(`
    SELECT
      'coach_deleted' AS action_type,
      ic.id,
      ic.inscription_id,
      i.event_id,
      i.event_data->>'place' AS event_location,
      i.event_data->>'startDate' AS event_start_date,
      i.event_data->>'endDate' AS event_end_date,
      ic.deleted_at,
      ic.first_name,
      ic.last_name,
      ic.team,
      ic.start_date,
      ic.end_date,
      ic.added_by
    FROM "inscriptionsDB".inscription_coaches ic
    JOIN "inscriptionsDB".inscriptions i ON ic.inscription_id = i.id
    WHERE ic.deleted_at >= CURRENT_DATE
      AND ic.deleted_at < CURRENT_DATE + INTERVAL '1 day'
      AND i.deleted_at IS NULL
      AND i.status != 'cancelled'
    ORDER BY ic.deleted_at ASC;
  `);

  // Récupère les événements qui arrivent dans les 7 prochains jours et dont l'email/PDF n'a pas encore été envoyé
  const {rows: upcomingEventsWithoutEmail} = await client.query(`
    SELECT
      id,
      event_id,
      event_data->>'place' AS event_location,
      event_data->>'startDate' AS event_start_date,
      event_data->>'endDate' AS event_end_date,
      status,
      created_by,
      created_at
    FROM "inscriptionsDB".inscriptions
    WHERE deleted_at IS NULL
      AND status NOT IN ('email_sent', 'cancelled')
      AND email_sent_at IS NULL
      AND (event_data->>'startDate')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    ORDER BY (event_data->>'startDate')::date ASC;
  `);

  await client.end();

  // Si aucun changement et aucun événement à venir sans email, on n'envoie pas d'email
  if (events.length === 0 && competitors.length === 0 && deletedEvents.length === 0 && deletedCompetitors.length === 0 && coaches.length === 0 && deletedCoaches.length === 0 && upcomingEventsWithoutEmail.length === 0) {
    console.log("Aucun changement aujourd'hui et aucun événement à venir sans email, aucun email envoyé.");
    return;
  }

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
  const deletedEventsById = groupBy(deletedEvents, "event_id");
  const deletedCompetitorsByEvent = groupBy(deletedCompetitors, "event_id");
  const coachesByEvent = groupBy(coaches, "event_id");
  const deletedCoachesByEvent = groupBy(deletedCoaches, "event_id");

  // Récupère tous les userId Clerk uniques pour fetch les emails (added_by + created_by)
  const userIds = Array.from(
    new Set([
      ...competitors.map((c) => c.added_by).filter(Boolean),
      ...deletedCompetitors.map((c) => c.added_by).filter(Boolean),
      ...events.map((e) => e.created_by).filter(Boolean),
      ...deletedEvents.map((e) => e.created_by).filter(Boolean),
      ...coaches.map((c) => c.added_by).filter(Boolean),
      ...deletedCoaches.map((c) => c.added_by).filter(Boolean),
    ])
  );
  const userIdToEmail: Record<string, string> = {};
  for (const userId of userIds) {
    try {
      const user = await clerkClient.users.getUser(userId);
      const email =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        user.username ||
        user.id;
      userIdToEmail[userId] = email;
    } catch (err) {
      userIdToEmail[userId] = userId;
      console.error("Erreur Clerk pour", userId, err);
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
                const email = userIdToEmail[evt.created_by] || evt.created_by;
                return `<div style='margin-bottom:16px;'>
              <a href="https://www.inscriptions-fis-etranger.fr/inscriptions/${evt.id}" style="color:#2563eb;text-decoration:underline;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</a><br>
              <span style='color:#6b7280;'>Créé le : ${formattedDate} par ${email}</span>
            </div>`;
              })
              .join("")
      }
    </div>
    <div style="margin-bottom:32px;">
      <h3 style="color:#dc2626;">Événements supprimés</h3>
      ${
        Object.keys(deletedEventsById).length === 0
          ? `<i style='color:#6b7280;'>Aucun événement supprimé aujourd'hui.</i>`
          : Object.values(deletedEventsById)
              .map((evts) => {
                const evt = evts[0];
                const formattedDate = format(
                  new Date(evt.deleted_at),
                  "dd MMMM yyyy 'à' HH:mm",
                  {locale: fr}
                );
                const email = userIdToEmail[evt.created_by] || evt.created_by;
                return `<div style='margin-bottom:16px;'>
              <span style="color:#dc2626;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</span><br>
              <span style='color:#6b7280;'>Supprimé le : ${formattedDate} par ${email}</span>
            </div>`;
              })
              .join("")
      }
    </div>
    <div style="margin-bottom:32px;">
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
    <div style="margin-bottom:32px;">
      <h3 style="color:#111827;">Ajouts de coachs/staff</h3>
      ${
        Object.keys(coachesByEvent).length === 0
          ? `<i style='color:#6b7280;'>Aucun ajout de coach/staff aujourd'hui.</i>`
          : Object.values(coachesByEvent)
              .map((coachList) => {
                const evt = coachList[0];
                return `<div style='margin-bottom:24px;'>
              <a href="https://www.inscriptions-fis-etranger.fr/inscriptions/${evt.inscription_id}" style="color:#2563eb;text-decoration:underline;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</a>
              <ul style='margin:8px 0 0 16px;padding:0;'>
                ${coachList
                  .map((coach) => {
                    const email = userIdToEmail[coach.added_by] || coach.added_by;
                    const formattedDate = format(
                      new Date(coach.created_at),
                      "dd MMMM yyyy 'à' HH:mm",
                      {locale: fr}
                    );
                    const teamInfo = coach.team ? ` (${coach.team})` : "";
                    const period = coach.start_date === coach.end_date 
                      ? coach.start_date 
                      : `${coach.start_date} → ${coach.end_date}`;
                    return `<li style='color:#374151;margin-bottom:4px;'>${coach.first_name} ${coach.last_name}${teamInfo} <span style='color:#16a34a;'>[${period}]</span> <span style='color:#6b7280;'>(ajouté le ${formattedDate} par ${email})</span></li>`;
                  })
                  .join("")}
              </ul>
            </div>`;
              })
              .join("")
      }
    </div>
    <div style="margin-bottom:32px;">
      <h3 style="color:#dc2626;">Suppressions de coachs/staff</h3>
      ${
        Object.keys(deletedCoachesByEvent).length === 0
          ? `<i style='color:#6b7280;'>Aucune suppression de coach/staff aujourd'hui.</i>`
          : Object.values(deletedCoachesByEvent)
              .map((coachList) => {
                const evt = coachList[0];
                return `<div style='margin-bottom:24px;'>
              <span style="color:#dc2626;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</span>
              <ul style='margin:8px 0 0 16px;padding:0;'>
                ${coachList
                  .map((coach) => {
                    const email = userIdToEmail[coach.added_by] || coach.added_by;
                    const formattedDate = format(
                      new Date(coach.deleted_at),
                      "dd MMMM yyyy 'à' HH:mm",
                      {locale: fr}
                    );
                    const teamInfo = coach.team ? ` (${coach.team})` : "";
                    const period = coach.start_date === coach.end_date 
                      ? coach.start_date 
                      : `${coach.start_date} → ${coach.end_date}`;
                    return `<li style='color:#dc2626;margin-bottom:4px;'>${coach.first_name} ${coach.last_name}${teamInfo} <span style='color:#16a34a;'>[${period}]</span> <span style='color:#6b7280;'>(supprimé le ${formattedDate} par ${email})</span></li>`;
                  })
                  .join("")}
              </ul>
            </div>`;
              })
              .join("")
      }
    </div>
    <div>
      <h3 style="color:#dc2626;">Suppressions de coureurs</h3>
      ${
        Object.keys(deletedCompetitorsByEvent).length === 0
          ? `<i style='color:#6b7280;'>Aucune suppression de coureur aujourd'hui.</i>`
          : Object.values(deletedCompetitorsByEvent)
              .map((comps) => {
                const evt = comps[0];
                return `<div style='margin-bottom:24px;'>
              <span style="color:#dc2626;font-weight:bold;">${evt.event_location} (${evt.event_start_date} → ${evt.event_end_date})</span>
              <ul style='margin:8px 0 0 16px;padding:0;'>
                ${(() => {
                  const byCodex = groupBy(comps, "codex_number");
                  return Object.entries(byCodex)
                    .map(
                      ([codex, runners]) => `
                    <li style='margin-bottom:8px;'>
                      <span style='color:#dc2626;font-weight:500;'>Codex ${codex}</span>
                      <ul style='margin:4px 0 0 16px;padding:0;'>
                        ${runners
                          .map((runner) => {
                            const email =
                              userIdToEmail[runner.added_by] || runner.added_by;
                            const formattedDate = format(
                              new Date(runner.deleted_at),
                              "dd MMMM yyyy 'à' HH:mm",
                              {locale: fr}
                            );
                            return `<li style='color:#dc2626;'>${runner.firstname} ${runner.lastname} <span style='color:#6b7280;'>(supprimé le ${formattedDate} par ${email})</span></li>`;
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
    <div style="margin-bottom:32px;">
      <h3 style="color:#f59e0b;">Événements à venir sans email/PDF envoyé</h3>
      ${
        upcomingEventsWithoutEmail.length === 0
          ? `<i style='color:#6b7280;'>Aucun événement à venir sans email/PDF dans les 7 prochains jours.</i>`
          : upcomingEventsWithoutEmail
              .map((evt) => {
                const email = userIdToEmail[evt.created_by] || evt.created_by;
                const startDate = format(
                  new Date(evt.event_start_date),
                  "dd MMMM yyyy",
                  {locale: fr}
                );
                const endDate = format(
                  new Date(evt.event_end_date),
                  "dd MMMM yyyy",
                  {locale: fr}
                );
                const daysUntilStart = Math.ceil((new Date(evt.event_start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                const urgencyColor = daysUntilStart <= 2 ? '#dc2626' : daysUntilStart <= 5 ? '#f59e0b' : '#16a34a';
                return `<div style='margin-bottom:16px;border-left:4px solid ${urgencyColor};padding-left:12px;'>
              <a href="https://www.inscriptions-fis-etranger.fr/inscriptions/${evt.id}" style="color:#2563eb;text-decoration:underline;font-weight:bold;">${evt.event_location}</a><br>
              <span style='color:#374151;'>📅 ${startDate === endDate ? startDate : `${startDate} → ${endDate}`}</span><br>
              <span style='color:${urgencyColor};font-weight:500;'>⚠️ Dans ${daysUntilStart} jour${daysUntilStart > 1 ? 's' : ''}</span> | 
              <span style='color:#6b7280;'>Statut: ${evt.status}</span> | 
              <span style='color:#6b7280;'>Créé par: ${email}</span>
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
    cc: emailCc,
  });

  console.log("Récapitulatif envoyé !");
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
