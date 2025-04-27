import React, {useState, useCallback, useEffect} from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {Checkbox} from "@/components/ui/checkbox";
import AsyncCompetitorCombobox from "./AsyncCompetitorCombobox";

const MIN_SEARCH_LENGTH = 7;

// Hook debounce simple
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Remplace le useEffect par un hook react-query
function useCompetitors(search: string) {
  return useQuery({
    queryKey: ["competitors", search],
    queryFn: async () => {
      if (search.length < MIN_SEARCH_LENGTH) return [];
      const res = await fetch(
        `/api/competitors?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Erreur API");
      return res.json();
    },
    enabled: search.length >= MIN_SEARCH_LENGTH,
  });
}

function useSaveCompetitors(inscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      competitorIds,
      codexNumbers,
    }: {
      competitorIds: string[];
      codexNumbers: string[];
    }) => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/save-competitors`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({competitorIds, codexNumbers}),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-competitors", inscriptionId],
      });
    },
  });
}

export default function AddCompetitorModal({
  inscriptionId,
  codexList,
  defaultCodex,
}: {
  inscriptionId: string;
  codexList: string[];
  defaultCodex: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [selectedCodex, setSelectedCodex] = useState<string[]>([defaultCodex]);

  useEffect(() => {
    setSelectedCodex([defaultCodex]);
  }, [defaultCodex]);

  const {data: results = [], isLoading: loading} =
    useCompetitors(debouncedSearch);

  console.log(results, loading);
  const {mutate: saveCompetitors, isPending: saving} =
    useSaveCompetitors(inscriptionId);

  const handleSave = useCallback(() => {
    if (!selectedId || selectedCodex.length === 0) return;
    saveCompetitors(
      {competitorIds: [selectedId], codexNumbers: selectedCodex},
      {
        onSuccess: () => {
          setOpen(false);
          setSearch("");
          setSelectedId(undefined);
        },
      }
    );
  }, [selectedId, selectedCodex, saveCompetitors]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setSearch("");
          setSelectedId(undefined);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-base"
        >
          Ajouter un compétiteur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un compétiteur</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <AsyncCompetitorCombobox
            value={selectedId}
            onChange={setSelectedId}
            placeholder="Sélectionner un compétiteur"
          />
          <div>
            <div className="mb-2 font-medium">Pour quels codex ?</div>
            <div className="flex flex-wrap gap-2">
              {codexList.map((codex) => (
                <label key={codex} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCodex.includes(codex)}
                    onCheckedChange={(checked) => {
                      setSelectedCodex((prev) =>
                        checked
                          ? [...prev, codex]
                          : prev.filter((c) => c !== codex)
                      );
                    }}
                  />
                  {codex}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!selectedId || selectedCodex.length === 0 || saving}
          >
            {saving ? "Ajout..." : "OK"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
