import {
  UseBaseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {fetchCountries, useDebouncedValue} from "./lib";
import {inscriptions} from "@/drizzle/schemaInscriptions";
import {Inscription} from "@/app/types";

export const useCountries = () => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60, // 1 heure
    refetchOnWindowFocus: false,
  });
};

export const useStations = () => {
  return useQuery({
    queryKey: ["stations"],
    queryFn: () => fetch("/api/stations").then((res) => res.json()),
    staleTime: 1000 * 60 * 60, // 1 heure
    gcTime: 1000 * 60 * 60, // 1 heure
  });
};

export const useCreateInscription = () => {
  const createInscription = useMutation({
    mutationFn: async (
      inscription: Omit<typeof inscriptions.$inferInsert, "id" | "createdAt">
    ) => {
      const response = await fetch("/api/inscriptions", {
        method: "POST",
        body: JSON.stringify(inscription),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement de l'inscription");
      }
      return response.json();
    },
  });
  return {createInscription};
};

// Hook pour vérifier un codex
export const useCodexCheck = (codex: string, inscriptionId?: string) => {
  const debouncedCodex = useDebouncedValue(codex, 400);
  const query = useQuery({
    queryKey: ["codex-check", debouncedCodex, inscriptionId],
    queryFn: async () => {
      if (!debouncedCodex || debouncedCodex.length < 3) return {exists: false};
      let url = `/api/codex/check?number=${encodeURIComponent(debouncedCodex)}`;
      if (inscriptionId) {
        url += `&excludeId=${encodeURIComponent(inscriptionId)}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: !!debouncedCodex && debouncedCodex.length >= 3,
    staleTime: 1000 * 60,
  });
  return {...query, debouncedCodex};
};

async function fetchInscription(id: string): Promise<Inscription> {
  const response = await fetch(`/api/inscriptions/${id}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération de l&apos;inscription");
  }
  return response.json();
}

export const useInscription = (
  id: string,
  queryOptions?: Partial<UseBaseQueryOptions<Inscription, Error>>
) => {
  return useQuery<Inscription>({
    queryKey: ["inscriptions", id],
    queryFn: () => fetchInscription(id),
    ...queryOptions,
  });
};

export const useUpdateInscription = () => {
  const updateInscription = useMutation({
    mutationFn: async (inscription: Partial<Inscription>) => {
      const response = await fetch(`/api/inscriptions/${inscription.id}`, {
        method: "PATCH",
        body: JSON.stringify(inscription),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de l'inscription");
      }
      return response.json();
    },
  });
  return {updateInscription};
};
