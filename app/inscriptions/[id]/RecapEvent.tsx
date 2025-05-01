"use client";

import type React from "react";
import {useMemo} from "react";
import {useQuery} from "@tanstack/react-query";
import {useInscription} from "../form/api";
import {Loader2} from "lucide-react";
import type {InscriptionCompetitor} from "@/app/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from "@tanstack/react-table";

// Hook pour récupérer tous les compétiteurs de l'inscription (tous codex)
const useAllInscriptionCompetitors = (inscriptionId: string) => {
  return useQuery<InscriptionCompetitor[]>({
    queryKey: ["inscription-competitors-all", inscriptionId],
    queryFn: async () => {
      const res = await fetch(`/api/inscriptions/${inscriptionId}/competitors`);
      if (!res.ok)
        throw new Error("Erreur lors du chargement des compétiteurs");
      return res.json();
    },
  });
};

interface RecapEventProps {
  inscriptionId: string;
}

// Define a type for the competitor data used in the table
type CompetitorRow = {
  competitorid: number;
  lastname: string;
  firstname: string;
  gender: string;
  pointsByCodex: Record<string, string | number | null>;
};

export const RecapEvent: React.FC<RecapEventProps> = ({inscriptionId}) => {
  const {
    data: inscription,
    isLoading: isLoadingInscription,
    error: errorInscription,
  } = useInscription(inscriptionId);
  const {
    data: competitorsData = [],
    isPending,
    error,
  } = useAllInscriptionCompetitors(inscriptionId);

  // 1. Data Preparation (moved before hooks depending on it)
  // Index competitors by codex for quick lookup in cell renderers
  const competitorsByCodex: Record<string, any[]> = {};
  competitorsData.forEach((entry: any) => {
    competitorsByCodex[entry.codexNumber] = entry.competitors;
  });

  // Create a unique list of competitors with points mapped by codex
  const allCompetitors: CompetitorRow[] = useMemo(() => {
    return Array.from(
      new Map(
        competitorsData
          .flatMap((c: any) => c.competitors)
          .map((c: any) => [
            c.competitorid,
            {
              ...c,
              // Add pointsByCodex map for easy access in cell rendering
              pointsByCodex: competitorsData.reduce((acc: any, entry: any) => {
                const competitorInCodex = entry.competitors.find(
                  (comp: any) => comp.competitorid === c.competitorid
                );
                if (competitorInCodex) {
                  acc[entry.codexNumber] = competitorInCodex.points;
                }
                return acc;
              }, {}),
            },
          ])
      ).values()
    );
  }, [competitorsData]);

  // Safe fallback for codex data
  const codexData = inscription?.codexData ?? [];

  // 2. TanStack Table Columns Definition (for body rows)
  const columnHelper = createColumnHelper<CompetitorRow>();

  const columns = useMemo(
    () => [
      // Column 1: Competitor Name
      columnHelper.accessor((row) => `${row.lastname} ${row.firstname}`, {
        id: "competitorName",
        // Header is rendered manually
        cell: (info) => <span className="font-bold">{info.getValue()}</span>,
      }),
      // Column 2: Gender
      columnHelper.accessor("gender", {
        id: "gender",
        // Header is rendered manually
        cell: (info) => (
          <span className="font-bold italic">
            {info.getValue() === "F" ? "W" : "M"}
          </span>
        ), // Assuming 'F' maps to 'W'
      }),
      // Column 3: Placeholder for "points/disc" label (rendered manually in header)
      // This column data cell will be empty, label is in header
      columnHelper.display({
        id: "pointsLabelPlaceholder",
        // Header rendered manually
        cell: () => null, // No data in this cell column
      }),
      // Columns 4+: Points per Codex
      ...codexData.map((codex: any) =>
        columnHelper.accessor((row) => row.pointsByCodex[codex.number], {
          id: codex.number,
          // Header is rendered manually
          cell: (info) => <span>{info.getValue() ?? "-"}</span>, // Display points or '-'
        })
      ),
    ],
    [codexData, columnHelper] // Dependencies for useMemo
  );

  // 3. TanStack Table Instance
  const table = useReactTable({
    data: allCompetitors, // Use prepared competitor data
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // 4. Loading / Error / Empty States
  if (isLoadingInscription || isPending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Chargement des données...</p>
      </div>
    );
  }
  if (errorInscription || error) {
    return <div>Erreur lors du chargement des données.</div>;
  }
  if (!inscription || !codexData.length) {
    return <div>Aucun codex pour cet évènement.</div>;
  }

  // 5. Render Component
  return (
    <div className="overflow-x-auto">
      {/* Use shadcn Table component for structure */}
      <Table className="border-collapse border border-slate-400">
        {/* Manual Header construction to match the target image */}
        <TableHeader>
          {/* Row 1 & 2: Dates */}
          <TableRow>
            {/* Placeholder cells for Name/Gender/PointsLabel columns */}
            <TableHead
              className="border border-slate-300"
              colSpan={3}
              rowSpan={6}
            />
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-datelabel"}
                className="border border-slate-300 text-center font-bold italic text-sky-400"
              >
                dates
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-dateval"}
                className="border border-slate-300 text-center"
              >
                TODO {/* Replace with actual date if available */}
              </TableHead>
            ))}
          </TableRow>
          {/* Row 3 & 4: Discipline */}
          <TableRow>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-disclabel"}
                className="border border-slate-300 text-center font-bold italic text-sky-400"
              >
                disc
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-discval"}
                className="border border-slate-300 text-center"
              >
                {codex.discipline}
              </TableHead>
            ))}
          </TableRow>
          {/* Row 5 & 6: Codex */}
          <TableRow>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-codexlabel"}
                className="border border-slate-300 text-center font-bold italic text-sky-400"
              >
                codex
              </TableHead>
            ))}
          </TableRow>
          <TableRow>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-codexval"}
                className="border border-slate-300 text-center"
              >
                {codex.number}
              </TableHead>
            ))}
          </TableRow>
          {/* Row 7: points/disc labels aligned with data columns */}
          <TableRow>
            <TableHead className="border border-slate-300 font-bold">
              Nom
            </TableHead>
            <TableHead className="border border-slate-300 font-bold italic text-center">
              Sexe
            </TableHead>
            <TableHead className="border border-slate-300 font-bold italic text-sky-400 text-center">
              points/disc
            </TableHead>
            {codexData.map((codex) => (
              <TableHead
                key={codex.number + "-pointslabel"}
                className="border border-slate-300 text-center font-bold italic text-sky-400"
              >
                points/disc
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        {/* TanStack Table Body for data rows */}
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="border border-slate-300">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="border border-slate-300 text-center p-1"
                  >
                    {/* Render cell content using TanStack */}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              {/* Adjust colSpan dynamically based on the number of columns */}
              <TableCell
                colSpan={3 + codexData.length}
                className="h-24 text-center"
              >
                Aucun compétiteur inscrit.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
