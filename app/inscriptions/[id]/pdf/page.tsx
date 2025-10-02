import React from "react";
import {Header} from "./components/Header";
import {CompetitionBlock} from "./components/CompetitionBlock";
import {DateOfRaceBlock} from "./components/DateOfRaceBlock";
import {ResponsibleForEntryBlock} from "./components/ResponsibleForEntryBlock";
import {NationalAssociationBlock} from "./components/NationalAssociationBlock";
import {GenderRow} from "./components/GenderRow";
import {TableFooter} from "./components/CompetitorsTable/TableFooter";
import {Footer} from "./components/Footer";
import {CompetitorsTable} from "./components/CompetitorsTable/CompetitorsTable";
import {CoachesBlock} from "./components/CoachesBlock";
import {format} from "date-fns";
import {getDbTables} from "@/app/lib/getDbTables";
import {db} from "@/app/db/inscriptionsDB";
import {eq} from "drizzle-orm";
import {selectNotDeleted} from "@/lib/soft-delete";
import {RecipientManager, Recipient} from "./components/RecipientManager";
import {clerkClient, auth} from "@clerk/nextjs/server";
import type {User} from "@clerk/nextjs/server";
import type {Competition, CompetitionItem} from "@/app/types";
import {getGenderStatus} from "@/app/lib/genderStatus";
import {getTranslations} from "next-intl/server";
import {getOrganization} from "@/app/lib/getUserOrganization";

// Define more specific types based on common Clerk structures
// You should ideally import these or more accurate types from Clerk packages
type AuthObject = {userId: string | null; [key: string]: unknown}; // Basic Auth object type
// type ClerkEmailAddress = {id: string; emailAddress: string; [key: string]: any}; // Removed unused type

export default async function PdfPage({
  params,
  searchParams,
}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{gender?: "M" | "W"}>;
}) {
  const t = await getTranslations("inscriptionDetail.pdf.recipientManager");
  const tInscription = await getTranslations("inscriptionDetail");
  const { inscriptions, inscriptionCoaches, inscriptionCompetitors, competitors: competitorsTable } = getDbTables();
  const {id} = await params;
  const {gender: selectedGender} = await searchParams;

  const [inscription] = await db
    .select()
    .from(inscriptions)
    .where(eq(inscriptions.id, Number(id)))
    .limit(1);

  // Ensure inscription and eventData exist
  if (!inscription) {
    return <p>{tInscription("inscriptionNotFound")}</p>;
  }
  if (!inscription.eventData) {
    return <p>{tInscription("eventDataNotFound")}</p>;
  }
  const eventData = inscription.eventData as Competition;

  // Fetch organization config
  const organization = await getOrganization();

  // Fetch coaches for this inscription
  const coaches = await db
    .select({
      id: inscriptionCoaches.id,
      firstName: inscriptionCoaches.firstName,
      lastName: inscriptionCoaches.lastName,
      team: inscriptionCoaches.team,
      gender: inscriptionCoaches.gender,
      startDate: inscriptionCoaches.startDate,
      endDate: inscriptionCoaches.endDate,
    })
    .from(inscriptionCoaches)
    .where(
      selectNotDeleted(
        inscriptionCoaches,
        eq(inscriptionCoaches.inscriptionId, Number(id))
      )
    );

  // Typage explicite du résultat de l'innerJoin
  type RawCompetitorRow = {
    competitors: typeof competitorsTable.$inferSelect;
    inscriptionCompetitors: typeof inscriptionCompetitors.$inferSelect;
  };
  const rawCompetitors = (await db
    .select({
      competitors: competitorsTable,
      inscriptionCompetitors: inscriptionCompetitors,
    })
    .from(inscriptionCompetitors)
    .where(
      selectNotDeleted(
        inscriptionCompetitors,
        eq(inscriptionCompetitors.inscriptionId, Number(id))
      )
    )
    .innerJoin(
      competitorsTable,
      eq(inscriptionCompetitors.competitorId, competitorsTable.competitorid)
    )) as RawCompetitorRow[];

  // Construire un mapping competitorid -> [codexNumber]
  const codexMap: Record<number, string[]> = {};
  rawCompetitors.forEach((row) => {
    const competitorid = row.competitors.competitorid;
    const codexNumber = row.inscriptionCompetitors.codexNumber;
    if (!codexMap[competitorid]) codexMap[competitorid] = [];
    codexMap[competitorid].push(codexNumber);
  });

  // Enrichir chaque compétiteur avec ses codexNumbers
  const competitors = Array.from(
    new Map(
      rawCompetitors.map((row) => [
        row.competitors.competitorid,
        {
          ...row.competitors,
          codexNumbers: codexMap[row.competitors.competitorid] || [],
        },
      ])
    ).values()
  );

  // Filter competitors by selected gender if provided
  const filteredCompetitors = selectedGender
    ? competitors.filter((c) => c.gender === selectedGender)
    : competitors;

  const raceGender: "M" | "W" = selectedGender
    ? selectedGender
    : filteredCompetitors.length > 0
      ? (filteredCompetitors[0].gender as "M" | "W")
      : "M";

  // Filter coaches by gender - show coaches for this gender or coaches for "both"
  const filteredCoaches = coaches.filter((coach: typeof coaches[0]) => 
    coach.gender === "BOTH" || coach.gender === raceGender
  );

  // Filter codexData based on raceGender
  // Assuming CompetitionItem has a genderCode property ('M' or 'W')
  const filteredCodexData = inscription.eventData.competitions.filter(
    (codexItem: CompetitionItem) => {
      // If genderCode is not present, or if it matches raceGender, include it.
      // This handles cases where a competition might be for both genders or gender is not specified.
      // Adjust this logic if CompetitionItem structure is different or strict filtering is needed.
      return !codexItem.genderCode || codexItem.genderCode === raceGender;
    }
  );

  // --- Fetch user details from Clerk ---
  const authResult: AuthObject = await auth();
  const currentClerkUserId = authResult.userId;
  const allUserIdsToFetch: string[] = [];

  if (inscription.createdBy) {
    allUserIdsToFetch.push(inscription.createdBy);
  }
  if (currentClerkUserId) {
    allUserIdsToFetch.push(currentClerkUserId);
  }

  // Filter modifier IDs based on filtered competitors (by gender)
  const modifierClerkIds = rawCompetitors
    .filter((row) => 
      // Only include rows where the competitor is in the filtered list
      filteredCompetitors.some(fc => fc.competitorid === row.competitors.competitorid)
    )
    .map((row) => row.inscriptionCompetitors.addedBy)
    .filter((id): id is string => !!id); // Ensure ids are strings and not null/undefined

  allUserIdsToFetch.push(...modifierClerkIds);
  const uniqueUserIdsToFetch = Array.from(new Set(allUserIdsToFetch));

  const clerkUsersMap: Map<string, User> = new Map();
  if (uniqueUserIdsToFetch.length > 0) {
    try {
      const client = await clerkClient();
      const usersResponse = await client.users.getUserList({
        userId: uniqueUserIdsToFetch,
      });
      usersResponse.data.forEach((user: User) => {
        clerkUsersMap.set(user.id, user);
      });
    } catch (error) {
      console.error("Error fetching users from Clerk:", error);
    }
  }
  // --- End fetching user details ---

  // Prepare recipient list using Clerk data
  const recipients: Recipient[] = [];

  // Helper function to get user details or fallbacks
  const getUserDetails = (
    clerkId: string | null | undefined,
    reason: string
  ): Recipient => {
    if (!clerkId) {
      return {
        name: t("reasons.unknownUser"),
        surname: "",
        email: t("reasons.noId"),
        reason,
        isResolvable: false,
      };
    }
    const user = clerkUsersMap.get(clerkId);
    if (!user) {
      return {
        name: t("reasons.unknownUser"),
        surname: "",
        email: `ID: ${clerkId}`,
        reason,
        isResolvable: false,
      };
    }

    let primaryEmail = t("unknownEmail");
    let hasValidEmail = false;
    if (
      user.emailAddresses &&
      Array.isArray(user.emailAddresses) &&
      user.emailAddresses.length > 0
    ) {
      const primaryEmailObject = user.emailAddresses.find(
        (ea) => ea.id === user.primaryEmailAddressId
      );
      const foundEmail =
        primaryEmailObject?.emailAddress ||
        user.emailAddresses[0]?.emailAddress;
      if (foundEmail) {
        primaryEmail = foundEmail;
        hasValidEmail = true;
      } else {
        primaryEmail = t("notPrimaryEmail");
      }
    }

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user.username || t("unknownName");

    return {
      name: displayName,
      surname: "",
      email: primaryEmail,
      reason,
      isResolvable: hasValidEmail,
    };
  };

  // Event Creator
  if (inscription.createdBy) {
    const creatorDetails = getUserDetails(
      inscription.createdBy,
      t("reasons.eventCreator")
    );
    recipients.push(creatorDetails);
  } else {
    recipients.push({
      name: t("reasons.unknownUser"),
      surname: "",
      email: t("reasons.noId"),
      reason: t("reasons.eventCreator"),
      isResolvable: false,
    });
  }

  // Current User
  if (currentClerkUserId) {
    const currentUserDetails = getUserDetails(
      currentClerkUserId,
      t("reasons.currentUser")
    );
    // Avoid adding if already added as creator (check by ID if possible, or by resolved email if IDs were different)
    const creatorId = inscription.createdBy;
    if (
      !(
        creatorId &&
        creatorId === currentClerkUserId &&
        currentUserDetails.isResolvable
      )
    ) {
      recipients.push(currentUserDetails);
    }
  } else {
    // No current user, but we expect a slot for it, make it unresolvable
    recipients.push({
      name: t("reasons.unknownUser"),
      surname: "",
      email: t("notConnected"),
      reason: t("reasons.currentUser"),
      isResolvable: false,
    });
  }

  // Modifiers
  const uniqueModifierClerkIds = Array.from(new Set(modifierClerkIds));
  uniqueModifierClerkIds.forEach((clerkId) => {
    const modifierDetails = getUserDetails(
      clerkId,
      t("reasons.addedCompetitors")
    );
    // Avoid adding duplicates - check if this clerkId was already added as creator or current user
    const creatorId = inscription.createdBy;
    const currentUserId = currentClerkUserId;

    const isCreator = creatorId === clerkId;
    const isCurrentUser = currentUserId === clerkId;

    if (!isCreator && !isCurrentUser) {
      recipients.push(modifierDetails);
    } else if (
      isCreator &&
      !recipients.find(
        (r) =>
          r.reason === t("reasons.eventCreator") &&
          r.email === modifierDetails.email
      )
    ) {
      recipients.push(modifierDetails);
    } else if (
      isCurrentUser &&
      !recipients.find(
        (r) =>
          r.reason === t("reasons.currentUser") &&
          r.email === modifierDetails.email
      )
    ) {
      recipients.push(modifierDetails);
    }
  });

  // Ajout du destinataire spécifique à l'event (emailEntries ou fallback sur emailGeneral)
  let eventContactEmail = null;
  if (
    eventData?.contactInformation?.emailEntries &&
    typeof eventData.contactInformation.emailEntries === "string" &&
    eventData.contactInformation.emailEntries.trim() !== ""
  ) {
    eventContactEmail = eventData.contactInformation.emailEntries.trim();
  } else if (
    eventData?.contactInformation?.emailGeneral &&
    typeof eventData.contactInformation.emailGeneral === "string" &&
    eventData.contactInformation.emailGeneral.trim() !== ""
  ) {
    eventContactEmail = eventData.contactInformation.emailGeneral.trim();
  }
  if (eventContactEmail) {
    // On évite les doublons d'email
    const alreadyPresent = recipients.some(
      (r) => r.email.toLowerCase() === eventContactEmail.toLowerCase()
    );
    if (!alreadyPresent) {
      recipients.push({
        name: t("reasons.competitionContact"),
        surname: "",
        email: eventContactEmail,
        reason: t("reasons.eventContact"),
        isResolvable: true,
      });
    }
  }

  const finalRecipientsMap = new Map<string, Recipient>();

  recipients.forEach((rec) => {
    const key = `${rec.email}-${rec.reason}`; // A more unique key for role + email
    const existing = finalRecipientsMap.get(key);
    if (!existing || (existing && !existing.isResolvable && rec.isResolvable)) {
      // Add if new, or if current is resolvable and existing was not
      finalRecipientsMap.set(key, rec);
    } else if (existing && existing.isResolvable && !rec.isResolvable) {
      // Don't overwrite a resolvable entry with an unresolvable one
    } else if (existing && existing.isResolvable && rec.isResolvable) {
      // Both resolvable, could be a duplicate from modifiers list if user is also creator/current. Prefer first one added by role.
      // Current logic for adding creator/current/modifier mostly handles this by checking before push.
    }
  });

  const uniqueRecipients = Array.from(finalRecipientsMap.values()).sort(
    (a, b) => {
      // Optional: Sort by reason or resolvability first if desired
      return (
        a.name.localeCompare(b.name) ||
        (a.surname || "").localeCompare(b.surname || "")
      );
    }
  );

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white">
      <div id="pdf-content" className="bg-white w-[21cm] mx-auto">
        <Header />
        <div className="border-2 border-black">
          {/* Competition and Date Row */}
          <div className="flex border-b border-black">
            <CompetitionBlock
              station={
                inscription.eventData.place
                  ? inscription.eventData.place[0].toUpperCase() +
                    inscription.eventData.place.slice(1)
                  : ""
              }
              countryTrigram={
                inscription.eventData.placeNationCode?.toUpperCase() || ""
              }
            />
            <DateOfRaceBlock
              startDate={format(inscription.eventData.startDate, "dd/MM/yyyy")}
              endDate={format(inscription.eventData.endDate, "dd/MM/yyyy")}
            />
          </div>
          {/* Responsible and Category Row */}
          <div className="flex border-b border-black">
            <ResponsibleForEntryBlock gender={raceGender} organization={organization} />
            <NationalAssociationBlock organization={organization} />
          </div>
          <GenderRow gender={raceGender === "M" ? "M" : "W"} />
          <CompetitorsTable
            competitors={filteredCompetitors}
            codexData={filteredCodexData}
          />
          {filteredCoaches.length > 0 && <CoachesBlock coaches={filteredCoaches} />}
          <TableFooter gender={raceGender} organization={organization} />
        </div>
        <Footer />
      </div>

      <RecipientManager
        initialRecipients={uniqueRecipients}
        gender={raceGender}
        inscriptionId={id}
        emailSentAt={getGenderStatus(inscription, raceGender).emailSentAt}
        eventData={eventData}
      />
    </div>
  );
}
