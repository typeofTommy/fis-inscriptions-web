import {NextRequest, NextResponse} from "next/server";
import {eq, inArray} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {
  competitors,
  inscriptionCompetitors,
} from "@/drizzle/schemaInscriptions";

export const GET = async (
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) => {
  const {id} = await params;
  const inscriptionId = Number(id);
  if (!inscriptionId) {
    return NextResponse.json({error: "Missing parameters"}, {status: 400});
  }

  // Récupérer tous les liens competitorId <-> codexNumber pour cette inscription
  const links = await db
    .select({
      competitorId: inscriptionCompetitors.competitorId,
      codexNumber: inscriptionCompetitors.codexNumber,
    })
    .from(inscriptionCompetitors)
    .where(eq(inscriptionCompetitors.inscriptionId, inscriptionId));
  const competitorIds = links.map((l) => l.competitorId);

  // Construire un mapping competitorId -> [codexNumber]
  const codexMap: Record<number, string[]> = {};
  links.forEach((l) => {
    if (!codexMap[l.competitorId]) codexMap[l.competitorId] = [];
    codexMap[l.competitorId].push(l.codexNumber);
  });

  if (competitorIds.length === 0) {
    return NextResponse.json([]);
  }

  // Récupérer les infos des compétiteurs avec tous les points
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
      pointsSL: competitors.slpoints,
      pointsSG: competitors.sgpoints,
      pointsGS: competitors.gspoints,
      pointsDH: competitors.dhpoints,
      pointsAC: competitors.acpoints,
    })
    .from(competitors)
    .where(inArray(competitors.competitorid, competitorIds.map(Number)));

  // Formater la réponse avec un objet points
  const result = competitorsData
    .map((c) => ({
      competitorid: c.competitorid,
      fiscode: c.fiscode,
      lastname: c.lastname,
      firstname: c.firstname,
      nationcode: c.nationcode,
      gender: c.gender,
      birthdate: c.birthdate,
      skiclub: c.skiclub,
      points: {
        SL: c.pointsSL ?? 0,
        SG: c.pointsSG ?? 0,
        GS: c.pointsGS ?? 0,
        DH: c.pointsDH ?? 0,
        AC: c.pointsAC ?? 0,
      },
      codexNumbers: codexMap[c.competitorid] || [],
    }))
    .filter((c) => Array.isArray(c.codexNumbers) && c.codexNumbers.length > 0);

  return NextResponse.json(result);
};
