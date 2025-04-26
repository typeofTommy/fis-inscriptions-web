"use client";

import React, {useState} from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import AddCompetitorModal from "./AddCompetitorModal";

import {aCompetitor} from "@/drizzle/schemaFis";
import {format} from "date-fns";

export const Competitors = ({
  codex,
}: {
  codex?: {number: string; discipline: string; sex: string; raceLevel: string};
}) => {
  const [competitors, setCompetitors] = useState<
    (typeof aCompetitor.$inferSelect)[]
  >([]);

  const handleAddCompetitor = (competitor: typeof aCompetitor.$inferSelect) => {
    setCompetitors((prev) => [...prev, competitor]);
  };

  if (!competitors?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p>Aucun compétiteur présent pour cette inscription pour le moment</p>
        <AddCompetitorModal onAdd={handleAddCompetitor} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <AddCompetitorModal onAdd={handleAddCompetitor} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Sexe</TableHead>
            <TableHead>Date de naissance</TableHead>
            <TableHead>Nation</TableHead>
            <TableHead>Club</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(competitors || []).map((c) => (
            <TableRow key={c.competitorid}>
              <TableCell>{c.lastname}</TableCell>
              <TableCell>{c.firstname}</TableCell>
              <TableCell>{c.gender}</TableCell>
              <TableCell>
                {c.birthdate ? format(new Date(c.birthdate), "dd/MM/yyyy") : ""}
              </TableCell>
              <TableCell>{c.nationcode}</TableCell>
              <TableCell>{c.skiclub}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
