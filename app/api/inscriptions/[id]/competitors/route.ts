import {NextRequest, NextResponse} from "next/server";
import {eq, and, inArray} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  competitors,
  inscriptionCompetitors,
  inscriptions,
} from "@/drizzle/schemaInscriptions";

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
  const {clerkClient} = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
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

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  const {id} = await params;
  const inscriptionId = Number(id);
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

  return NextResponse.json({deleted});
}
