import {NextResponse} from "next/server";
import * as z from "zod";
import {db} from "@/app/db/inscriptionsDB";
import {inscriptions} from "@/drizzle/schemaInscriptions";

// Define the schema for the request body (matching the form schema)
const inscriptionSchema = z.object({
  eventId: z.number(),
  eventData: z.any(),
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

    const newInscription = body.data;

    const result = await db
      .insert(inscriptions)
      .values({
        createdBy: newInscription.createdBy,
        eventId: newInscription.eventId,
        eventData: newInscription.eventData,
      })
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
  const inscripList = await db.select().from(inscriptions);
  return NextResponse.json(inscripList);
}
