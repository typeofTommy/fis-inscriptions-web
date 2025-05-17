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
import {format} from "date-fns";
import {
  inscriptionCompetitors,
  inscriptions,
  competitors as competitorsTable,
} from "@/drizzle/schemaInscriptions";
import {db} from "@/app/db/inscriptionsDB";
import {eq} from "drizzle-orm";
import {RecipientManager, Recipient} from "./components/RecipientManager";
import {clerkClient, auth} from "@clerk/nextjs/server";
import type {User} from "@clerk/nextjs/server";

// Define more specific types based on common Clerk structures
// You should ideally import these or more accurate types from Clerk packages
type AuthObject = {userId: string | null; [key: string]: any}; // Basic Auth object type
// type ClerkEmailAddress = {id: string; emailAddress: string; [key: string]: any}; // Removed unused type

export default async function PdfPage({
  params,
  searchParams,
}: {
  params: Promise<{id: string}>;
  searchParams: Promise<{gender?: "M" | "W"}>;
}) {
  const {id} = await params;
  const {gender: selectedGender} = await searchParams;

  const [inscription] = await db
    .select()
    .from(inscriptions)
    .where(eq(inscriptions.id, Number(id)))
    .limit(1);

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
    .where(eq(inscriptionCompetitors.inscriptionId, Number(id)))
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

  // Filter codexData based on raceGender
  // Assuming CompetitionItem has a genderCode property ('M' or 'W')
  const filteredCodexData = inscription.eventData.competitions.filter(
    (codexItem: any) => {
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

  const modifierClerkIds = rawCompetitors
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
        name: "Utilisateur inconnu",
        surname: "",
        email: "ID non fourni",
        reason,
        isResolvable: false,
      };
    }
    const user = clerkUsersMap.get(clerkId);
    if (!user) {
      return {
        name: "Utilisateur inconnu",
        surname: "",
        email: `ID: ${clerkId}`,
        reason,
        isResolvable: false,
      };
    }

    let primaryEmail = "Email inconnu";
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
        primaryEmail = "Email non principal introuvable";
      }
    }

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user.username || "Nom inconnu";

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
      "Créateur de l'événement"
    );
    recipients.push(creatorDetails);
  } else {
    recipients.push({
      name: "Utilisateur inconnu",
      surname: "",
      email: "ID non fourni",
      reason: "Créateur de l'événement",
      isResolvable: false,
    });
  }

  // Current User
  if (currentClerkUserId) {
    const currentUserDetails = getUserDetails(
      currentClerkUserId,
      "Utilisateur actuel de la page"
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
      name: "Utilisateur inconnu",
      surname: "",
      email: "Non connecté",
      reason: "Utilisateur actuel de la page",
      isResolvable: false,
    });
  }

  // Modifiers
  const uniqueModifierClerkIds = Array.from(new Set(modifierClerkIds));
  uniqueModifierClerkIds.forEach((clerkId) => {
    const modifierDetails = getUserDetails(
      clerkId,
      "A ajouté des compétiteurs"
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
          r.reason === "Créateur de l'événement" &&
          r.email === modifierDetails.email
      )
    ) {
      recipients.push(modifierDetails);
    } else if (
      isCurrentUser &&
      !recipients.find(
        (r) =>
          r.reason === "Utilisateur actuel de la page" &&
          r.email === modifierDetails.email
      )
    ) {
      recipients.push(modifierDetails);
    }
  });

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

  const handleSendPdf = async (selectedEmails: string[]) => {
    "use server";
    // TODO: Implement PDF sending logic with selectedEmails
    console.log("A IMPLEMENTER: Envoi du PDF aux emails:", selectedEmails);
    // alert() is a browser API and not available in server actions.
    // If feedback to the client is needed, return a value from the action and handle it in the client component.
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white">
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
          <ResponsibleForEntryBlock gender={raceGender} />
          <NationalAssociationBlock />
        </div>
        <GenderRow gender={raceGender === "M" ? "M" : "W"} />
        <CompetitorsTable
          competitors={filteredCompetitors}
          codexData={filteredCodexData}
        />
        <TableFooter gender={raceGender} />
      </div>
      <Footer />

      <RecipientManager
        initialRecipients={uniqueRecipients}
        onSendPdf={handleSendPdf}
      />
    </div>
  );
}
