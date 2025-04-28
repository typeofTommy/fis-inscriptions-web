import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {competitors} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";

export async function GET(
  _request: Request,
  {params}: {params: Promise<{id: string}>}
) {
  const id = (await params).id;
  const idNum = Number(id);
  if (!id || isNaN(idNum) || !Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({error: "Invalid competitor id"}, {status: 400});
  }
  const result = await db
    .select()
    .from(competitors)
    .where(eq(competitors.competitorid, idNum));
  if (!result || result.length === 0) {
    return NextResponse.json({error: "Competitor not found"}, {status: 404});
  }
  return NextResponse.json(result[0]);
}
