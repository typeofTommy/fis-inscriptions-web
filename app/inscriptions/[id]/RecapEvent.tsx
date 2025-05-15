"use client";

import React, {useMemo, useState} from "react";
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
import {usePermissionToEdit} from "./usePermissionToEdit";

type InscriptionCompetitorWithCodex = InscriptionCompetitor & {
  codexNumbers: string[];
  addedByEmail?: string;
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
  genderFilter: "both" | "M" | "W";
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
  addedByEmail?: string;
};

export const RecapEvent: React.FC<RecapEventProps> = ({
  inscriptionId,
  genderFilter,
}) => {
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
  const [userDrivenSorting, setUserDrivenSorting] = useState<SortingState>([]);

  // Derived sorting state for the table, ensuring it's always valid with current filters
  const tableSorting = useMemo(() => {
    const competitions = inscription?.eventData.competitions;
    if (!competitions) return []; // No competitions, no sort

    const visibleCompetitionsBasedOnFilter = competitions.filter(
      (comp) => genderFilter === "both" || comp.genderCode === genderFilter
    );

    if (visibleCompetitionsBasedOnFilter.length === 0) return []; // No visible columns, clear sort

    const visibleCodexColumnIds = visibleCompetitionsBasedOnFilter.map((comp) =>
      String(comp.codex)
    );
    const currentActiveSortColumnId = userDrivenSorting[0]?.id;

    if (
      currentActiveSortColumnId &&
      visibleCodexColumnIds.includes(currentActiveSortColumnId)
    ) {
      // The user's current sort is valid for the visible columns
      return userDrivenSorting;
    }

    // User's sort is not valid (or no sort is active), or no visible columns matching that sort.
    // Default to sorting by the first visible codex column.
    return [{id: visibleCodexColumnIds[0], desc: false}];
  }, [inscription?.eventData.competitions, genderFilter, userDrivenSorting]);

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
      addedByEmail: c.addedByEmail,
    }));
  }, [competitorsData]);

  // Filter competitors based on the genderFilter prop
  const filteredCompetitors = useMemo(() => {
    if (genderFilter === "both") {
      return allCompetitors;
    }
    return allCompetitors.filter((c) => c.gender === genderFilter);
  }, [allCompetitors, genderFilter]);

  // 2. TanStack Table Columns Definition (for body rows)
  const columnHelper = createColumnHelper<CompetitorRow>();

  // Colonnes = codex de l'évènement, chaque colonne affiche les points de la discipline du codex
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "name",
        header: () => "Nom",
        cell: (info) =>
          `${info.row.original.lastname} ${info.row.original.firstname} `,
      }),
      // Static skiclub column
      columnHelper.accessor((row) => row.skiclub, {
        id: "skiclub",
        header: () => "Club",
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      // Dynamic codex columns
      ...(inscription?.eventData.competitions ?? [])
        .filter((competition) => {
          if (genderFilter === "both") return true;
          return competition.genderCode === genderFilter;
        })
        .map((competition) =>
          columnHelper.accessor(
            (row) => {
              const isInscrit =
                Array.isArray(row.codexNumbers) &&
                row.codexNumbers.includes(String(competition.codex));
              // Si inscrit mais pas de points, retourne '999'. Si pas inscrit, retourne '-'.
              if (isInscrit) {
                const val = row.points[competition.eventCode];
                if (val === 0) return 0; // Explicitly return 0 if points are 0
                return val === null ||
                  val === undefined ||
                  String(val).trim() === "" || // Check for empty string after trim
                  String(val) === "-"
                  ? "999"
                  : val;
              }
              return "-"; // Not inscribed
            },
            {
              id: String(competition.codex),
              header: ({column}) => (
                <div
                  className="flex items-center gap-1 justify-center min-w-[120px] cursor-pointer select-none"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  <span>{competition.codex}</span>
                  <Badge
                    className={`text-xs px-2 py-1 ${
                      colorBadgePerDiscipline[competition.eventCode] || ""
                    }`}
                  >
                    {competition.eventCode}
                  </Badge>
                  <Badge
                    className={`text-xs px-2 py-1 text-white ${
                      colorBadgePerGender[competition.genderCode] || ""
                    }`}
                  >
                    {competition.genderCode}
                  </Badge>
                  <Badge
                    className={`text-xs px-2 py-1 cursor-pointer ${
                      colorBadgePerRaceLevel[competition.categoryCode] ||
                      "bg-gray-300"
                    }`}
                  >
                    {competition.categoryCode}
                  </Badge>
                  {column.getIsSorted() === "asc" && <span>↑</span>}
                  {column.getIsSorted() === "desc" && <span>↓</span>}
                </div>
              ),
              cell: (info) => {
                const value = info.getValue();
                return (
                  <div className="text-center min-w-[120px]">
                    {value} {/* Simply render the value from accessor */}
                  </div>
                );
              },
              enableSorting: true,
              sortingFn: (rowA, rowB, columnId) => {
                const a = rowA.getValue(columnId);
                const b = rowB.getValue(columnId);

                const isANotInscribed = a === "-";
                const isBNotInscribed = b === "-";

                if (isANotInscribed && isBNotInscribed) return 0;
                if (isANotInscribed) return 1;
                if (isBNotInscribed) return -1;

                // Handle 0 explicitly, convert "999" for sorting
                const valA = a === "999" ? 999 : a === 0 ? 0 : Number(a);
                const valB = b === "999" ? 999 : b === 0 ? 0 : Number(b);

                // If conversion results in NaN (e.g., unexpected string), treat as high value or handle as error
                // For now, standard numeric sort after conversion.
                if (isNaN(valA) && isNaN(valB)) return 0;
                if (isNaN(valA)) return 1; // NaN values go to bottom
                if (isNaN(valB)) return -1;

                return valA - valB;
              },
            }
          )
        ),
      // Nouvelle colonne email ajouté par
      columnHelper.accessor((row) => row.addedByEmail ?? "-", {
        id: "addedByEmail",
        header: () => "Ajouté par",
        cell: (info) => <span>{info.getValue() || "-"}</span>,
        enableSorting: false,
      }),
    ],
    [columnHelper, inscription?.eventData.competitions, genderFilter]
  );

  // 3. TanStack Table Instance
  const table = useReactTable({
    data: filteredCompetitors,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {sorting: tableSorting},
    onSortingChange: setUserDrivenSorting,
  });

  // Découpe en groupes par sexe
  const groups = [
    {label: "Femmes", value: "W"},
    {label: "Hommes", value: "M"},
  ];

  // Filter groups based on genderFilter
  const displayedGroups = useMemo(() => {
    if (genderFilter === "M") {
      return groups.filter((g) => g.value === "M");
    }
    if (genderFilter === "W") {
      return groups.filter((g) => g.value === "W");
    }
    return groups; // For "both", show all defined groups
  }, [genderFilter]);

  // Détection des sexes présents dans les codex de l'évènement
  const codexSexes = useMemo(() => {
    if (!inscription?.eventData.competitions) return [];
    const sexes = new Set<string>();
    for (const competition of inscription.eventData.competitions) {
      if (competition.genderCode === "W") sexes.add("W");
      if (competition.genderCode === "M") sexes.add("M");
    }
    return Array.from(sexes);
  }, [inscription?.eventData.competitions]);

  const permissionToEdit = usePermissionToEdit(inscription);

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
  if (!inscription?.eventData.competitions?.length) {
    return <div>Aucun codex pour cet évènement.</div>;
  }

  // 5. Render Component (groupé par sexe)
  // Trie les compétiteurs par sexe (F puis M) - this sorting might be less relevant if filtered
  const sortedRows = table.getRowModel().rows.sort((a, b) => {
    const sexA = a.original.gender;
    const sexB = b.original.gender;
    if (sexA === sexB) return 0;
    if (sexA === "F") return -1; // Prioritize 'F' if 'both' is selected, otherwise only one gender will be present
    return 1;
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex items-center gap-4 mb-4 justify-end">
        <div className="flex gap-2 items-center">
          {permissionToEdit && inscription?.status === "open" ? (
            genderFilter === "W" ? (
              <AddCompetitorModal
                inscriptionId={inscriptionId}
                defaultCodex={inscription?.eventData.competitions[0].codex}
                gender="W"
                codexData={inscription?.eventData.competitions || []}
                triggerText="Ajouter une compétitrice"
              />
            ) : genderFilter === "M" ? (
              <AddCompetitorModal
                inscriptionId={inscriptionId}
                defaultCodex={inscription?.eventData.competitions[0].codex}
                gender="M"
                codexData={inscription?.eventData.competitions || []}
                triggerText="Ajouter un compétiteur"
              />
            ) : // genderFilter === "both"
            codexSexes.length === 1 ? (
              <AddCompetitorModal
                inscriptionId={inscriptionId}
                defaultCodex={inscription?.eventData.competitions[0].codex}
                gender={codexSexes[0] as "W" | "M"}
                codexData={inscription?.eventData.competitions || []}
                triggerText={
                  codexSexes[0] === "W"
                    ? "Ajouter une compétitrice"
                    : "Ajouter un compétiteur"
                }
              />
            ) : (
              // genderFilter === "both" && codexSexes has multiple
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
                  defaultCodex={inscription?.eventData.competitions[0].codex}
                  gender={addGender}
                  codexData={inscription?.eventData.competitions || []}
                  triggerText={
                    addGender === "W"
                      ? "Ajouter compétitrice"
                      : "Ajouter compétiteur"
                  }
                />
              </>
            )
          ) : !permissionToEdit ? (
            <div className="text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded px-4 py-2">
              Vous n&apos;avez pas les droits pour ajouter des compétiteurs sur
              cet évènement.
            </div>
          ) : (
            <div className="text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded px-4 py-2">
              L&apos;inscription / désincription n&apos;est possible que lorsque
              l&apos;inscription est <b>ouverte</b>.
            </div>
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
          {displayedGroups.map((group) => {
            const groupRows = sortedRows.filter(
              (row) => row.original.gender === group.value
            );
            // if (groupRows.length === 0) return null; // Keep this if you want to hide empty groups even when selected
            // If genderFilter is specific (M or W), and groupRows is empty,
            // it implies no competitors for that gender, so we might want to show nothing or a message.
            // For now, if filter is M and no Men, or W and no Women, the group won't render.
            if (genderFilter !== "both" && group.value !== genderFilter) {
              return null; // Don't render the group if it doesn't match the filter
            }
            if (groupRows.length === 0) return null; // Always hide empty groups

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
      <TotalInscriptionsInfo
        filteredCount={filteredCompetitors.length}
        genderFilter={genderFilter}
      />
    </div>
  );
};

// Composant pour afficher le nombre total d'inscriptions
interface TotalInscriptionsInfoProps {
  filteredCount: number;
  genderFilter: "both" | "M" | "W";
}

const TotalInscriptionsInfo: React.FC<TotalInscriptionsInfoProps> = ({
  filteredCount,
  genderFilter,
}) => {
  let text = "";
  if (genderFilter === "both") {
    text = `Nombre total d'inscriptions : <b>${filteredCount}</b>`;
  } else if (genderFilter === "W") {
    text = `Nombre total de compétitrices inscrites : <b>${filteredCount}</b>`;
  } else if (genderFilter === "M") {
    text = `Nombre total de compétiteurs inscrits : <b>${filteredCount}</b>`;
  }

  return (
    <div
      className="text-xl text-center text-slate-500 mt-8 mb-2 border-t border-slate-200 pt-2"
      dangerouslySetInnerHTML={{__html: text}}
    />
  );
};
