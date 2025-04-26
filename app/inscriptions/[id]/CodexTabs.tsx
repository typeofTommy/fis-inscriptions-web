"use client";

import {useQuery} from "@tanstack/react-query";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Competitors} from "./Competitors";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";

interface CodexTabsProps {
  inscriptionId: string;
}

async function fetchInscription(
  id: string
): Promise<typeof inscriptions.$inferSelect> {
  const response = await fetch(`/api/inscriptions/${id}`);
  if (!response.ok)
    throw new Error("Erreur lors de la récupération de l'inscription");
  return response.json();
}

export function CodexTabs({inscriptionId}: CodexTabsProps) {
  const {
    data: inscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inscription", inscriptionId],
    queryFn: () => fetchInscription(inscriptionId),
  });

  if (isLoading) return <div>Chargement...</div>;
  if (error || !inscription)
    return <div>Erreur lors du chargement des codex</div>;

  const codexData = inscription.codexData || [];
  if (!Array.isArray(codexData) || codexData.length === 0) {
    return <div>Aucun codex pour cette inscription.</div>;
  }

  return (
    <Tabs defaultValue={codexData[0].number} className="mt-8">
      <TabsList>
        {codexData.map((codex) => (
          <TabsTrigger
            key={codex.number}
            value={codex.number}
            className="min-w-[140px] h-12 text-lg px-6 py-3"
          >
            Codex {codex.number}
            <Badge
              className={`ml-2 text-base px-3 py-1 ${
                colorBadgePerDiscipline[codex.discipline] || ""
              }`}
            >
              {codex.discipline}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      {codexData.map((codex) => (
        <TabsContent key={codex.number} value={codex.number}>
          <Competitors />
        </TabsContent>
      ))}
    </Tabs>
  );
}
