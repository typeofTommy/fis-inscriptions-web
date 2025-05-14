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
import type {UserJSON, User} from "@clerk/nextjs/server";

// Define more specific types based on common Clerk structures
// You should ideally import these or more accurate types from Clerk packages
type AuthObject = {userId: string | null; [key: string]: any}; // Basic Auth object type
// type ClerkEmailAddress = {id: string; emailAddress: string; [key: string]: any}; // Removed unused type
// Use UserJSON or a similar detailed type from Clerk if available
type ClerkUser = UserJSON; // This is used for the Map value type, ensure it's compatible with `User` from SDK

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

  const raceGender = selectedGender
    ? selectedGender
    : filteredCompetitors.length > 0
    ? filteredCompetitors[0].gender
    : "M";

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

  const clerkUsersMap: Map<string, ClerkUser> = new Map();
  if (uniqueUserIdsToFetch.length > 0) {
    try {
      const client = await clerkClient();
      const usersResponse = await client.users.getUserList({
        userId: uniqueUserIdsToFetch,
      });
      // Access the data property and use the more specific User type from Clerk SDK if available
      usersResponse.data.forEach((user: User) => {
        // Assuming User type is compatible enough with UserJSON for the map's value
        // or you might need to transform `user` to `UserJSON` if `clerkUsersMap` strictly expects `UserJSON`
        clerkUsersMap.set(user.id, user as unknown as UserJSON); // Casting if types are not directly assignable but structurally compatible for map
      });
    } catch (error) {
      console.error("Error fetching users from Clerk:", error);
      // Handle error appropriately, maybe fall back to placeholders or skip users
    }
  }
  // --- End fetching user details ---

  // Prepare recipient list using Clerk data
  const recipients: Recipient[] = [];

  // Helper function to get user details or fallbacks
  const getUserDetails = (
    clerkId: string | null | undefined,
    reason: string
  ) => {
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
        email: `ID: ${clerkId}`, // Keep the ID if user not found
        reason,
        isResolvable: false,
      };
    }

    let primaryEmail = "Email inconnu";
    if (
      user.email_addresses &&
      Array.isArray(user.email_addresses) &&
      user.email_addresses.length > 0
    ) {
      const primaryEmailObject = user.email_addresses.find(
        (ea) => ea.id === user.primary_email_address_id
      );
      primaryEmail =
        primaryEmailObject?.email_address ||
        user.email_addresses[0]?.email_address ||
        "Email non principal";
    }

    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      name: fullName || "Nom inconnu", // If both names are empty
      surname: "", // Combined into name
      email: primaryEmail,
      reason,
      isResolvable: true, // User was found
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
    const modifierDetails = getUserDetails(clerkId, "A modifié l'inscription");
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
      // It's the creator but wasn't added yet (e.g. inscription.createdBy was null but modifier list has them)
      // This case is less likely if inscription.createdBy is mandatory and correct
      // OR if the initial creator entry was marked unresolvable and this one is resolvable, we might want to replace/update.
      // For simplicity, we add if not found by specific role+email. A more robust merge could be done.
      recipients.push(modifierDetails);
    } else if (
      isCurrentUser &&
      !recipients.find(
        (r) =>
          r.reason === "Utilisateur actuel de la page" &&
          r.email === modifierDetails.email
      )
    ) {
      // Similar logic for current user
      recipients.push(modifierDetails);
    }
  });

  // Refine uniqueRecipients logic to handle potential unresolvable entries better
  // If multiple entries for the same "logical" user (e.g. creator ID) exist, prioritize the resolvable one.
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
          <ResponsibleForEntryBlock />
          <NationalAssociationBlock />
        </div>
        <GenderRow gender={raceGender === "M" ? "M" : "W"} />
        <CompetitorsTable
          competitors={filteredCompetitors}
          codexData={inscription.eventData.competitions}
        />
        <TableFooter />
      </div>
      <Footer />

      <RecipientManager
        initialRecipients={uniqueRecipients}
        onSendPdf={handleSendPdf}
      />
    </div>
  );
}
