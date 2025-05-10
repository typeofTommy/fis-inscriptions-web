"use client";

import React, {useMemo, useState, useEffect} from "react";
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
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {Badge} from "@/components/ui/badge";
import {
  colorBadgePerDiscipline,
  colorBadgePerGender,
  colorBadgePerRaceLevel,
} from "@/app/lib/colorMappers";
import AddCompetitorModal from "./AddCompetitorModal";

type InscriptionCompetitorWithCodex = InscriptionCompetitor & {
  codexNumbers: string[];
};

// Hook pour récupérer tous les compétiteurs de l'inscription (nouvelle structure)
const useAllInscriptionCompetitors = (inscriptionId: string) => {
  return useQuery<InscriptionCompetitor[]>({
    queryKey: ["inscription-competitors-all", inscriptionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors/all`
      );
      if (!res.ok)
        throw new Error("Erreur lors du chargement des compétiteurs");
      // Nouvelle structure: retourne un tableau plat
      const data = await res.json();
      return data || [];
    },
  });
};

interface RecapEventProps {
  inscriptionId: string;
}

// Define a type for the competitor data used in the table
// (pointsByCodex devient points)
type CompetitorRow = {
  competitorid: number;
  lastname: string;
  firstname: string;
  gender: string;
  points: Record<string, string | number | null>;
  codexNumbers: string[];
  skiclub: string;
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

  const [addGender, setAddGender] = useState<"W" | "M">("W");
  const [sorting, setSorting] = useState<SortingState>([]);

  // Tri par défaut sur le premier codex dès que codexData est dispo
  useEffect(() => {
    if (inscription?.codexData && inscription.codexData.length > 0) {
      const firstCodexId = String(inscription.codexData[0].number);
      setSorting((current) =>
        current.length === 0 || current[0].id !== firstCodexId
          ? [{id: firstCodexId, desc: false}]
          : current
      );
    }
  }, [inscription?.codexData]);

  // 1. Data Preparation: on force les champs string à non-null et on normalise le genre
  const allCompetitors: CompetitorRow[] = useMemo(() => {
    return (competitorsData as InscriptionCompetitorWithCodex[]).map((c) => ({
      ...c,
      lastname: c.lastname ?? "",
      firstname: c.firstname ?? "",
      gender: c.gender || "M",
      points: typeof c.points === "object" && c.points !== null ? c.points : {},
      codexNumbers: (c.codexNumbers || []).map(String),
      skiclub: c.skiclub ?? "",
    }));
  }, [competitorsData]);

  // 2. TanStack Table Columns Definition (for body rows)
  const columnHelper = createColumnHelper<CompetitorRow>();

  // Colonnes = codex de l'évènement, chaque colonne affiche les points de la discipline du codex
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "name",
        header: () => "Nom",
        cell: (info) =>
          `${info.row.original.firstname} ${info.row.original.lastname}`,
      }),
      // Static skiclub column
      columnHelper.accessor((row) => row.skiclub, {
        id: "skiclub",
        header: () => "Club",
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      // Dynamic codex columns
      ...(inscription?.codexData ?? []).map((codex) =>
        columnHelper.accessor(
          (row) => {
            const isInscrit =
              Array.isArray(row.codexNumbers) &&
              row.codexNumbers.includes(String(codex.number));
            // Si inscrit mais pas de points, retourne '-'. Si pas inscrit, retourne '-'.
            if (isInscrit) {
              const val = row.points[codex.discipline];
              return val === null ||
                val === undefined ||
                val === "" ||
                val === "-"
                ? "-"
                : val;
            }
            return "-";
          },
          {
            id: String(codex.number),
            header: ({column}) => (
              <div
                className="flex items-center gap-1 justify-center min-w-[120px] cursor-pointer select-none"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                <span>{codex.number}</span>
                <Badge
                  className={`text-xs px-2 py-1 ${
                    colorBadgePerDiscipline[codex.discipline] || ""
                  }`}
                >
                  {codex.discipline}
                </Badge>
                <Badge
                  className={`text-xs px-2 py-1 text-white ${
                    colorBadgePerGender[codex.sex === "F" ? "W" : "M"] || ""
                  }`}
                >
                  {codex.sex}
                </Badge>
                <Badge
                  className={`text-xs px-2 py-1 cursor-pointer ${
                    colorBadgePerRaceLevel[codex.raceLevel] || "bg-gray-300"
                  }`}
                >
                  {codex.raceLevel}
                </Badge>
                {column.getIsSorted() === "asc" && <span>↑</span>}
                {column.getIsSorted() === "desc" && <span>↓</span>}
              </div>
            ),
            cell: (info) => {
              const value = info.getValue();
              return (
                <div className="text-center min-w-[120px]">
                  {value === null ||
                  value === undefined ||
                  value === "" ||
                  value === "-"
                    ? "-"
                    : value}
                </div>
              );
            },
            enableSorting: true,
            sortingFn: (rowA, rowB, columnId) => {
              // On veut trier par valeur numérique, '-' (pas de points) en dernier, 0 (zéro point) en haut
              const a = rowA.getValue(columnId);
              const b = rowB.getValue(columnId);
              const isANoPoints =
                a === "-" || a === undefined || a === null || a === "";
              const isBNoPoints =
                b === "-" || b === undefined || b === null || b === "";
              if (isANoPoints && isBNoPoints) return 0;
              if (isANoPoints) return 1; // a va en bas
              if (isBNoPoints) return -1; // b va en bas
              return Number(a) - Number(b);
            },
          }
        )
      ),
    ],
    [columnHelper, inscription?.codexData]
  );

  // 3. TanStack Table Instance
  const table = useReactTable({
    data: allCompetitors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {sorting},
    onSortingChange: setSorting,
  });

  // Découpe en groupes par sexe
  const groups = [
    {label: "Femmes", value: "W"},
    {label: "Hommes", value: "M"},
  ];

  // Détection des sexes présents dans les codex de l'évènement
  const codexSexes = useMemo(() => {
    if (!inscription?.codexData) return [];
    const sexes = new Set<string>();
    for (const codex of inscription.codexData) {
      if (codex.sex === "F") sexes.add("W");
      if (codex.sex === "M") sexes.add("M");
    }
    return Array.from(sexes);
  }, [inscription?.codexData]);

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
  if (!inscription?.codexData?.length) {
    return <div>Aucun codex pour cet évènement.</div>;
  }

  // 5. Render Component (groupé par sexe)
  // Trie les compétiteurs par sexe (F puis M)
  const sortedRows = table.getRowModel().rows.sort((a, b) => {
    const sexA = a.original.gender;
    const sexB = b.original.gender;
    if (sexA === sexB) return 0;
    if (sexA === "F") return -1;
    return 1;
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 mb-4 justify-end">
        <div className="flex gap-2 items-center">
          {codexSexes.length === 1 ? (
            <AddCompetitorModal
              inscriptionId={inscriptionId}
              defaultCodex={""}
              gender={codexSexes[0] as "W" | "M"}
              codexData={inscription?.codexData || []}
            />
          ) : (
            <>
              <span className="text-sm">
                Ajouter un{addGender === "W" ? "e" : ""} :
              </span>
              <button
                type="button"
                className={`px-3 py-1 rounded border cursor-pointer ${
                  addGender === "W"
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setAddGender("W")}
              >
                Femme
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded border cursor-pointer ${
                  addGender === "M"
                    ? "bg-blue-100 border-blue-500 text-blue-700"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setAddGender("M")}
              >
                Homme
              </button>
              <AddCompetitorModal
                inscriptionId={inscriptionId}
                defaultCodex={""}
                gender={addGender}
                codexData={inscription?.codexData || []}
              />
            </>
          )}
        </div>
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const groupRows = sortedRows.filter(
              (row) => row.original.gender === group.value
            );
            if (groupRows.length === 0) return null;
            return (
              <React.Fragment key={group.value}>
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="bg-slate-50 font-bold text-lg text-slate-700"
                  >
                    {group.label}
                  </TableCell>
                </TableRow>
                {groupRows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
