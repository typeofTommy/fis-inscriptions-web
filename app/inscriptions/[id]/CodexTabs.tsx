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
  genderFilter: "both" | "M" | "W";
}

async function fetchInscription(id: string): Promise<Inscription> {
  const response = await fetch(`/api/inscriptions/${id}`);
  if (!response.ok)
    throw new Error("Erreur lors de la récupération de l'inscription");
  return response.json();
}

export function CodexTabs({inscriptionId, genderFilter}: CodexTabsProps) {
  const {
    data: inscription,
    isLoading,
    error,
  } = useQuery<Inscription, Error>({
    queryKey: ["inscriptions", inscriptionId],
    queryFn: () => fetchInscription(inscriptionId),
  });
  const permissionToEdit = usePermissionToEdit(
    inscription,
    "manageCompetitorInscriptions"
  );

  const competitionsFromInscription = inscription?.eventData.competitions;

  const filteredAndSortedCompetitions = React.useMemo(() => {
    if (!competitionsFromInscription) return [];
    const relevantCompetitions =
      genderFilter === "both"
        ? competitionsFromInscription
        : competitionsFromInscription.filter(
            (comp) => comp.genderCode === genderFilter
          );
    return relevantCompetitions.sort((a, b) => a.codex - b.codex);
  }, [competitionsFromInscription, genderFilter]);

  const [activeCodex, setActiveCodex] = React.useState<number | undefined>();

  React.useEffect(() => {
    if (filteredAndSortedCompetitions.length > 0) {
      const currentActiveCodexStillValid = filteredAndSortedCompetitions.some(
        (comp) => comp.codex === activeCodex
      );
      if (!currentActiveCodexStillValid) {
        setActiveCodex(filteredAndSortedCompetitions[0].codex);
      }
    } else {
      setActiveCodex(undefined);
    }
    // activeCodex is included as a dependency because if it's undefined initially,
    // this effect should run to set it based on the first item in filteredAndSortedCompetitions.
    // If filteredAndSortedCompetitions itself changes (e.g. genderFilter prop changes),
    // this effect also re-evaluates and ensures activeCodex is valid or reset.
  }, [filteredAndSortedCompetitions, activeCodex]);

  if (isLoading)
    return <Loader2 className="mx-auto my-10 h-8 w-8 animate-spin" />;
  if (error)
    return (
      <div className="mt-8 text-center">
        Erreur lors du chargement des codex: {error.message}
      </div>
    );
  if (!competitionsFromInscription?.length) {
    return (
      <div className="mt-8 text-center">
        Aucun codex pour cette inscription.
      </div>
    );
  }

  if (filteredAndSortedCompetitions.length === 0) {
    const genderText =
      genderFilter === "M" ? "hommes" : genderFilter === "W" ? "femmes" : "";
    return (
      <div className="mt-8 text-center">
        {genderFilter === "both"
          ? "Aucun codex disponible."
          : `Aucun codex ne correspond au filtre pour les ${genderText}.`}
      </div>
    );
  }

  // currentOrDefaultActiveCodex is critical for controlled Tab component and other dependent UI elements
  // It ensures that even if activeCodex state update is pending (e.g. after filter change),
  // the UI has a valid codex to work with if one exists in the filtered list.
  const currentOrDefaultActiveCodex =
    activeCodex ?? filteredAndSortedCompetitions[0]?.codex;

  let modalGender: "M" | "W";
  if (genderFilter !== "both") {
    modalGender = genderFilter;
  } else {
    modalGender =
      filteredAndSortedCompetitions.find(
        (c) => c.codex === currentOrDefaultActiveCodex
      )?.genderCode || "M"; // Fallback to "M" if no specific codex found or genderless (should not happen)
  }

  return (
    <>
      <Tabs
        className="mt-8"
        onValueChange={(value) => setActiveCodex(Number(value))}
        value={currentOrDefaultActiveCodex?.toString()} // Controlled component using a potentially immediately available default
      >
        <div className="overflow-x-auto overflow-y-hidden pt-2 pb-2">
          <TabsList className="bg-transparent flex-nowrap gap-4">
            {filteredAndSortedCompetitions.map((competition) => (
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
          {permissionToEdit &&
          inscription?.status === "open" &&
          currentOrDefaultActiveCodex ? (
            <AddCompetitorModal
              inscriptionId={inscriptionId}
              defaultCodex={currentOrDefaultActiveCodex} // Use the derived active codex
              gender={modalGender}
              codexData={filteredAndSortedCompetitions} // Pass the filtered list, should be CompetitionItem[]
            />
          ) : !permissionToEdit ? (
            <div className="text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded px-4 py-2">
              Vous n&apos;avez pas les droits pour ajouter des compétiteurs sur
              cet évènement.
            </div>
          ) : inscription?.status !== "open" ? (
            <div className="text-sm text-slate-500 bg-slate-100 border border-slate-200 rounded px-4 py-2">
              L&apos;inscription / désincription n&apos;est possible que lorsque
              l&apos;inscription est <b>ouverte</b>.
            </div>
          ) : null}
        </div>
        {filteredAndSortedCompetitions.map((competition) => (
          <TabsContent
            key={competition.codex}
            value={competition.codex.toString()}
          >
            <Competitors
              inscriptionId={inscriptionId}
              codexNumber={competition.codex}
              discipline={competition.eventCode}
              genderFilter={genderFilter} // Pass the main genderFilter prop
            />
          </TabsContent>
        ))}
      </Tabs>
      {currentOrDefaultActiveCodex &&
        filteredAndSortedCompetitions.length > 0 && (
          <TotalInscriptionsInfo
            inscriptionId={inscriptionId}
            codexNumber={currentOrDefaultActiveCodex}
            discipline={
              filteredAndSortedCompetitions.find(
                (c) => c.codex === currentOrDefaultActiveCodex
              )?.eventCode || filteredAndSortedCompetitions[0].eventCode // Fallback safely
            }
            genderFilter={genderFilter}
          />
        )}
    </>
  );
}

const TotalInscriptionsInfo = ({
  inscriptionId,
  codexNumber,
  discipline,
  genderFilter,
}: {
  inscriptionId: string;
  codexNumber: number;
  discipline: string;
  genderFilter: "both" | "M" | "W";
}) => {
  const {data, isLoading} = useInscriptionCompetitors(
    inscriptionId,
    codexNumber,
    discipline
  );

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    // The Competitors component (and thus useInscriptionCompetitors) might already handle filtering by its own gender if needed.
    // This TotalInscriptionsInfo is for *this specific codex tab*.
    // The genderFilter prop here is the *overall* filter for the tabs.
    // If we want to show count for current tab respecting the overall gender filter:
    if (genderFilter === "both") return data;
    return data.filter((competitor: any) => competitor.gender === genderFilter);
  }, [data, genderFilter]);

  return (
    <div className="text-xl text-center text-slate-500 mt-8 mb-2 border-t border-slate-200 pt-2">
      Nombre total d&apos;inscriptions sur ce codex :{" "}
      <b>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin inline-block" />
        ) : (
          filteredData?.length ?? 0
        )}
      </b>
    </div>
  );
};
