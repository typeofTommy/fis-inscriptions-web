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
  codexNumbers: z.array(z.string()).min(1),
  // Receive date as string, validate, then convert
  firstRaceDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  disciplines: z.array(z.string()).min(1),
  raceLevels: z.array(z.string()).min(1),
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
      codexNumbers,
      firstRaceDate,
      disciplines,
      raceLevels,
    } = body.data;

    const newInscription = {
      email,
      fullName,
      country,
      location,
      eventLink,
      codexNumbers: codexNumbers,
      // Format date *after* validation and before DB insert
      firstRaceDate: new Date(firstRaceDate),
      disciplines,
      raceLevels,
    };

    const result = await db
      //@ts-expect-error jsp pourquoi il fait chier
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
  //@ts-expect-error jsp pourquoi il fait chier
  const inscripList = await db.select().from(inscriptions);
  return NextResponse.json(inscripList);
}
