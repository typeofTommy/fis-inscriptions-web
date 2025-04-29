import {useQuery} from "@tanstack/react-query";

/**
 * Fetch competition details by codex from the FIS public API.
 * @param disciplineCode - The discipline code (e.g., 'AL' for Alpine)
 * @param codex - The competition codex (unique identifier)
 */
export const useCompetitionByCodex = (codex: number) => {
  return useQuery({
    queryKey: ["competitionByCodex", codex],
    queryFn: async () => {
      if (!codex) throw new Error("Codex is required");
      const res = await fetch(
        `/fis-api/codex/competition-by-codex?codex=${codex}`
      );
      if (!res.ok) throw new Error("API error");
      return res.json();
    },
    enabled: !!codex,
  });
};
