import {NextResponse} from "next/server";
import {db} from "@/app/db/inscriptionsDB";
import {getDbTables} from "@/app/lib/getDbTables";
import {desc} from "drizzle-orm";
import {selectNotDeleted} from "@/lib/soft-delete";
import {InscriptionCoach} from "@/app/types";

const formatName = (name: string) => {
  if (!name) return "";
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

export const GET = async () => {
  try {
    const { inscriptionCoaches } = getDbTables();
    const coaches = await db
      .select({
        firstName: inscriptionCoaches.firstName,
        lastName: inscriptionCoaches.lastName,
        team: inscriptionCoaches.team,
        whatsappPhone: inscriptionCoaches.whatsappPhone,
      })
      .from(inscriptionCoaches)
      .where(selectNotDeleted(inscriptionCoaches))
      .orderBy(desc(inscriptionCoaches.createdAt))
      .limit(50);

    type SimpleCoach = Pick<
      InscriptionCoach,
      "firstName" | "lastName" | "team" | "whatsappPhone"
    >;

    const uniqueCoaches: Map<string, SimpleCoach> = coaches.reduce(
      (acc: Map<string, SimpleCoach>, coach: SimpleCoach) => {
        const key = `${coach.firstName.toLowerCase()}-${coach.lastName.toLowerCase()}`;
        if (!acc.has(key)) {
          acc.set(key, {
            firstName: formatName(coach.firstName),
            lastName: formatName(coach.lastName),
            team: coach.team,
            whatsappPhone: coach.whatsappPhone,
          });
        }
        return acc;
      },
      new Map()
    );

    const sortedCoaches = Array.from(uniqueCoaches.values()).sort((a, b) =>
      a.lastName.localeCompare(b.lastName)
    );

    return NextResponse.json(sortedCoaches);
  } catch (error) {
    console.error("Erreur lors de la récupération des coachs:", error);
    return NextResponse.json(
      {error: "Erreur lors de la récupération des coachs"},
      {status: 500}
    );
  }
};
