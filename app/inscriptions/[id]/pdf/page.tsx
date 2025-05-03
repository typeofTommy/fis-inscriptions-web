// pages/pdf-template.tsx
import {Inscription} from "@/app/types";
import React from "react";
import {Header} from "./components/Header";
import {CompetitionBlock} from "./components/CompetitionBlock";
import {DateOfRaceBlock} from "./components/DateOfRaceBlock";
import {ResponsibleForEntryBlock} from "./components/ResponsibleForEntryBlock";
import {NationalAssociationBlock} from "./components/NationalAssociationBlock";
import {GenderRow} from "./components/GenderRow";
import {CompetitorsTable} from "./components/CompetitorsTable/CompetitorsTable";
import {TableFooter} from "./components/CompetitorsTable/TableFooter";
import {Footer} from "./components/Footer";

export default async function PdfPage({
  params,
}: {
  params: Promise<{id: string}>;
}) {
  const {id} = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const inscription: Inscription = await fetch(
    `${baseUrl}/api/inscriptions/${id}`
  ).then((res) => res.json());

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white">
      <Header />
      <div className="border border-black">
        {/* Competition and Date Row */}
        <div className="flex border-b border-black">
          <CompetitionBlock />
          <DateOfRaceBlock />
        </div>
        {/* Responsible and Category Row */}
        <div className="flex border-b border-black">
          <ResponsibleForEntryBlock />
          <NationalAssociationBlock />
        </div>
        <GenderRow />
        <CompetitorsTable />
        <TableFooter />
      </div>
      <Footer />
    </div>
  );
}
