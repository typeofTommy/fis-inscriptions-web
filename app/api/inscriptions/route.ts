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
  location: z.number().nullable(),
  customStation: z.string().optional(),
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
      customStation,
      codexData,
      firstRaceDate,
      lastRaceDate,
      createdBy,
    } = body.data;

    let locationId = location;
    if (customStation && (!location || location === null)) {
      // Chercher la station par nom (insensible à la casse)
      const station = await db
        .select()
        .from(stations)
        .where(eq(stations.name, customStation.toLowerCase()));
      if (!station.length) {
        // Insérer la station si pas trouvée
        const inserted = await db
          .insert(stations)
          .values({name: customStation.toLowerCase(), country})
          .returning();
        locationId = inserted[0].id;
      } else {
        locationId = station[0].id;
      }
    }

    const newInscription = {
      email,
      fullName,
      country,
      location: locationId,
      codexData,
      firstRaceDate,
      lastRaceDate,
      createdBy,
    };

    const result = await db
      .insert(inscriptions)
      .values(newInscription)
      .returning();

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
      location: inscription.location ?? "",
    }));
  return NextResponse.json(inscripList);
}
