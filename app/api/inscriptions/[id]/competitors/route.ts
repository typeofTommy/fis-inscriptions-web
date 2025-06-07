import {NextRequest, NextResponse} from "next/server";
import {eq, and, inArray} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  competitors,
  inscriptionCompetitors,
  inscriptions,
} from "@/drizzle/schemaInscriptions";
import {sendNotificationEmail} from "@/app/lib/sendNotificationEmail";
import {getAuth} from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const inscriptionId = Number(id);
  const {searchParams} = new URL(req.url);
  const codexNumber = searchParams.get("codexNumber");
  const competitorId = searchParams.get("competitorId");
  const discipline = searchParams.get("discipline");
  // Si competitorId est fourni, on retourne la liste des codex où il est inscrit pour cette inscription
  if (competitorId) {
    // On récupère les codexNumbers pour ce competitorId et cette inscription
    const links = await db
      .select({codexNumber: inscriptionCompetitors.codexNumber})
      .from(inscriptionCompetitors)
      .where(
        and(
          eq(inscriptionCompetitors.inscriptionId, inscriptionId),
          eq(inscriptionCompetitors.competitorId, Number(competitorId))
        )
      );
    const codexNumbers = links.map((l) => l.codexNumber);
    // On récupère les infos des codex dans l'inscription
    const inscription = await db
      .select({eventData: inscriptions.eventData})
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId));
    const codexData = inscription[0]?.eventData.competitions || [];
    // On filtre pour ne garder que les codex où ce compétiteur est inscrit
    const result = codexData.filter((c) =>
      codexNumbers.includes(String(c.codex))
    );
    return NextResponse.json(result);
  }

  if (!inscriptionId) {
    return NextResponse.json({error: "Missing parameters"}, {status: 400});
  }

  // Si codexNumber n'est pas fourni, on retourne les infos de tous les codex pour cet event
  if (!codexNumber) {
    // On récupère tous les codexNumbers pour cette inscription
    const inscription = await db
      .select({eventData: inscriptions.eventData})
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId));
    const codexData = inscription[0]?.eventData.competitions || [];
    // Pour chaque codex, on récupère les competitorIds et leurs infos
    const result = await Promise.all(
      codexData.map(async (codex) => {
        // 1. Récupérer les competitorIds liés à cette inscription et ce codex
        const links = await db
          .select({competitorId: inscriptionCompetitors.competitorId})
          .from(inscriptionCompetitors)
          .where(
            and(
              eq(inscriptionCompetitors.inscriptionId, inscriptionId),
              eq(inscriptionCompetitors.codexNumber, String(codex.codex))
            )
          );
        const competitorIds = links.map((l) => l.competitorId);
        if (competitorIds.length === 0) {
          return {codexNumber: codex.codex, competitors: []};
        }
        // 2. Récupérer les infos des coureurs dans la base FIS
        const competitorsData = await db
          .select({
            competitorid: competitors.competitorid,
            fiscode: competitors.fiscode,
            lastname: competitors.lastname,
            firstname: competitors.firstname,
            nationcode: competitors.nationcode,
            gender: competitors.gender,
            birthdate: competitors.birthdate,
            skiclub: competitors.skiclub,
            points: competitors.acpoints, // Par défaut AC si pas de discipline précisée
          })
          .from(competitors)
          .where(inArray(competitors.competitorid, competitorIds.map(Number)));
        return {codexNumber: codex.codex, competitors: competitorsData};
      })
    );
    return NextResponse.json(result);
  }

  // 1. Récupérer les competitorIds liés à cette inscription et ce codex
  const links = await db
    .select({
      competitorId: inscriptionCompetitors.competitorId,
      addedBy: inscriptionCompetitors.addedBy,
    })
    .from(inscriptionCompetitors)
    .where(
      and(
        eq(inscriptionCompetitors.inscriptionId, inscriptionId),
        eq(inscriptionCompetitors.codexNumber, codexNumber)
      )
    );
  const competitorIds = links.map((l) => l.competitorId);
  const addedByMap = Object.fromEntries(
    links.map((l) => [l.competitorId, l.addedBy])
  );

  if (competitorIds.length === 0) {
    return NextResponse.json([]);
  }

  // 2. Récupérer les infos des coureurs dans la base FIS
  const c = await db
    .select({
      competitorid: competitors.competitorid,
      fiscode: competitors.fiscode,
      lastname: competitors.lastname,
      firstname: competitors.firstname,
      nationcode: competitors.nationcode,
      gender: competitors.gender,
      birthdate: competitors.birthdate,
      skiclub: competitors.skiclub,
      points:
        discipline === "SL"
          ? competitors.slpoints
          : discipline === "GS"
            ? competitors.gspoints
            : discipline === "SG"
              ? competitors.sgpoints
              : discipline === "DH"
                ? competitors.dhpoints
                : competitors.acpoints,
    })
    .from(competitors)
    .where(inArray(competitors.competitorid, competitorIds.map(Number)));

  // Ajout de l'email Clerk
  const uniqueUserIds = Array.from(new Set(Object.values(addedByMap))).filter(
    (id) => !!id && id !== "Unknown"
  );
  const userEmailMap: Record<string, string> = {};
  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const safeUserId = typeof userId === "string" ? userId : String(userId);
      if (!safeUserId || safeUserId === "Unknown") return;
      try {
        const user = await clerk.users.getUser(safeUserId);
        userEmailMap[safeUserId] =
          user?.emailAddresses?.[0]?.emailAddress || safeUserId;
      } catch {
        userEmailMap[safeUserId] = safeUserId;
      }
    })
  );

  // Ajoute le champ addedByEmail à chaque compétiteur
  const result = c.map((comp) => {
    const addedByKey = String(addedByMap[comp.competitorid] ?? "");
    return {
      ...comp,
      addedByEmail: userEmailMap[addedByKey] || "-",
    };
  });

  return NextResponse.json(result);
}

export async function PUT(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const inscriptionId = Number(id);
  const {userId} = getAuth(req);
  if (!inscriptionId) {
    return NextResponse.json({error: "Missing inscriptionId"}, {status: 400});
  }

  let body: {competitorId?: number; codexNumbers?: number[]} = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const {competitorId, codexNumbers} = body;
  if (!competitorId || !Array.isArray(codexNumbers)) {
    return NextResponse.json(
      {error: "competitorId and codexNumbers array are required"},
      {status: 400}
    );
  }

  // Validate codexNumbers (ensure they are numbers)
  if (!codexNumbers.every((cn) => typeof cn === "number" && !isNaN(cn))) {
    return NextResponse.json(
      {error: "codexNumbers must be an array of numbers"},
      {status: 400}
    );
  }

  const codexNumbersAsStrings = codexNumbers.map((cn) => String(cn));

  try {
    // Check if inscription exists
    const inscriptionExists = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId))
      .limit(1);

    if (!inscriptionExists.length) {
      return NextResponse.json({error: "Inscription not found"}, {status: 404});
    }

    // Check if competitor exists
    const competitorExists = await db
      .select()
      .from(competitors)
      .where(eq(competitors.competitorid, competitorId))
      .limit(1);

    if (!competitorExists.length) {
      return NextResponse.json({error: "Competitor not found"}, {status: 404});
    }

    // Since neon-http driver doesn't support transactions, perform operations sequentially
    // 1. Delete all existing registrations for this competitor in this inscription
    await db
      .delete(inscriptionCompetitors)
      .where(
        and(
          eq(inscriptionCompetitors.inscriptionId, inscriptionId),
          eq(inscriptionCompetitors.competitorId, competitorId)
        )
      );

    // 2. Create new registrations for each selected codex
    if (codexNumbersAsStrings.length > 0) {
      const newEntries = codexNumbersAsStrings.map((codexNumStr) => ({
        inscriptionId: inscriptionId,
        competitorId: competitorId,
        codexNumber: codexNumStr,
        addedBy: userId,
      }));

      await db.insert(inscriptionCompetitors).values(newEntries);
    }

    const [competitor] = await db
      .select()
      .from(competitors)
      .where(eq(competitors.competitorid, Number(competitorId)));
    const [insc] = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId));
    const codexList = Array.isArray(codexNumbers)
      ? codexNumbers.join(", ")
      : codexNumbers;
    await sendNotificationEmail({
      to: ["pmartin@ffs.fr"],
      subject: `Modification d'inscription d'un compétiteur (id: ${inscriptionId})`,
      html: `
        <div style='font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9f9f9; padding:24px; border-radius:8px;'>
          <h2 style='color:#1976d2;'>Modification d'inscription</h2>
          <table style='margin-bottom:24px;'>
            <tr><td style='font-weight:bold;'>Événement :</td><td>${insc?.eventData?.place || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Codex :</td><td>${codexList}</td></tr>
            <tr><td style='font-weight:bold;'>Nom :</td><td>${competitor?.lastname || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Prénom :</td><td>${competitor?.firstname || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Modifié par :</td><td>__USER__</td></tr>
          </table>
          <a href='https://www.inscriptions-fis-etranger.fr/inscriptions/${inscriptionId}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
          <div style='margin-top:32px; color:#888; font-size:13px;'>
            ${new Date().toLocaleString("fr-FR")}
          </div>
        </div>
      `,
      userId: userId ?? undefined,
    });

    return NextResponse.json({
      message: "Competitor registrations updated successfully",
    });
  } catch (error) {
    console.error("Error updating competitor registrations:", error);
    return NextResponse.json(
      {error: "Failed to update competitor registrations"},
      {status: 500}
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const inscriptionId = Number(id);
  const {userId} = getAuth(req);
  if (!inscriptionId) {
    return NextResponse.json({error: "Missing inscriptionId"}, {status: 400});
  }

  let body: {competitorId?: number; codexNumbers?: string[]} = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
  }

  const {competitorId, codexNumbers} = body;
  if (!competitorId) {
    return NextResponse.json({error: "Missing competitorId"}, {status: 400});
  }

  // Si codexNumbers n'est pas fourni, on supprime ce compétiteur de tous les codex de cette inscription
  let whereClause;
  if (Array.isArray(codexNumbers) && codexNumbers.length > 0) {
    whereClause = and(
      eq(inscriptionCompetitors.inscriptionId, inscriptionId),
      eq(inscriptionCompetitors.competitorId, competitorId),
      inArray(inscriptionCompetitors.codexNumber, codexNumbers)
    );
  } else {
    whereClause = and(
      eq(inscriptionCompetitors.inscriptionId, inscriptionId),
      eq(inscriptionCompetitors.competitorId, competitorId)
    );
  }

  const deleted = await db
    .delete(inscriptionCompetitors)
    .where(whereClause)
    .returning();

  try {
    const [competitor] = await db
      .select()
      .from(competitors)
      .where(eq(competitors.competitorid, Number(competitorId)));
    const [insc] = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId));
    const codexList = Array.isArray(codexNumbers)
      ? codexNumbers.join(", ")
      : codexNumbers;
    await sendNotificationEmail({
      to: ["pmartin@ffs.fr"],
      subject: `Suppression d'un compétiteur (id: ${inscriptionId})`,
      html: `
        <div style='font-family: Arial, sans-serif; max-width:600px; margin:0 auto; background:#f9f9f9; padding:24px; border-radius:8px;'>
          <h2 style='color:#1976d2;'>Suppression d'un compétiteur</h2>
          <table style='margin-bottom:24px;'>
            <tr><td style='font-weight:bold;'>Événement :</td><td>${insc?.eventData?.place || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Codex :</td><td>${codexList}</td></tr>
            <tr><td style='font-weight:bold;'>Nom :</td><td>${competitor?.lastname || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Prénom :</td><td>${competitor?.firstname || "-"}</td></tr>
            <tr><td style='font-weight:bold;'>Supprimé par :</td><td>__USER__</td></tr>
          </table>
          <a href='https://www.inscriptions-fis-etranger.fr/inscriptions/${inscriptionId}' style='display:inline-block; padding:12px 28px; background:#1976d2; color:#fff; border-radius:6px; text-decoration:none; font-weight:bold; font-size:16px;'>Voir l'événement</a>
          <div style='margin-top:32px; color:#888; font-size:13px;'>
            ${new Date().toLocaleString("fr-FR")}
          </div>
        </div>
      `,
      userId: userId ?? undefined,
    });
  } catch (e) {
    console.error(e);
  }

  return NextResponse.json({deleted});
}
