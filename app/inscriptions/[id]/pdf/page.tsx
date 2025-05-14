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
    defaultName: string,
    defaultSurname: string,
    defaultEmail: string
  ) => {
    if (!clerkId)
      return {name: defaultName, surname: defaultSurname, email: defaultEmail};
    const user = clerkUsersMap.get(clerkId);
    if (!user)
      return {name: defaultName, surname: defaultSurname, email: defaultEmail};

    let primaryEmail = defaultEmail; // Default to defaultEmail

    // Check if email_addresses exists and is an array before calling find
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
        defaultEmail;
    }

    return {
      name: user.first_name || defaultName,
      surname: user.last_name || defaultSurname,
      email: primaryEmail,
    };
  };

  // Event Creator
  if (inscription.createdBy) {
    const creatorDetails = getUserDetails(
      inscription.createdBy,
      "Créateur",
      "Event",
      "creator@example.com"
    );
    recipients.push({
      ...creatorDetails,
      reason: "Créateur de l'événement",
    });
  }

  // Current User
  if (currentClerkUserId) {
    const currentUserDetails = getUserDetails(
      currentClerkUserId,
      "Utilisateur",
      "Actuel",
      "current.user@example.com"
    );
    // Avoid adding if already added as creator
    if (
      !recipients.find(
        (r) =>
          r.email === currentUserDetails.email &&
          r.reason === "Créateur de l'événement"
      )
    ) {
      recipients.push({
        ...currentUserDetails,
        reason: "Utilisateur actuel de la page",
      });
    }
  }

  // Modifiers
  const uniqueModifierClerkIds = Array.from(new Set(modifierClerkIds));
  uniqueModifierClerkIds.forEach((clerkId) => {
    const modifierDetails = getUserDetails(
      clerkId,
      "Modificateur",
      "Inscription",
      `modifier-${clerkId}@example.com`
    );
    // Avoid adding duplicates if a modifier is also the creator or current user
    if (!recipients.find((r) => r.email === modifierDetails.email)) {
      recipients.push({
        ...modifierDetails,
        reason: "A modifié l'inscription",
      });
    }
  });

  // Remove duplicate recipients by email (e.g. if current user is also creator, ensure only one entry, prioritizing more specific role if logic was more complex)
  // The current logic somewhat handles this by checking before pushing, but this is a final safeguard.
  const uniqueRecipients = Array.from(
    new Map(recipients.map((r) => [r.email, r])).values()
  ).sort(
    (a, b) => a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name)
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
