"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState} from "react";
import {Zap} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import {useRouter} from "next/navigation";

interface InscriptionActionsMenuProps {
  id: string;
  currentStatus: string;
  readonly: boolean;
}

export function InscriptionActionsMenu({
  id,
  currentStatus,
  readonly,
}: InscriptionActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: async (status: "open" | "validated") => {
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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inscriptions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["inscription", id]});
      queryClient.invalidateQueries({queryKey: ["inscriptions"]});
      setOpen(false);
      router.push("/");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
      setOpen(false);
    },
  });

  const handleStatus = (status: "open" | "validated") => {
    if (currentStatus === status) return;
    statusMutation.mutate(status);
  };

  const handleGeneratePDF = () => {
    alert("Génération du PDF à implémenter");
    setOpen(false);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette inscription ? Cette action est irréversible."
      )
    ) {
      deleteMutation.mutate();
    } else {
      setOpen(false);
    }
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
            className="justify-start w-full cursor-pointer"
            onClick={() => handleStatus("open")}
            disabled={statusMutation.isPending || readonly}
          >
            Ouvrir
          </Button>
        )}
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={() => handleStatus("validated")}
          disabled={
            statusMutation.isPending ||
            currentStatus === "validated" ||
            readonly
          }
        >
          Valider
        </Button>
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={handleGeneratePDF}
          disabled={readonly}
        >
          Générer PDF
        </Button>

        {currentStatus !== "validated" && (
          <>
            <Separator className="my-1" />
            <Button
              variant="ghost"
              className="justify-start w-full cursor-pointer"
              onClick={() => {
                alert("Fonctionnalité d'édition à implémenter");
                setOpen(false);
              }}
              disabled={readonly}
            >
              Editer
            </Button>
            <Button
              variant="ghost"
              className="justify-start w-full text-red-600 hover:text-red-700 cursor-pointer"
              onClick={handleDelete}
              disabled={readonly || deleteMutation.isPending}
            >
              Supprimer
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
