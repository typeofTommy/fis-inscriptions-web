// pages/pdf-template.tsx
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
  stations,
  competitors as competitorsTable,
} from "@/drizzle/schemaInscriptions";
import {db} from "@/app/db/inscriptionsDB";
import {eq} from "drizzle-orm";

export default async function PdfPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = await params;
  const [inscription] = await db
    .select()
    .from(inscriptions)
    .where(eq(inscriptions.id, Number(id)))
    .limit(1);

  const station = await db
    .select()
    .from(stations)
    .where(eq(stations.id, inscription.location || 0))
    .limit(1);

  const countryCode = await fetch(
    `https://restcountries.com/v3.1/name/${station[0].country}`
  ).then((res) => res.json());

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

  const raceGender = competitors[0].gender;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white">
      <Header />
      <div className="border border-black">
        {/* Competition and Date Row */}
        <div className="flex border-b border-black">
          <CompetitionBlock
            station={
              station[0].name[0].toUpperCase() + station[0].name.slice(1) || ""
            }
            countryTrigram={countryCode[0].cioc.toUpperCase() || ""}
            flag={countryCode[0].flags.svg || ""}
          />
          <DateOfRaceBlock
            startDate={format(inscription.firstRaceDate, "dd/MM/yyyy")}
            endDate={format(inscription.lastRaceDate, "dd/MM/yyyy")}
          />
        </div>
        {/* Responsible and Category Row */}
        <div className="flex border-b border-black">
          <ResponsibleForEntryBlock />
          <NationalAssociationBlock />
        </div>
        <GenderRow gender={raceGender === "M" ? "M" : "W"} />
        <CompetitorsTable
          competitors={competitors}
          codexData={inscription.codexData}
        />
        <TableFooter
          competitorLength={
            new Set(competitors.map((c) => c.competitorid)).size
          }
        />
      </div>
      <Footer />
    </div>
  );
}
