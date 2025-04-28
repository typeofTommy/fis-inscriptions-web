"use client";

import {useQuery} from "@tanstack/react-query";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Competitors} from "./Competitors";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";
import {colorBadgePerGender} from "@/app/lib/colorMappers";
import AddCompetitorModal from "./AddCompetitorModal";
import React, {useMemo} from "react";
import {usePermissionToEdit} from "./usePermissionToEdit";

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

  const permissionToEdit = usePermissionToEdit(inscription);

  const [activeCodex, setActiveCodex] = React.useState<string | undefined>(
    undefined
  );
  const codexData = useMemo(() => inscription?.codexData || [], [inscription]);

  React.useEffect(() => {
    if (!activeCodex && codexData.length > 0) {
      setActiveCodex(codexData[0].number);
    }
  }, [activeCodex, codexData]);

  if (error) return <div>Erreur lors du chargement des codex</div>;
  if ((!Array.isArray(codexData) || codexData.length === 0) && !isLoading) {
    return <div>Aucun codex pour cette inscription.</div>;
  }

  if (isLoading) return null;

  return (
    <Tabs
      defaultValue={codexData[0].number}
      className="mt-8"
      onValueChange={setActiveCodex}
      value={activeCodex}
    >
      <TabsList>
        {codexData.map((codex) => (
          <TabsTrigger
            key={codex.number}
            value={codex.number}
            className="min-w-[140px] h-12 text-lg px-6 py-3 cursor-pointer"
          >
            Codex {codex.number}
            <Badge
              className={`ml-2 text-base px-3 py-1 ${
                colorBadgePerDiscipline[codex.discipline] || ""
              }`}
            >
              {codex.discipline}
            </Badge>
            <Badge
              className={`ml-2 text-base px-3 py-1 ${
                colorBadgePerGender[codex.sex === "F" ? "W" : "M"] || ""
              } text-white`}
            >
              {codex.sex}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="flex justify-end mb-4">
        {permissionToEdit && inscription?.status === "open" ? (
          <AddCompetitorModal
            inscriptionId={inscriptionId}
            defaultCodex={activeCodex || codexData[0].number}
            gender={
              inscription?.codexData.find((c) => c.number === activeCodex)
                ?.sex === "F"
                ? "W"
                : "M"
            }
            codexData={codexData}
          />
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
      {codexData.map((codex) => (
        <TabsContent key={codex.number} value={codex.number}>
          <Competitors
            inscriptionId={inscriptionId}
            codexNumber={codex.number}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
