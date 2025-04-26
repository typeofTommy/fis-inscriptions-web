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
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {useQuery} from "@tanstack/react-query";
import {aCompetitor} from "@/drizzle/schemaFis";

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

export default function AddCompetitorModal({
  onAdd,
}: {
  onAdd: (competitor: typeof aCompetitor.$inferSelect) => void;
}) {
  type Competitor = typeof aCompetitor.$inferSelect;
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [selectedId, setSelectedId] = useState<
    Competitor["competitorid"] | undefined
  >();

  const {data: results = [], isLoading: loading} =
    useCompetitors(debouncedSearch);

  const handleAdd = useCallback(() => {
    const competitor = results.find(
      (c: Competitor) => c.competitorid === selectedId
    );
    if (competitor) {
      onAdd(competitor);
      setOpen(false);
      setSearch("");
      setSelectedId(undefined);
    }
  }, [onAdd, results, selectedId]);

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
          <Input
            placeholder={`Nom ou prénom (${MIN_SEARCH_LENGTH} caractères min)`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          {loading && <div>Recherche...</div>}
          {results.length > 0 && (
            <div>{results.length} compétiteur(s) trouvé(s)</div>
          )}
          <Select
            value={selectedId?.toString()}
            onValueChange={(value) => setSelectedId(Number(value))}
            disabled={results.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un compétiteur" />
            </SelectTrigger>
            <SelectContent>
              {results.map((c: Competitor) => (
                <SelectItem
                  key={c.competitorid}
                  value={c.competitorid.toString()}
                >
                  {c.firstname} {c.lastname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button onClick={handleAdd} disabled={!selectedId}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
