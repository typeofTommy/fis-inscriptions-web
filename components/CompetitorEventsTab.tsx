"use client";
import {useQuery} from "@tanstack/react-query";
import {useState, useEffect} from "react";
import {Badge} from "@/components/ui/badge";
import {format, parseISO} from "date-fns";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";
import {Competitor, CompetitorInscriptionDetail, CodexItem} from "@/app/types";

function useAllCompetitorsWithInscriptions() {
  return useQuery<Competitor[], Error>({
    queryKey: ["all-competitors-with-inscriptions"],
    queryFn: async () => {
      const resM = await fetch(`/api/competitors/with-inscriptions?gender=M`);
      const resW = await fetch(`/api/competitors/with-inscriptions?gender=W`);
      if (!resM.ok && !resW.ok) throw new Error("Erreur API");
      const dataM: Competitor[] = resM.ok ? await resM.json() : [];
      const dataW: Competitor[] = resW.ok ? await resW.json() : [];
      return [...dataM, ...dataW];
    },
  });
}

export function CompetitorEventsTab() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<"M" | "W" | undefined>(undefined);
  const {data: allResults = [], isLoading: loadingAll} =
    useAllCompetitorsWithInscriptions();
  const results: Competitor[] = gender
    ? allResults.filter((c: Competitor) => c.gender === gender)
    : [];

  const {data: competitor, isLoading: loadingCompetitor} = useQuery<
    Competitor | null,
    Error
  >({
    queryKey: ["competitor", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/competitors/${selectedId}`);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!selectedId,
  });

  const {data: inscriptions, isLoading: loadingInscriptions} = useQuery<
    CompetitorInscriptionDetail[],
    Error
  >({
    queryKey: ["competitor-inscriptions", selectedId],
    queryFn: async () => {
      if (!selectedId) return [];
      const res = await fetch(`/api/competitors/${selectedId}/inscriptions`);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!selectedId,
  });

  // Reset selectedId quand le genre change
  useEffect(() => {
    setSelectedId(undefined);
  }, [gender]);

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="flex gap-4 mb-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value="M"
            checked={gender === "M"}
            onChange={() => setGender("M")}
            className="cursor-pointer"
          />
          Homme
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="gender"
            value="W"
            checked={gender === "W"}
            onChange={() => setGender("W")}
            className="cursor-pointer"
          />
          Femme
        </label>
      </div>
      {gender ? (
        <>
          <select
            className="w-full px-3 py-2 border rounded mt-2"
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loadingAll || results.length === 0}
          >
            <option value="" disabled>
              {loadingAll
                ? "Chargement..."
                : results.length === 0
                ? "Aucun compétiteur trouvé"
                : "Sélectionner un compétiteur"}
            </option>
            {results
              .sort((a: Competitor, b: Competitor) =>
                (a.lastname ?? "").localeCompare(b.lastname ?? "")
              )
              .map((c: Competitor) => (
                <option key={c.competitorid} value={c.competitorid}>
                  {c.lastname} {c.firstname}
                </option>
              ))}
          </select>
        </>
      ) : null}
      {loadingCompetitor && (
        <div className="mt-4">Chargement du compétiteur...</div>
      )}
      {competitor && (
        <div className="mt-4 p-4 bg-slate-50 rounded border">
          <div className="font-bold text-lg mb-2">
            {competitor.firstname} {competitor.lastname} (
            {competitor.nationcode})
          </div>
          <div className="text-sm text-slate-600 mb-2">
            FIS: {competitor.fiscode} | Sexe: {competitor.gender} | Naissance:{" "}
            {competitor.birthdate
              ? format(parseISO(competitor.birthdate), "dd/MM/yyyy")
              : "N/A"}
          </div>
        </div>
      )}
      {loadingInscriptions && (
        <div className="mt-4">Chargement des évènements...</div>
      )}
      {inscriptions && inscriptions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">
            Évènements et codex où le compétiteur est inscrit :
            {` (${inscriptions.length} événement${
              inscriptions.length !== 1 ? "s" : ""
            }, ${inscriptions.reduce(
              (acc, curr) => acc + curr.codexList.length,
              0
            )} codex)`}
          </h3>
          <ul className="space-y-4">
            {[...(inscriptions ?? [])]
              .sort(
                (
                  a: CompetitorInscriptionDetail,
                  b: CompetitorInscriptionDetail
                ) =>
                  new Date(a.eventStartDate).getTime() -
                  new Date(b.eventStartDate).getTime()
              )
              .map((insc: CompetitorInscriptionDetail) => (
                <li
                  key={insc.inscriptionId.toString()}
                  className="border rounded p-3 bg-white"
                >
                  <div className="font-medium text-base mb-1">
                    <a
                      href={`/inscriptions/${insc.inscriptionId}`}
                      className="underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {insc.eventPlace}
                      {insc.eventStartDate
                        ? ` – ${(() => {
                            try {
                              return format(
                                parseISO(insc.eventStartDate),
                                "dd/MM/yyyy"
                              );
                            } catch {
                              return insc.eventStartDate;
                            }
                          })()}`
                        : ""}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insc.codexList.map((codex: CodexItem) => (
                      <Badge
                        key={codex.displayCodex}
                        className={`text-xs px-2 py-1 ${
                          colorBadgePerDiscipline[
                            codex.eventCode as keyof typeof colorBadgePerDiscipline
                          ] || ""
                        }`}
                      >
                        {`${codex.displayCodex} - ${codex.eventCode}`}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
      {inscriptions &&
        inscriptions.length === 0 &&
        selectedId &&
        !loadingInscriptions && (
          <div className="mt-4 text-slate-500">
            Aucune inscription trouvée pour ce compétiteur.
          </div>
        )}
    </div>
  );
}
