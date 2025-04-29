import {NextResponse} from "next/server";
import * as z from "zod";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions, stations} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";

// Define the schema for the request body (matching the form schema)
const inscriptionSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  country: z.string(),
  location: z.string().min(2),
  eventLink: z.string().url(),
  codexData: z
    .array(
      z.object({
        number: z.string().regex(/^[0-9]+$/),
        sex: z.enum(["M", "F"]),
        discipline: z.string().min(1),
        raceLevel: z.string().min(1),
      })
    )
    .min(1),
  firstRaceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  lastRaceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  createdBy: z.string(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = inscriptionSchema.safeParse(json);

    if (!body.success) {
      return NextResponse.json(
        {error: "Invalid input", details: body.error.format()},
        {status: 400}
      );
    }

    const {
      email,
      fullName,
      country,
      location,
      eventLink,
      codexData,
      firstRaceDate,
      lastRaceDate,
      createdBy,
    } = body.data;

    const newInscription = {
      email,
      fullName,
      country,
      location: location.toLowerCase(),
      eventLink,
      codexData,
      firstRaceDate,
      lastRaceDate,
      createdBy,
    };

    const result = await db
      .insert(inscriptions)
      .values(newInscription)
      .returning();

    // insert the station

    const station = await db
      .select()
      .from(stations)
      .where(eq(stations.name, location.toLowerCase()));

    if (!station) {
      await db.insert(stations).values({name: location.toLowerCase(), country});
    }

    return NextResponse.json({
      inscription: result[0],
    });
  } catch (error) {
    console.error("Failed to create inscription:", error);
    // Generic error for security
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function GET() {
  const inscripList = (await db.select().from(inscriptions))
    .sort(
      (a, b) =>
        new Date(a.firstRaceDate).getTime() -
        new Date(b.firstRaceDate).getTime()
    )
    .map((inscription) => ({
      ...inscription,
      location:
        inscription.location[0].toUpperCase() + inscription.location.slice(1),
    }));
  return NextResponse.json(inscripList);
}
