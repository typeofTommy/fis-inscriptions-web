import {NextRequest, NextResponse} from "next/server";
import {eq, and} from "drizzle-orm";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {clerkClient} from "@clerk/clerk-sdk-node";
import {getAuth} from "@clerk/nextjs/server";
import {selectNotDeleted, softDelete} from "@/lib/soft-delete";

export async function GET(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const { inscriptionCoaches } = getDbTables();
    const {id} = await params;
    const inscriptionId = Number(id);

    if (!inscriptionId) {
      return NextResponse.json({error: "Missing inscriptionId"}, {status: 400});
    }

    // Get all coaches for this inscription (excluding deleted ones)
    const coaches: (typeof inscriptionCoaches.$inferSelect)[] = await db
      .select({
        id: inscriptionCoaches.id,
        inscriptionId: inscriptionCoaches.inscriptionId,
        firstName: inscriptionCoaches.firstName,
        lastName: inscriptionCoaches.lastName,
        team: inscriptionCoaches.team,
        gender: inscriptionCoaches.gender,
        startDate: inscriptionCoaches.startDate,
        endDate: inscriptionCoaches.endDate,
        whatsappPhone: inscriptionCoaches.whatsappPhone,
        addedBy: inscriptionCoaches.addedBy,
        createdAt: inscriptionCoaches.createdAt,
        deletedAt: inscriptionCoaches.deletedAt,
      })
      .from(inscriptionCoaches)
      .where(
        selectNotDeleted(
          inscriptionCoaches,
          eq(inscriptionCoaches.inscriptionId, inscriptionId)
        )
      );

    // Get unique user IDs for email lookup
    const uniqueUserIds = Array.from(
      new Set(coaches.map((c) => c.addedBy))
    ).filter((id) => !!id && id !== "Unknown");

    const userEmailMap: Record<string, string> = {};
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        const safeUserId = typeof userId === "string" ? userId : String(userId);
        if (!safeUserId || safeUserId === "Unknown") return;
        try {
          const user = await clerkClient.users.getUser(safeUserId);
          const email = user?.emailAddresses?.[0]?.emailAddress;
          if (email) {
            userEmailMap[safeUserId] = email;
          }
          // Si pas d'email, on ne met rien dans le map, le fallback s'occupera du reste
        } catch (error) {
          console.warn(`Failed to fetch user ${safeUserId} from Clerk:`, error);
          // On ne met rien dans le map en cas d'erreur, le fallback affichera "-"
        }
      })
    );

    // Add email to each coach
    const result = coaches.map((coach) => {
      const addedByKey = String(coach.addedBy ?? "");
      return {
        ...coach,
        addedByEmail: userEmailMap[addedByKey] || "-",
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return NextResponse.json({error: "Failed to fetch coaches"}, {status: 500});
  }
}

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const { inscriptions, inscriptionCoaches } = getDbTables();
    const {userId} = getAuth(req);
    const {id} = await params;
    const inscriptionId = Number(id);

    if (!inscriptionId) {
      return NextResponse.json({error: "Missing inscriptionId"}, {status: 400});
    }

    if (!userId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    let body: {
      firstName?: string;
      lastName?: string;
      team?: string;
      gender?: "M" | "W" | "BOTH";
      startDate?: string;
      endDate?: string;
      whatsappPhone?: string;
    } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const {firstName, lastName, team, gender, startDate, endDate, whatsappPhone} = body;
    if (
      !firstName ||
      !lastName ||
      !gender ||
      !startDate ||
      !endDate ||
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof gender !== "string" ||
      typeof startDate !== "string" ||
      typeof endDate !== "string" ||
      firstName.trim().length === 0 ||
      lastName.trim().length === 0 ||
      startDate.trim().length === 0 ||
      endDate.trim().length === 0 ||
      !["M", "W", "BOTH"].includes(gender)
    ) {
      return NextResponse.json(
        {error: "First name, last name, gender, start date and end date are required"},
        {status: 400}
      );
    }

    // Check if inscription exists
    const inscriptionExists = await db
      .select()
      .from(inscriptions)
      .where(eq(inscriptions.id, inscriptionId))
      .limit(1);

    if (!inscriptionExists.length) {
      return NextResponse.json({error: "Inscription not found"}, {status: 404});
    }

    // Validation des dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json({error: "Invalid date format"}, {status: 400});
    }

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        {error: "Start date must be before end date"},
        {status: 400}
      );
    }

    // Vérifier les dates par rapport à l'événement
    const inscription = inscriptionExists[0];
    const eventStartDate = new Date(inscription.eventData.startDate);
    const eventEndDate = new Date(inscription.eventData.endDate);

    if (startDateObj < eventStartDate) {
      return NextResponse.json(
        {error: "Start date cannot be before event start date"},
        {status: 400}
      );
    }

    if (endDateObj > eventEndDate) {
      return NextResponse.json(
        {error: "End date cannot be after event end date"},
        {status: 400}
      );
    }

    // Insert new coach
    const newCoach = await db
      .insert(inscriptionCoaches)
      .values({
        inscriptionId: inscriptionId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        team: team?.trim() || null,
        gender: gender as "M" | "W" | "BOTH",
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        whatsappPhone: whatsappPhone?.trim() || null,
        addedBy: userId,
      })
      .returning();

    return NextResponse.json(newCoach[0]);
  } catch (error) {
    console.error("Error adding coach:", error);
    return NextResponse.json({error: "Failed to add coach"}, {status: 500});
  }
}

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{id: string}>}
) {
  try {
    const { inscriptionCoaches } = getDbTables();
    const {id} = await params;
    const inscriptionId = Number(id);

    if (!inscriptionId) {
      return NextResponse.json({error: "Missing inscriptionId"}, {status: 400});
    }

    let body: {coachId?: number} = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({error: "Invalid JSON body"}, {status: 400});
    }

    const {coachId} = body;
    if (!coachId || typeof coachId !== "number") {
      return NextResponse.json({error: "Coach ID is required"}, {status: 400});
    }

    // Soft delete the coach
    const deleted = await softDelete(
      inscriptionCoaches,
      and(
        eq(inscriptionCoaches.inscriptionId, inscriptionId),
        eq(inscriptionCoaches.id, coachId)
      )
    );

    if (!deleted.length) {
      return NextResponse.json({error: "Coach not found"}, {status: 404});
    }

    return NextResponse.json({deleted: deleted[0]});
  } catch (error) {
    console.error("Error deleting coach:", error);
    return NextResponse.json({error: "Failed to delete coach"}, {status: 500});
  }
}
