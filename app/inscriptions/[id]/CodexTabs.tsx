"use client";

import React from "react";
import {useQuery} from "@tanstack/react-query";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {Badge} from "@/components/ui/badge";
import {Competitors, useInscriptionCompetitors} from "./Competitors";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";
import {colorBadgePerGender} from "@/app/lib/colorMappers";
import AddCompetitorModal from "./AddCompetitorModal";
import {usePermissionToEdit} from "./usePermissionToEdit";
import {Inscription} from "@/app/types";
import {Loader2} from "lucide-react";

interface CodexTabsProps {
  inscriptionId: string;
}

async function fetchInscription(id: string): Promise<Inscription> {
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
    queryKey: ["inscriptions", inscriptionId],
    queryFn: () => fetchInscription(inscriptionId),
  });
  const permissionToEdit = usePermissionToEdit(inscription);

  const [activeCodex, setActiveCodex] = React.useState<number | undefined>(
    undefined
  );

  const competitions = inscription?.eventData.competitions;

  React.useEffect(() => {
    if (!activeCodex && competitions?.length) {
      setActiveCodex(competitions[0].codex);
    }
  }, [activeCodex, competitions]);

  if (error) return <div>Erreur lors du chargement des codex</div>;
  if (!competitions?.length && !isLoading) {
    return <div>Aucun codex pour cette inscription.</div>;
  }

  if (isLoading) return null;

  if (!competitions) return null;

  return (
    <>
      <Tabs
        defaultValue={competitions?.[0].codex.toString()}
        className="mt-8 "
        onValueChange={(value) => setActiveCodex(Number(value))}
        value={activeCodex?.toString()}
      >
        <div className="overflow-x-auto overflow-y-hidden pb-2">
          <TabsList className="bg-transparent flex-nowrap gap-4">
            {competitions
              ?.sort((a, b) => a.codex - b.codex)
              .map((competition) => (
                <TabsTrigger
                  key={competition.codex}
                  value={competition.codex.toString()}
                  className="min-w-[140px] h-12 text-lg px-6 py-3 cursor-pointer border border-slate-200 rounded-md transition-all duration-150 font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-slate-300 data-[state=active]:text-black data-[state=active]:font-bold data-[state=active]:z-10 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:border-slate-200 data-[state=inactive]:shadow-none data-[state=inactive]:z-0"
                >
                  Codex {competition.codex}
                  <Badge
                    className={`ml-2 text-base px-3 py-1 ${
                      colorBadgePerDiscipline[competition.eventCode] || ""
                    }`}
                  >
                    {competition.eventCode}
                  </Badge>
                  <Badge
                    className={`ml-2 text-base px-3 py-1 ${
                      colorBadgePerGender[competition.genderCode] || ""
                    } text-white`}
                  >
                    {competition.genderCode}
                  </Badge>
                </TabsTrigger>
              ))}
          </TabsList>
        </div>
        <div className="flex justify-end mb-4">
          {permissionToEdit && inscription?.status === "open" ? (
            <AddCompetitorModal
              inscriptionId={inscriptionId}
              defaultCodex={activeCodex || competitions?.[0].codex}
              gender={
                competitions.find((c) => c.codex === activeCodex)?.genderCode ||
                "M"
              }
              codexData={competitions}
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
        {competitions.map((competition) => (
          <TabsContent
            key={competition.codex}
            value={competition.codex.toString()}
          >
            <Competitors
              inscriptionId={inscriptionId}
              codexNumber={competition.codex}
              discipline={competition.eventCode}
            />
          </TabsContent>
        ))}
      </Tabs>
      <TotalInscriptionsInfo
        inscriptionId={inscriptionId}
        codexNumber={activeCodex || competitions[0].codex}
        discipline={
          competitions.find((c) => c.codex === activeCodex)?.eventCode ||
          competitions[0].eventCode
        }
      />
    </>
  );
}

// Composant pour afficher le nombre total d'inscriptions
const TotalInscriptionsInfo = ({
  inscriptionId,
  codexNumber,
  discipline,
}: {
  inscriptionId: string;
  codexNumber: number;
  discipline: string;
}) => {
  const {data, isLoading} = useInscriptionCompetitors(
    inscriptionId,
    codexNumber,
    discipline
  );

  return (
    <div className="text-xl text-center text-slate-500 mt-8 mb-2 border-t border-slate-200 pt-2">
      Nombre total d&apos;inscriptions sur ce codex :{" "}
      <b>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin inline-block" />
        ) : (
          data?.length
        )}
      </b>
    </div>
  );
};
