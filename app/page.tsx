"use client";
import {useQuery} from "@tanstack/react-query";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {TableBody, TableCell, TableHead} from "@/components/ui/table";
import {Table, TableHeader, TableRow} from "@/components/ui/table";
import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Loader2} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {format} from "date-fns";
import Link from "next/link";
import {
  colorBadgePerDiscipline,
  colorBadgePerRaceLevel,
} from "./lib/colorMappers";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {DebouncedInput} from "@/components/ui/debounced-input";

const MIN_SEARCH_LENGTH = 3;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function useCompetitorsSearch(search: string, gender: "M" | "W") {
  return useQuery({
    queryKey: ["competitors", search, gender],
    queryFn: async () => {
      if (search.length < MIN_SEARCH_LENGTH) return [];
      const res = await fetch(
        `/api/competitors?search=${encodeURIComponent(search)}&gender=${gender}`
      );
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: search.length >= MIN_SEARCH_LENGTH,
  });
}

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  frozen: "bg-yellow-100 text-yellow-800 border-yellow-200",
  validated: "bg-blue-100 text-blue-800 border-blue-200",
};

function CompetitorEventsTab() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<"M" | "W" | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);
  const {data: results = [], isLoading: loading} = useCompetitorsSearch(
    debouncedSearch,
    gender as "M" | "W"
  );
  const {data: competitor, isLoading: loadingCompetitor} = useQuery({
    queryKey: ["competitor", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/competitors/${selectedId}`);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!selectedId,
  });
  const {data: inscriptions, isLoading: loadingInscriptions} = useQuery({
    queryKey: ["competitor-inscriptions", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const res = await fetch(`/api/competitors/${selectedId}/inscriptions`);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!selectedId,
  });
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value="M"
            checked={gender === "M"}
            onChange={() => setGender("M")}
            className="cursor-pointer"
          />
          Homme
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value="W"
            checked={gender === "W"}
            onChange={() => setGender("W")}
            className="cursor-pointer"
          />
          Femme
        </label>
      </div>
      {gender ? (
        <>
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Nom ou prénom (3 caractères min)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 border rounded mt-2"
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || results.length === 0}
          >
            <option value="" disabled>
              {loading
                ? "Chargement..."
                : results.length === 0
                ? "Aucun compétiteur trouvé"
                : "Sélectionner un compétiteur"}
            </option>
            {results.map((c: any) => (
              <option key={c.competitorid} value={c.competitorid}>
                {c.firstname} {c.lastname} ({c.nationcode})
              </option>
            ))}
          </select>
        </>
      ) : (
        <div className="text-slate-500 mt-2">
          Veuillez d&apos;abord choisir un genre.
        </div>
      )}
      {loadingCompetitor && (
        <div className="mt-4">Chargement du compétiteur...</div>
      )}
      {competitor && (
        <div className="mt-4 p-4 bg-slate-50 rounded border">
          <div className="font-bold text-lg mb-2">
            {competitor.firstname} {competitor.lastname} (
            {competitor.nationcode})
          </div>
          <div className="text-sm text-slate-600 mb-2">
            FIS: {competitor.fiscode} | Sexe: {competitor.gender} | Naissance:{" "}
            {competitor.birthdate}
          </div>
        </div>
      )}
      {loadingInscriptions && (
        <div className="mt-4">Chargement des évènements...</div>
      )}
      {inscriptions && inscriptions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Évènements et codex où le compétiteur est inscrit :
          </h3>
          <ul className="space-y-4">
            {[...inscriptions]
              .sort(
                (a, b) =>
                  new Date(a.firstRaceDate).getTime() -
                  new Date(b.firstRaceDate).getTime()
              )
              .map((insc: any) => (
                <li
                  key={insc.inscriptionId}
                  className="border rounded p-3 bg-white"
                >
                  <div className="font-medium text-base mb-1">
                    <a
                      href={`/inscriptions/${insc.inscriptionId}`}
                      className="underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {insc.location}
                      {insc.firstRaceDate
                        ? ` – ${(() => {
                            try {
                              return new Date(
                                insc.firstRaceDate
                              ).toLocaleDateString("fr-FR");
                            } catch {
                              return insc.firstRaceDate;
                            }
                          })()}`
                        : ""}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insc.codexList.map((codex: any) => (
                      <span
                        key={codex.number}
                        className="flex items-center gap-1"
                      >
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            colorBadgePerDiscipline[codex.discipline] || ""
                          }`}
                        >
                          {codex.number}
                        </Badge>
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            colorBadgePerDiscipline[codex.discipline] || ""
                          }`}
                        >
                          {codex.discipline}
                        </Badge>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
      {inscriptions &&
        inscriptions.length === 0 &&
        selectedId &&
        !loadingInscriptions && (
          <div className="mt-4 text-slate-500">
            Aucune inscription trouvée pour ce compétiteur.
          </div>
        )}
    </div>
  );
}

export default function Home() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {id: "status", value: "open"},
  ]);
  const [tab, setTab] = useState("inscriptions");

  const {data, isLoading} = useQuery<(typeof inscriptions.$inferSelect)[]>({
    queryKey: ["inscriptions"],
    queryFn: () => fetch("/api/inscriptions").then((res) => res.json()),
  });

  const sortedData = (data ?? []).slice().sort((a, b) => {
    const dateA = new Date(a.firstRaceDate).getTime();
    const dateB = new Date(b.firstRaceDate).getTime();
    return dateA - dateB;
  });

  const columns: ColumnDef<typeof inscriptions.$inferSelect>[] = [
    {
      id: "actions",
      cell: ({row}) => {
        return (
          <Link href={`/inscriptions/${row.original.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base px-2 py-1"
            >
              Détails
            </Button>
          </Link>
        );
      },
      header: "Actions",
    },
    {
      accessorKey: "firstRaceDate",
      cell: ({row}) => {
        return <div>{format(row.original.firstRaceDate, "dd/MM/yyyy")}</div>;
      },
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
        </Button>
      ),
      sortingFn: (rowA, rowB, columnId) => {
        const a = new Date(rowA.original.firstRaceDate).getTime();
        const b = new Date(rowB.original.firstRaceDate).getTime();
        return a - b;
      },
    },
    {
      accessorKey: "location",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Station
          </Button>
        );
      },
    },
    {
      accessorKey: "country",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Pays
          </Button>
        );
      },
    },
    {
      id: "codex",
      header: "Codex",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => (
        <div className="flex gap-2 flex-wrap">
          {row.original.codexData.map((c: any, i: number) => (
            <Badge key={c.number + i} variant={"outline"}>
              {c.number}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.codexData.some((c: any) =>
          c.number.toLowerCase().includes((filterValue as string).toLowerCase())
        );
      },
    },
    {
      id: "discipline",
      header: "Disciplines",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => (
        <div className="flex gap-2 flex-wrap">
          {Array.from(
            new Set(row.original.codexData.map((c: any) => c.discipline))
          ).map((discipline) => (
            <Badge
              key={discipline}
              className={colorBadgePerDiscipline[discipline] || "bg-gray-300"}
            >
              {discipline}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.codexData.some(
          (c: any) => c.discipline === filterValue
        );
      },
    },
    {
      id: "raceLevel",
      header: "Race Levels",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => (
        <div className="flex gap-2 flex-wrap">
          {Array.from(
            new Set(row.original.codexData.map((c: any) => c.raceLevel))
          ).map((raceLevel) => (
            <Badge
              key={raceLevel}
              className={colorBadgePerRaceLevel[raceLevel] || "bg-gray-300"}
            >
              {raceLevel}
            </Badge>
          ))}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.codexData.some(
          (c: any) => c.raceLevel === filterValue
        );
      },
    },
    {
      accessorKey: "status",
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Statut
        </Button>
      ),
      cell: ({row}) => (
        <Badge className={statusColors[row.original.status] || "bg-gray-200"}>
          {row.original.status === "open"
            ? "Ouverte"
            : row.original.status === "frozen"
            ? "Gelée"
            : row.original.status === "validated"
            ? "Validée"
            : row.original.status}
        </Badge>
      ),
      filterFn: (row, id, value) => {
        if (!value) return true;
        return row.original.status === value;
      },
    },
  ];

  const table = useReactTable({
    data: sortedData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    enableColumnFilters: true,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="inscriptions" className="cursor-pointer">
          Inscriptions
        </TabsTrigger>
        <TabsTrigger value="competitors" className="cursor-pointer">
          Compétiteurs
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inscriptions">
        {/* Barre de filtres au-dessus du tableau */}
        <div className="mb-6 p-4 bg-white/80 rounded-lg shadow flex flex-wrap gap-6 justify-start items-center border">
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-date" className="font-semibold text-sm">
              Date
            </label>
            <DebouncedInput
              id="filter-date"
              type="date"
              value={String(
                table.getColumn("firstRaceDate")?.getFilterValue() ?? ""
              )}
              onChange={(value) =>
                table.getColumn("firstRaceDate")?.setFilterValue(value)
              }
              placeholder="Date de la 1ère course"
              className="w-[140px]"
            />
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-station" className="font-semibold text-sm">
              Station
            </label>
            <Select
              value={String(
                table.getColumn("location")?.getFilterValue() ?? "all"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("location")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-station" className="w-[140px]">
                <SelectValue placeholder="Station" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Array.from(new Set((data ?? []).map((row) => row.location)))
                  .sort()
                  .map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-country" className="font-semibold text-sm">
              Pays
            </label>
            <Select
              value={String(
                table.getColumn("country")?.getFilterValue() ?? "all"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("country")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-country" className="w-[140px]">
                <SelectValue placeholder="Pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Array.from(new Set((data ?? []).map((row) => row.country)))
                  .sort()
                  .map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-codex" className="font-semibold text-sm">
              Codex
            </label>
            <Select
              value={String(
                table.getColumn("codex")?.getFilterValue() ?? "all"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("codex")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-codex" className="w-[140px]">
                <SelectValue placeholder="Codex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Array.from(
                  new Set(
                    (data ?? []).flatMap((row) =>
                      row.codexData.map((c: any) => c.number)
                    )
                  )
                )
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map((codex) => (
                    <SelectItem key={codex} value={codex}>
                      {codex}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label
              htmlFor="filter-discipline"
              className="font-semibold text-sm"
            >
              Discipline
            </label>
            <Select
              value={String(
                table.getColumn("discipline")?.getFilterValue() ?? "all"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("discipline")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-discipline" className="w-[140px]">
                <SelectValue placeholder="Discipline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Array.from(
                  new Set(
                    (data ?? []).flatMap((row) =>
                      row.codexData.map((c: any) => c.discipline)
                    )
                  )
                )
                  .sort()
                  .map((discipline) => (
                    <SelectItem key={discipline} value={discipline}>
                      {discipline}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-racelevel" className="font-semibold text-sm">
              Race Level
            </label>
            <Select
              value={String(
                table.getColumn("raceLevel")?.getFilterValue() ?? "all"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("raceLevel")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-racelevel" className="w-[140px]">
                <SelectValue placeholder="Race Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Array.from(
                  new Set(
                    (data ?? []).flatMap((row) =>
                      row.codexData.map((c: any) => c.raceLevel)
                    )
                  )
                )
                  .sort()
                  .map((raceLevel) => (
                    <SelectItem key={raceLevel} value={raceLevel}>
                      {raceLevel}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-[140px]">
            <label htmlFor="filter-status" className="font-semibold text-sm">
              Statut
            </label>
            <Select
              value={String(
                table.getColumn("status")?.getFilterValue() ?? "open"
              )}
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger id="filter-status" className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="open">Ouverte</SelectItem>
                <SelectItem value="frozen">Gelée</SelectItem>
                <SelectItem value="validated">Validée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="rounded-md border bg-white px-4">
          <Table className="w-full">
            <TableHeader className="w-full">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className={
                          header.id === "actions" || header.id === "status"
                            ? "w-auto min-w-[60px] max-w-[100px] whitespace-nowrap px-2 text-sm"
                            : "w-auto min-w-[100px] max-w-[200px] whitespace-nowrap px-2 text-sm"
                        }
                      >
                        {header.isPlaceholder ? null : (
                          <div>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="w-full">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "actions" ||
                          cell.column.id === "status"
                            ? "whitespace-nowrap px-2 text-sm"
                            : "whitespace-nowrap px-2 text-sm"
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Pas de résultats.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
      <TabsContent value="competitors">
        <CompetitorEventsTab />
      </TabsContent>
    </Tabs>
  );
}
