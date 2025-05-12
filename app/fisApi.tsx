import {useQuery} from "@tanstack/react-query";
import {Competition} from "./types";

/**
 * Fetch competition details by codex from the FIS public API.
 * @param disciplineCode - The discipline code (e.g., 'AL' for Alpine)
 * @param codex - The competition codex (unique identifier)
 */
export const useCompetitionByCodex = (codex: number) => {
  return useQuery<Competition>({
    queryKey: ["competitionByCodex", codex],
    queryFn: async () => {
      if (!codex) throw new Error("Codex is required");
      const res = await fetch(
        `/api/fis-api/codex/competition-by-codex?codex=${codex}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error("Codex non trouvé");
        }
        throw new Error("API error");
      }
      return res.json();
    },
    enabled: !!codex,
    retry: false,
  });
};
