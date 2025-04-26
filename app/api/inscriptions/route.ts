import {NextResponse} from "next/server";
import * as z from "zod";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

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
    } = body.data;

    const newInscription = {
      email,
      fullName,
      country,
      location,
      eventLink,
      codexData,
      firstRaceDate,
      lastRaceDate,
    };

    const result = await db
      .insert(inscriptions)
      .values(newInscription)
      .returning();

    return NextResponse.json({
      message: "Inscription created successfully",
      inscription: result[0],
    });
  } catch (error) {
    console.error("Failed to create inscription:", error);
    // Generic error for security
    return NextResponse.json({error: "Internal Server Error"}, {status: 500});
  }
}

export async function GET() {
  const inscripList = await db.select().from(inscriptions);
  return NextResponse.json(inscripList);
}
