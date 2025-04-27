"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState} from "react";
import {Zap} from "lucide-react";

interface InscriptionActionsMenuProps {
  id: string;
  currentStatus: string;
}

export function InscriptionActionsMenu({
  id,
  currentStatus,
}: InscriptionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (status: "open" | "frozen" | "validated") => {
      const res = await fetch(`/api/inscriptions/${id}`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({status}),
      });
      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["inscription", id]});
      setOpen(false);
    },
  });

  const handleStatus = (status: "open" | "frozen" | "validated") => {
    if (currentStatus === status) return;
    mutation.mutate(status);
  };

  const handleGeneratePDF = () => {
    // Placeholder: à remplacer par la vraie génération PDF
    alert("Génération du PDF à implémenter");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2 w-24"
        >
          <Zap className="w-4 h-4" />
          Actions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 flex flex-col gap-1 items-start text-left">
        {currentStatus !== "open" && (
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => handleStatus("open")}
            disabled={mutation.isPending}
          >
            Ouvrir
          </Button>
        )}
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={() => handleStatus("frozen")}
          disabled={mutation.isPending || currentStatus === "frozen"}
        >
          Geler
        </Button>
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={() => handleStatus("validated")}
          disabled={mutation.isPending || currentStatus === "validated"}
        >
          Valider
        </Button>
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={handleGeneratePDF}
        >
          Générer PDF
        </Button>
      </PopoverContent>
    </Popover>
  );
}
