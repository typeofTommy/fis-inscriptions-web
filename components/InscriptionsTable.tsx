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
import {useStations} from "@/app/inscriptions/form/api";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  validated: "bg-blue-100 text-blue-800 border-blue-200",
};

export function InscriptionsTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([
    {id: "status", value: "open"},
  ]);

  const {data, isLoading} = useQuery<Inscription[]>({
    queryKey: ["inscriptions"],
    queryFn: () => fetch("/api/inscriptions").then((res) => res.json()),
  });

  const {data: stations} = useStations();

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
      accessorKey: "firstRaceDate",
      cell: ({row}) => {
        return (
          <div>
            {format(parseISO(row.original.firstRaceDate), "dd/MM/yyyy")}
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
        return row.original.firstRaceDate.includes(filterValue);
      },
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
        const locationId = row.original.location;
        let stationName = "";
        if (stations && locationId) {
          const foundStation = stations.find((s: any) => s.id === locationId);
          stationName = foundStation
            ? foundStation.name
            : `Station #${locationId}`;
        } else if (locationId) {
          stationName = `Station #${locationId}`;
        } else {
          stationName = "Non renseigné";
        }
        return <span>{stationName}</span>;
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue || filterValue === "all") return true;
        if (!stations) return true;
        const locationId = row.original.location;
        const foundStation = stations.find((s: any) => s.id === locationId);
        const stationName = foundStation
          ? foundStation.name
          : `Station #${locationId}`;
        return stationName.toLowerCase().includes(filterValue.toLowerCase());
      },
    },
    {
      accessorKey: "country",
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="cursor-pointer"
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
        const sexes = Array.from(
          new Set(row.original.codexData.map((c: any) => c.sex))
        );
        return (
          <div className="flex gap-1">
            {sexes.map((sex) => (
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
        return row.original.codexData.some((c: any) => c.sex === filterValue);
      },
    },
  ];

  const table = useReactTable({
    data: data ?? [],
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

  // Mémoïsation des options pour les Selects de filtres
  const locationOptions = useMemo(() => {
    if (!stations) return [];
    return stations.map((s: any) => ({value: s.name, label: s.name}));
  }, [stations]);
  const countryOptions = useMemo(
    () => Array.from(new Set((data ?? []).map((row) => row.country))).sort(),
    [data]
  );
  const codexOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (data ?? []).flatMap((row) => row.codexData.map((c: any) => c.number))
        )
      ).sort((a, b) => parseInt(a) - parseInt(b)),
    [data]
  );
  const disciplineOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (data ?? []).flatMap((row) =>
            row.codexData.map((c: any) => c.discipline)
          )
        )
      ).sort(),
    [data]
  );
  const raceLevelOptions = useMemo(
    () =>
      Array.from(
        new Set(
          (data ?? []).flatMap((row) =>
            row.codexData.map((c: any) => c.raceLevel)
          )
        )
      ).sort(),
    [data]
  );
  const sexOptions = useMemo(() => ["M", "F"], []);

  const dateValue = String(
    table.getColumn("firstRaceDate")?.getFilterValue() ?? ""
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
                table.getColumn("firstRaceDate")?.setFilterValue(value);
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
                  {loc.label}
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
              {countryOptions.map((country) => (
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
                <SelectItem key={codex} value={codex}>
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
            value={String(
              table.getColumn("status")?.getFilterValue() ?? "open"
            )}
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
              <SelectItem value="validated">Validée</SelectItem>
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
