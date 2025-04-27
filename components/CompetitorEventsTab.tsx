"use client";
import {useQuery} from "@tanstack/react-query";
import {useState, useEffect} from "react";
import {Badge} from "@/components/ui/badge";
import {format, parseISO} from "date-fns";
import {colorBadgePerDiscipline} from "@/app/lib/colorMappers";

const MIN_SEARCH_LENGTH = 3;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function useCompetitorsSearch(search: string, gender: "M" | "W") {
  return useQuery({
    queryKey: ["competitors", search, gender],
    queryFn: async () => {
      if (search.length < MIN_SEARCH_LENGTH) return [];
      const res = await fetch(
        `/api/competitors?search=${encodeURIComponent(search)}&gender=${gender}`
      );
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: search.length >= MIN_SEARCH_LENGTH,
  });
}

export function CompetitorEventsTab() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [gender, setGender] = useState<"M" | "W" | undefined>(undefined);
  const debouncedSearch = useDebounce(search, 400);
  const {data: results = [], isLoading: loading} = useCompetitorsSearch(
    debouncedSearch,
    gender as "M" | "W"
  );
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
          <input
            className="w-full px-3 py-2 border rounded"
            placeholder="Nom ou prénom (3 caractères min)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="w-full px-3 py-2 border rounded mt-2"
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || results.length === 0}
          >
            <option value="" disabled>
              {loading
                ? "Chargement..."
                : results.length === 0
                ? "Aucun compétiteur trouvé"
                : "Sélectionner un compétiteur"}
            </option>
            {results.map((c: any) => (
              <option key={c.competitorid} value={c.competitorid}>
                {c.firstname} {c.lastname} ({c.nationcode})
              </option>
            ))}
          </select>
        </>
      ) : (
        <div className="text-slate-500 mt-2">
          Veuillez d&apos;abord choisir un genre.
        </div>
      )}
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
            {competitor.birthdate}
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
