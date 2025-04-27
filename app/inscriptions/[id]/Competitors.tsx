"use client";

import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {format} from "date-fns";
import {useQuery} from "@tanstack/react-query";

function useInscriptionCompetitors(inscriptionId: string, codexNumber: string) {
  return useQuery({
    queryKey: ["inscription-competitors", inscriptionId, codexNumber],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors?codexNumber=${codexNumber}`
      );
      if (!res.ok) throw new Error("Erreur lors du chargement des coureurs");
      return res.json();
    },
  });
}

export const Competitors = ({
  inscriptionId,
  codexNumber,
}: {
  inscriptionId: string;
  codexNumber: string;
}) => {
  const {
    data: competitors = [],
    isLoading,
    error,
  } = useInscriptionCompetitors(inscriptionId, codexNumber);

  if (isLoading) {
    return <div>Chargement des compétiteurs...</div>;
  }
  if (error) {
    return <div>Erreur lors du chargement des compétiteurs.</div>;
  }

  if (!competitors?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p>Aucun compétiteur présent pour ce codex pour le moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          {(competitors || []).map((c: typeof competitors.$inferSelect) => (
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
