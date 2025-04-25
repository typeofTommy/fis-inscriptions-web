"use client";
import {useQuery} from "@tanstack/react-query";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {DataGrid, FilterPanel, SearchPanel} from "devextreme-react/data-grid";
import "devextreme/dist/css/dx.fluent.saas.light.css";

export default function Home() {
  const {data, isLoading} = useQuery<(typeof inscriptions.$inferSelect)[]>({
    queryKey: ["inscriptions"],
    queryFn: () => fetch("/api/inscriptions").then((res) => res.json()),
  });

  if (isLoading) {
    return <div>Chargement des inscriptions...</div>;
  }

  return (
    <DataGrid
      dataSource={data} // Assign the data source
    >
      <FilterPanel />
      <SearchPanel />
    </DataGrid>
  );
}
