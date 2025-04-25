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
  Column,
} from "@tanstack/react-table";
import {TableBody, TableCell, TableHead} from "@/components/ui/table";
import {Table, TableHeader, TableRow} from "@/components/ui/table";
import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";
import {ArrowUpDown, Loader2} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {format} from "date-fns";
import Link from "next/link";

// Debounced input component
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-sm"
    />
  );
}

const translatedColumnId: Record<
  keyof typeof inscriptions.$inferSelect,
  string
> = {
  codexNumbers: "codex",
  disciplines: "disciplines",
  raceLevels: "raceLevels",
  firstRaceDate: "date",
  location: "station",
  country: "pays",
  id: "id",
  email: "email",
  fullName: "nom",
  eventLink: "lien",
  createdAt: "date",
};

// Filter component that adapts to column type
function Filter({
  column,
  data,
}: {
  column: Column<typeof inscriptions.$inferSelect, unknown>;
  data: (typeof inscriptions.$inferSelect)[];
}) {
  const columnFilterValue = column.getFilterValue();
  const columnId = column.id;

  // Different filter types based on column
  if (columnId === "firstRaceDate") {
    return (
      <DebouncedInput
        type="date"
        value={(columnFilterValue as string) ?? ""}
        onChange={(value) => column.setFilterValue(value)}
        placeholder="Date..."
        className="max-w-sm"
      />
    );
  } else if (columnId === "disciplines" || columnId === "raceLevels") {
    let options: {value: string; label: string}[] = [];

    if (columnId === "disciplines") {
      // Extract unique disciplines from data
      const uniqueDisciplines = new Set<string>();
      data.forEach((row) => {
        row.disciplines.forEach((discipline: string) =>
          uniqueDisciplines.add(discipline)
        );
      });

      options = Array.from(uniqueDisciplines)
        .sort()
        .map((discipline) => ({
          value: discipline,
          label: discipline,
        }));
    } else if (columnId === "raceLevels") {
      // Extract unique race levels from data
      const uniqueRaceLevels = new Set<string>();
      data.forEach((row) => {
        row.raceLevels.forEach((level: string) => uniqueRaceLevels.add(level));
      });

      options = Array.from(uniqueRaceLevels)
        .sort()
        .map((level) => ({
          value: level,
          label: level,
        }));
    }

    return (
      <Select
        value={(columnFilterValue as string) ?? "all"}
        onValueChange={(value) =>
          column.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue
            placeholder={`Select ${
              translatedColumnId[
                columnId as keyof typeof inscriptions.$inferSelect
              ]
            }...`}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (columnId === "location" || columnId === "country") {
    // Extract unique values for these columns
    const uniqueValues = new Set<string>();
    data.forEach((row) => {
      uniqueValues.add(
        row[columnId as keyof typeof inscriptions.$inferSelect] as string
      );
    });

    const options = Array.from(uniqueValues)
      .sort()
      .map((value) => ({
        value,
        label: value,
      }));

    return (
      <Select
        value={(columnFilterValue as string) ?? "all"}
        onValueChange={(value) =>
          column.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue
            placeholder={`Choisir ${
              translatedColumnId[
                columnId as keyof typeof inscriptions.$inferSelect
              ]
            }...`}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (columnId === "codexNumbers") {
    // Create a unique list of codex numbers
    const uniqueCodex = new Set<string>();
    data.forEach((row) => {
      row.codexNumbers.forEach((codex: string) => uniqueCodex.add(codex));
    });

    const options = Array.from(uniqueCodex)
      .sort((a, b) => {
        // Try to convert to numbers and compare numerically
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);

        // If both are valid numbers, compare numerically
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }

        // Fall back to string comparison
        return a.localeCompare(b);
      })
      .map((value) => ({
        value,
        label: value,
      }));

    return (
      <Select
        value={(columnFilterValue as string) ?? "all"}
        onValueChange={(value) =>
          column.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={`Choisir codex...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else {
    // Default text filter for other columns
    return (
      <DebouncedInput
        value={(columnFilterValue as string) ?? ""}
        onChange={(value) => column.setFilterValue(value)}
        placeholder={`Rechercher par ${
          translatedColumnId[
            column.id as keyof typeof inscriptions.$inferSelect
          ]
        }`}
        className="max-w-sm"
      />
    );
  }
}

export default function Home() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const {data, isLoading} = useQuery<(typeof inscriptions.$inferSelect)[]>({
    queryKey: ["inscriptions"],
    queryFn: () => fetch("/api/inscriptions").then((res) => res.json()),
  });

  const colorBadgePerDiscipline: Record<
    (typeof inscriptions.$inferSelect)["disciplines"][number],
    string
  > = {
    SL: "bg-blue-500",
    GS: "bg-green-500",
    SG: "bg-yellow-500",
    DH: "bg-red-500",
    AC: "bg-purple-500",
  };
  const colorBadgePerRaceLevel: Record<
    (typeof inscriptions.$inferSelect)["raceLevels"][number],
    string
  > = {
    FIS: "bg-blue-500",
    CIT: "bg-green-500",
    NJR: "bg-yellow-500",
    NJC: "bg-red-500",
    NC: "bg-orange-500",
    SAC: "bg-black",
    ANC: "bg-gray-500",
    ENL: "bg-purple-500",
  };

  const columns: ColumnDef<typeof inscriptions.$inferSelect>[] = [
    {
      id: "actions",
      cell: ({row}) => {
        return (
          <Link href={`/inscriptions/${row.original.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base"
            >
              Voir détails
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
      header: ({column}) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date de la 1ère course
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
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
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "disciplines",
      header: "Disciplines",
      cell: ({row}) => {
        return (
          <div className="flex gap-2">
            {row.original.disciplines.map(
              (
                discipline: (typeof inscriptions.$inferSelect)["disciplines"][number]
              ) => (
                <Badge
                  key={discipline}
                  className={colorBadgePerDiscipline[discipline]}
                >
                  {discipline}
                </Badge>
              )
            )}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.disciplines.includes(filterValue);
      },
    },
    {
      accessorKey: "codexNumbers",
      header: "Codex",
      cell: ({row}) => {
        return (
          <div className="flex gap-2">
            {row.original.codexNumbers.map(
              (
                codexNumber: (typeof inscriptions.$inferSelect)["codexNumbers"][number]
              ) => (
                <Badge key={codexNumber} variant={"outline"}>
                  {codexNumber}
                </Badge>
              )
            )}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.codexNumbers.some((codex) =>
          codex.toLowerCase().includes((filterValue as string).toLowerCase())
        );
      },
    },
    {
      accessorKey: "raceLevels",
      header: "Race Levels",
      cell: ({row}) => {
        return (
          <div className="flex gap-2">
            {row.original.raceLevels.map(
              (
                raceLevel: (typeof inscriptions.$inferSelect)["raceLevels"][number]
              ) => (
                <Badge
                  key={raceLevel}
                  className={colorBadgePerRaceLevel[raceLevel]}
                >
                  {raceLevel}
                </Badge>
              )
            )}
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        if (!filterValue) return true;
        return row.original.raceLevels.includes(filterValue);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <>
                          <div>
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          {header.column.getCanFilter() ? (
                            <div className="mt-2">
                              <Filter
                                column={header.column}
                                data={data ?? []}
                              />
                            </div>
                          ) : null}
                        </>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
    </div>
  );
}
