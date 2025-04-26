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
import {
  colorBadgePerDiscipline,
  colorBadgePerRaceLevel,
} from "./lib/colorMappers";

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
  }, [value, onChange, debounce]);

  return (
    <Input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="max-w-sm"
    />
  );
}

const translatedColumnId: Record<string, string> = {
  codex: "codex",
  discipline: "discipline",
  raceLevel: "raceLevel",
  firstRaceDate: "date",
  lastRaceDate: "date fin",
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
  } else if (columnId === "discipline" || columnId === "raceLevel") {
    // Unique disciplines/raceLevels from codexData
    const uniqueValues = new Set<string>();
    data.forEach((row) => {
      row.codexData.forEach((c: any) => {
        if (columnId === "discipline") uniqueValues.add(c.discipline);
        if (columnId === "raceLevel") uniqueValues.add(c.raceLevel);
      });
    });
    const options = Array.from(uniqueValues)
      .sort()
      .map((v) => ({value: v, label: v}));
    return (
      <Select
        value={(columnFilterValue as string) ?? "all"}
        onValueChange={(value) =>
          column.setFilterValue(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue
            placeholder={`Choisir ${translatedColumnId[columnId]}...`}
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
  } else if (columnId === "codex") {
    // Unique codex numbers from codexData
    const uniqueCodex = new Set<string>();
    data.forEach((row) => {
      row.codexData.forEach((c: any) => uniqueCodex.add(c.number));
    });
    const options = Array.from(uniqueCodex)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((value) => ({value, label: value}));
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
      id: "codex",
      header: "Codex",
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
