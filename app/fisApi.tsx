import {useQuery} from "@tanstack/react-query";
import {Competition} from "./types";

/**
 * Fetch competition details by codex from the FIS public API.
 * @param codex - The competition codex (unique identifier)
 * @param enabled - Whether to enable the query (defaults to true)
 */
export const useCompetitionByCodex = (codex: number, enabled = true) => {
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
    enabled: enabled && !!codex,
    retry: false,
  });
};
