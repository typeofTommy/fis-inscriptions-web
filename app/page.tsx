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
} from "@tanstack/react-table";
import {TableBody, TableCell, TableHead} from "@/components/ui/table";
import {Table, TableHeader, TableRow} from "@/components/ui/table";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {ArrowUpDown} from "lucide-react";
import {Badge} from "@/components/ui/badge";

export default function Home() {
  const [sorting, setSorting] = useState<SortingState>([]);

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
      accessorKey: "firstRaceDate",
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
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div>Chargement des inscriptions...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
