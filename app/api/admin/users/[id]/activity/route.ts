import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { 
  inscriptions, 
  inscriptionCompetitors, 
  inscriptionCoaches,
  competitors
} from "@/drizzle/schemaInscriptions";

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

const db = drizzle(pool);

export const GET = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    
    // Vérifier que l'utilisateur connecté est admin
    const currentUser = await client.users.getUser(userId);
    if (currentUser.publicMetadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: targetUserId } = await params;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Récupérer les inscriptions créées par cet utilisateur
    const userInscriptionsRaw = await db
      .select({
        id: inscriptions.id,
        eventId: inscriptions.eventId,
        eventData: inscriptions.eventData,
        status: inscriptions.status,
        createdAt: inscriptions.createdAt,
      })
      .from(inscriptions)
      .where(
        and(
          eq(inscriptions.createdBy, targetUserId),
          isNull(inscriptions.deletedAt),
          gte(inscriptions.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(inscriptions.createdAt))
      .limit(20);

    // Récupérer les compétiteurs ajoutés par cet utilisateur
    const addedCompetitorsRaw = await db
      .select({
        id: inscriptionCompetitors.id,
        inscriptionId: inscriptionCompetitors.inscriptionId,
        competitorId: inscriptionCompetitors.competitorId,
        codexNumber: inscriptionCompetitors.codexNumber,
        createdAt: inscriptionCompetitors.createdAt,
        eventData: inscriptions.eventData,
        // Infos du compétiteur
        competitorFirstName: competitors.firstname,
        competitorLastName: competitors.lastname,
        competitorNation: competitors.nationcode,
        competitorFisCode: competitors.fiscode,
      })
      .from(inscriptionCompetitors)
      .innerJoin(inscriptions, eq(inscriptions.id, inscriptionCompetitors.inscriptionId))
      .innerJoin(competitors, eq(competitors.competitorid, inscriptionCompetitors.competitorId))
      .where(
        and(
          eq(inscriptionCompetitors.addedBy, targetUserId),
          isNull(inscriptionCompetitors.deletedAt),
          isNull(inscriptions.deletedAt),
          gte(inscriptionCompetitors.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(inscriptionCompetitors.createdAt))
      .limit(20);

    // Récupérer les coaches ajoutés par cet utilisateur
    const addedCoachesRaw = await db
      .select({
        id: inscriptionCoaches.id,
        inscriptionId: inscriptionCoaches.inscriptionId,
        firstName: inscriptionCoaches.firstName,
        lastName: inscriptionCoaches.lastName,
        team: inscriptionCoaches.team,
        gender: inscriptionCoaches.gender,
        createdAt: inscriptionCoaches.createdAt,
        eventData: inscriptions.eventData,
      })
      .from(inscriptionCoaches)
      .innerJoin(inscriptions, eq(inscriptions.id, inscriptionCoaches.inscriptionId))
      .where(
        and(
          eq(inscriptionCoaches.addedBy, targetUserId),
          isNull(inscriptionCoaches.deletedAt),
          isNull(inscriptions.deletedAt),
          gte(inscriptionCoaches.createdAt, thirtyDaysAgo)
        )
      )
      .orderBy(desc(inscriptionCoaches.createdAt))
      .limit(20);

    // Ajouter le type aux résultats
    const userInscriptions = userInscriptionsRaw.map(item => ({ ...item, type: "inscription" as const }));
    const addedCompetitors = addedCompetitorsRaw.map(item => ({ ...item, type: "competitor" as const }));
    const addedCoaches = addedCoachesRaw.map(item => ({ ...item, type: "coach" as const }));

    // Combiner et trier toutes les activités par date
    const allActivities = [
      ...userInscriptions,
      ...addedCompetitors,
      ...addedCoaches,
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }).slice(0, 20);

    // Calculer les statistiques
    const stats = {
      inscriptionsCount: userInscriptions.length,
      competitorsCount: addedCompetitors.length,
      coachesCount: addedCoaches.length,
      totalActivities: allActivities.length,
    };

    return NextResponse.json({
      activities: allActivities,
      stats,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};