"use client";
import {useQuery} from "@tanstack/react-query";
import {useState, useEffect} from "react";
import {Badge} from "@/components/ui/badge";
import {format, parseISO} from "date-fns";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";

function useAllCompetitorsWithInscriptions() {
  return useQuery({
    queryKey: ["all-competitors-with-inscriptions"],
    queryFn: async () => {
      const resM = await fetch(`/api/competitors/with-inscriptions?gender=M`);
      const resW = await fetch(`/api/competitors/with-inscriptions?gender=W`);
      if (!resM.ok && !resW.ok) throw new Error("Erreur API");
      const dataM = resM.ok ? await resM.json() : [];
      const dataW = resW.ok ? await resW.json() : [];
      return [...dataM, ...dataW];
    },
  });
}

export function CompetitorEventsTab() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<"M" | "W" | undefined>(undefined);
  const {data: allResults = [], isLoading: loadingAll} =
    useAllCompetitorsWithInscriptions();
  const results = gender
    ? allResults.filter((c: any) => c.gender === gender)
    : [];

  const {data: competitor, isLoading: loadingCompetitor} = useQuery({
    queryKey: ["competitor", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const res = await fetch(`/api/competitors/${selectedId}`);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!selectedId,
  });

  const {data: inscriptions, isLoading: loadingInscriptions} = useQuery({
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
              .sort((a: any, b: any) => a.lastname.localeCompare(b.lastname))
              .map((c: any) => (
                <option key={c.competitorid} value={c.competitorid}>
                  {c.firstname} {c.lastname}
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
            {format(parseISO(competitor.birthdate), "dd/MM/yyyy")}
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
          </h3>
          <ul className="space-y-4">
            {[...inscriptions]
              .sort(
                (a, b) =>
                  new Date(a.firstRaceDate).getTime() -
                  new Date(b.firstRaceDate).getTime()
              )
              .map((insc: any) => (
                <li
                  key={insc.inscriptionId}
                  className="border rounded p-3 bg-white"
                >
                  <div className="font-medium text-base mb-1">
                    <a
                      href={`/inscriptions/${insc.inscriptionId}`}
                      className="underline text-blue-600"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {insc.location}
                      {insc.firstRaceDate
                        ? ` – ${(() => {
                            try {
                              return format(
                                parseISO(insc.firstRaceDate),
                                "dd/MM/yyyy"
                              );
                            } catch {
                              return insc.firstRaceDate;
                            }
                          })()}`
                        : ""}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insc.codexList.map((codex: any) => (
                      <span
                        key={codex.number}
                        className="flex items-center gap-1"
                      >
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            colorBadgePerDiscipline[codex.discipline] || ""
                          }`}
                        >
                          {codex.number}
                        </Badge>
                        <Badge
                          className={`text-xs px-2 py-1 ${
                            colorBadgePerDiscipline[codex.discipline] || ""
                          }`}
                        >
                          {codex.discipline}
                        </Badge>
                      </span>
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
