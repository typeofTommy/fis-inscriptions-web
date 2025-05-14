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
    </div>
  );
}
