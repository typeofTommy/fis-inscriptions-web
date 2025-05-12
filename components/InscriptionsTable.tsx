"use client";
import {useQuery} from "@tanstack/react-query";
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
import {useState, useMemo} from "react";
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
import {format, parseISO} from "date-fns";
import Link from "next/link";
import {
  colorBadgePerDiscipline,
  colorBadgePerRaceLevel,
  colorBadgePerGender,
} from "@/app/lib/colorMappers";
import {DebouncedInput} from "@/components/ui/debounced-input";
import {Inscription} from "@/app/types";
import type {CompetitionItem} from "@/app/types";
import {useCountries} from "@/app/inscriptions/form/api";
import Image from "next/image";
import {alpha3ToAlpha2} from "@/app/lib/countryMapper";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  validated: "bg-blue-100 text-blue-800 border-blue-200",
};

// Composant pour afficher le nombre de compétiteurs pour une inscription
const CompetitorCountCell = ({inscriptionId}: {inscriptionId: number}) => {
  const {data, isLoading, isError} = useQuery({
    queryKey: ["inscription-competitors-all", inscriptionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors/all`
      );
      if (!res.ok)
        throw new Error("Erreur lors du chargement des compétiteurs");
      return res.json();
    },
  });
  if (isLoading)
    return <Loader2 className="w-4 h-4 animate-spin inline-block" />;
  if (isError) return <span>-</span>;
  return <span>{Array.isArray(data) ? data.length : "-"}</span>;
};

// Composant pour afficher le drapeau et le code pays
const CountryCell = ({country}: {country: string}) => {
  const {data: countries} = useCountries();
  let flagUrl: string | undefined;
  if (countries && country && country !== "Non renseigné") {
    const alpha2 = alpha3ToAlpha2(country) ?? country;
    const found = countries.find((c) => c.cca2 === alpha2);
    flagUrl = found?.flags?.svg;
  }
  return (
    <span className="flex items-center gap-2">
      {flagUrl && (
        <Image
          src={flagUrl}
          alt={country}
          className="inline-block w-5 h-4 object-cover border border-gray-200 rounded"
          loading="lazy"
          width={20}
          height={16}
        />
      )}
      {country}
    </span>
  );
};

export function InscriptionsTable() {
  const [sorting, setSorting] = useState<SortingState>([
    {id: "startDate", desc: false},
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {id: "status", value: "open"},
  ]);

  const {data, isLoading} = useQuery<Inscription[]>({
    queryKey: ["inscriptions"],
    queryFn: () => fetch("/api/inscriptions").then((res) => res.json()),
  });

  // Ajout du hook pour les pays (flags)
  const {data: countries} = useCountries();

  // Mémoïsation forte pour éviter les recalculs infinis
  const stableData = useMemo(() => data ?? [], [data]);

  // Génération dynamique des options de filtres à partir de stableData
  const locationOptions = useMemo(() => {
    return Array.from(
      new Set(stableData.map((row) => row.eventData.place).filter(Boolean))
    )
      .map((name) => ({value: name, label: name}))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [stableData]);

  const countryOptions = useMemo(() => {
    return Array.from(
      new Set(
        stableData
          .map(
            (row) =>
              row.eventData.placeNationCode || row.eventData.organiserNationCode
          )
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [stableData]);

  const codexOptions = useMemo(() => {
    return Array.from(
      new Set(
        stableData.flatMap((row) =>
          (row.eventData.competitions ?? []).map(
            (c: CompetitionItem) => c.codex
          )
        )
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [stableData]);

  const disciplineOptions = useMemo(() => {
    return Array.from(
      new Set(
        stableData.flatMap((row) =>
          (row.eventData.competitions ?? []).map((c) => c.eventCode)
        )
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [stableData]);

  const raceLevelOptions = useMemo(() => {
    return Array.from(
      new Set(
        stableData.flatMap((row) =>
          (row.eventData.competitions ?? []).map(
            (c: CompetitionItem) => c.categoryCode
          )
        )
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [stableData]);

  const sexOptions = useMemo(() => {
    return Array.from(
      new Set(
        stableData.flatMap((row) =>
          (row.eventData.competitions ?? []).map(
            (c: CompetitionItem) => c.genderCode
          )
        )
      )
    ).sort((a, b) => String(a).localeCompare(String(b)));
  }, [stableData]);

  const columns: ColumnDef<Inscription>[] = [
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
      accessorFn: (row) => row.eventData.startDate,
      id: "startDate",
      cell: ({row}) => {
        return (
          <div>
            {format(parseISO(row.original.eventData.startDate), "dd/MM/yyyy")}
          </div>
        );
      },
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Date
        </Button>
      ),
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.eventData.startDate.includes(filterValue);
      },
      sortingFn: "datetime",
    },
    {
      accessorKey: "location",
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Station
        </Button>
      ),
      cell: ({row}) => {
        const locationId = row.original.eventData.place;
        let stationName = "";
        if (locationId) {
          stationName = locationId;
        } else {
          stationName = "Non renseigné";
        }
        return (
          <span>{stationName[0].toUpperCase() + stationName.slice(1)}</span>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        const locationId = row.original.eventData.place;
        return locationId.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: "country",
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Pays
        </Button>
      ),
      cell: ({row}) => {
        const country =
          row.original.eventData.placeNationCode ||
          row.original.eventData.organiserNationCode ||
          "Non renseigné";
        return <CountryCell country={country} />;
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        const country =
          row.original.eventData.placeNationCode ||
          row.original.eventData.organiserNationCode ||
          "";
        return country === filterValue;
      },
    },
    {
      id: "codex",
      header: "Codex",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => (
        <div className="flex gap-2 flex-wrap">
          {(row.original.eventData.competitions ?? []).map(
            (c: CompetitionItem, i: number) => (
              <Badge key={c.codex + i} variant={"outline"}>
                {c.codex}
              </Badge>
            )
          )}
        </div>
      ),
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return Array.isArray(row.original.eventData.competitions)
          ? row.original.eventData.competitions.some((c: CompetitionItem) =>
              String(c.codex)
                .toLowerCase()
                .includes((filterValue as string).toLowerCase())
            )
          : true;
      },
    },
    {
      id: "discipline",
      header: "Disciplines",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => {
        const disciplines = Array.from(
          new Set(
            (row.original.eventData.competitions ?? []).map((c) => c.eventCode)
          )
        ).filter(Boolean);
        return (
          <div className="flex gap-2 flex-wrap">
            {disciplines.map((discipline: string) => (
              <Badge
                key={discipline}
                className={colorBadgePerDiscipline[discipline] || "bg-gray-300"}
              >
                {discipline}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return Array.isArray(row.original.eventData.competitions)
          ? row.original.eventData.competitions.some(
              (c: CompetitionItem) => c.eventCode === filterValue
            )
          : true;
      },
    },
    {
      id: "raceLevel",
      header: "Race Levels",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => {
        const raceLevels = Array.from(
          new Set(
            (row.original.eventData.competitions ?? []).map(
              (c: CompetitionItem) => c.categoryCode
            )
          )
        ).filter(Boolean);
        return (
          <div className="flex gap-2 flex-wrap">
            {raceLevels.map((raceLevel: string) => (
              <Badge
                key={raceLevel}
                className={colorBadgePerRaceLevel[raceLevel] || "bg-gray-300"}
              >
                {raceLevel}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return Array.isArray(row.original.eventData.competitions)
          ? row.original.eventData.competitions.some(
              (c: CompetitionItem) => c.categoryCode === filterValue
            )
          : true;
      },
    },
    {
      accessorKey: "status",
      header: ({column}) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="cursor-pointer"
        >
          Statut
        </Button>
      ),
      cell: ({row}) => (
        <Badge className={statusColors[row.original.status] || "bg-gray-200"}>
          {row.original.status === "open"
            ? "Ouverte"
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
    {
      id: "sex",
      header: "Sexe",
      enableColumnFilter: true,
      accessorFn: (row) => row,
      cell: ({row}) => {
        // On force l'ordre M puis W
        const sexes = ["M", "W"].filter((sex) =>
          (row.original.eventData.competitions ?? []).some(
            (c: CompetitionItem) => c.genderCode === sex
          )
        );
        return (
          <div className="flex gap-1">
            {sexes.map((sex: string) => (
              <Badge
                key={sex}
                variant="outline"
                className={`${
                  colorBadgePerGender[sex === "M" ? "M" : "W"] || ""
                } text-white`}
              >
                {sex}
              </Badge>
            ))}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        return Array.isArray(row.original.eventData.competitions)
          ? row.original.eventData.competitions.some(
              (c: CompetitionItem) => c.genderCode === filterValue
            )
          : true;
      },
    },
    {
      id: "competitorCount",
      header: "Nb compétiteurs",
      cell: ({row}) => <CompetitorCountCell inscriptionId={row.original.id} />,
    },
  ];

  // Table instance (props stables)
  const table = useReactTable({
    data: stableData,
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

  const dateValue = String(
    table.getColumn("startDate")?.getFilterValue() ?? ""
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Barre de filtres au-dessus du tableau */}
      <div className="mb-6 p-4 bg-white/80 rounded-lg shadow flex flex-wrap gap-6 justify-start items-center border">
        <div className="flex flex-col gap-1 w-[140px]">
          <label htmlFor="filter-date" className="font-semibold text-sm">
            Date
          </label>
          <DebouncedInput
            id="filter-date"
            type="date"
            value={dateValue}
            onChange={(value) => {
              if (value !== dateValue) {
                table.getColumn("startDate")?.setFilterValue(value);
              }
            }}
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
            <SelectTrigger
              id="filter-station"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Station" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {locationOptions.map((loc) => (
                <SelectItem key={loc.value} value={loc.value}>
                  {loc.label[0].toUpperCase() + loc.label.slice(1)}
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
            <SelectTrigger
              id="filter-country"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Pays" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {countryOptions.map((country) => {
                // Cherche le flag correspondant
                let flagUrl: string | undefined = undefined;
                let countryLabel = country;
                if (countries && country && country !== "Non renseigné") {
                  const alpha2 = alpha3ToAlpha2(country) ?? country;
                  const found = countries.find((c) => c.cca2 === alpha2);
                  flagUrl = found?.flags?.svg;
                  // Si on a le nom commun, on l'affiche à la place du code
                  if (found?.name?.common) countryLabel = found.name.common;
                }
                return (
                  <SelectItem key={country} value={country}>
                    <span className="flex items-center gap-2">
                      {flagUrl && (
                        <Image
                          src={flagUrl}
                          alt={country}
                          className="inline-block w-5 h-4 object-cover border border-gray-200 rounded"
                          loading="lazy"
                          width={20}
                          height={16}
                        />
                      )}
                      {countryLabel}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 w-[140px]">
          <label htmlFor="filter-codex" className="font-semibold text-sm">
            Codex
          </label>
          <Select
            value={String(table.getColumn("codex")?.getFilterValue() ?? "all")}
            onValueChange={(value) =>
              table
                .getColumn("codex")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger
              id="filter-codex"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Codex" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {codexOptions.map((codex) => (
                <SelectItem key={String(codex)} value={String(codex)}>
                  {codex}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 w-[140px]">
          <label htmlFor="filter-discipline" className="font-semibold text-sm">
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
            <SelectTrigger
              id="filter-discipline"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Discipline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {disciplineOptions.map((discipline) => (
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
            <SelectTrigger
              id="filter-racelevel"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Race Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {raceLevelOptions.map((raceLevel) => (
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
            value={
              table.getColumn("status")?.getFilterValue() === undefined
                ? "all"
                : String(table.getColumn("status")?.getFilterValue())
            }
            onValueChange={(value) =>
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger
              id="filter-status"
              className="w-[140px] cursor-pointer"
            >
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="open">Ouverte</SelectItem>
              <SelectItem value="validated">Clôturée</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 w-[140px]">
          <label htmlFor="filter-sex" className="font-semibold text-sm">
            Sexe
          </label>
          <Select
            value={String(table.getColumn("sex")?.getFilterValue() ?? "all")}
            onValueChange={(value) =>
              table
                .getColumn("sex")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger id="filter-sex" className="w-[140px] cursor-pointer">
              <SelectValue placeholder="Sexe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {sexOptions.map((sex) => (
                <SelectItem key={sex} value={sex}>
                  {sex === "M" ? "Homme" : "Femme"}
                </SelectItem>
              ))}
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
    </>
  );
}
