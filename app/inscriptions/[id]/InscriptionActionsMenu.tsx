"use client";

import {useMutation, useQueryClient, useQuery} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {useState} from "react";
import {Zap} from "lucide-react";
import {Separator} from "@/components/ui/separator";
import {useRouter} from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {Inscription} from "@/app/types";
import {colorBadgePerGender} from "@/app/lib/colorMappers";

interface InscriptionActionsMenuProps {
  inscription: Inscription;
  readonly: boolean;
}

export function InscriptionActionsMenu({
  inscription,
  readonly,
}: InscriptionActionsMenuProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [genderDialogOpen, setGenderDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: async (status: "open" | "validated") => {
      const res = await fetch(
        `/api/inscriptions/${inscription.id}/status?status=${status}`,
        {
          method: "PATCH",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({status}),
        }
      );
      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inscriptions", inscription.id.toString()],
      });
      setPopoverOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inscriptions/${inscription.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inscriptions", inscription.id.toString()],
      });
      queryClient.invalidateQueries({queryKey: ["inscriptions"]});
      setPopoverOpen(false);
      router.push("/");
    },
    onError: (error) => {
      alert(`Erreur: ${error.message}`);
      setPopoverOpen(false);
    },
  });

  const {data: competitors = [], isLoading: isLoadingCompetitors} = useQuery({
    queryKey: ["inscription-competitors-all", inscription.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscription.id}/competitors/all`
      );
      if (!res.ok)
        throw new Error("Erreur lors du chargement des compétiteurs");
      return res.json();
    },
  });

  const handleStatus = (status: "open" | "validated") => {
    if (inscription.status === status) return;
    statusMutation.mutate(status);
    setPopoverOpen(false);
  };

  const isMixteEvent =
    inscription.eventData.genderCodes &&
    inscription.eventData.genderCodes.length > 1;

  const handleGeneratePDF = () => {
    if (isMixteEvent) {
      setGenderDialogOpen(true);
    } else {
      const gender = inscription.eventData.genderCodes[0];
      window.open(
        `/inscriptions/${inscription.id}/pdf?gender=${gender}`,
        "_blank"
      );
      setPopoverOpen(false);
    }
  };

  const handleGenderSelectedAndGeneratePDF = (gender: "M" | "W") => {
    window.open(
      `/inscriptions/${inscription.id}/pdf?gender=${gender}`,
      "_blank"
    );
    setGenderDialogOpen(false);
    setPopoverOpen(false);
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Êtes-vous sûr de vouloir supprimer cette inscription ? Cette action est irréversible."
      )
    ) {
      deleteMutation.mutate();
    } else {
      setPopoverOpen(false);
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white shadow-md flex items-center gap-2 w-24 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          Actions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 flex flex-col gap-1 items-start text-left">
        {inscription.status !== "open" && (
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
            inscription.status === "validated" ||
            readonly
          }
        >
          Clôturer
        </Button>
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={handleGeneratePDF}
          disabled={
            readonly || isLoadingCompetitors || competitors.length === 0
          }
        >
          Générer PDF
        </Button>

        <Dialog open={genderDialogOpen} onOpenChange={setGenderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sélectionner le genre pour le PDF</DialogTitle>
              <DialogDescription>
                Cet événement est mixte. Veuillez choisir le genre pour lequel
                vous souhaitez générer le PDF.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button
                onClick={() => handleGenderSelectedAndGeneratePDF("M")}
                className={`cursor-pointer ${colorBadgePerGender.M} hover:${colorBadgePerGender.M}/90 text-white`}
              >
                Hommes
              </Button>
              <Button
                onClick={() => handleGenderSelectedAndGeneratePDF("W")}
                className={`cursor-pointer ${colorBadgePerGender.W} hover:${colorBadgePerGender.W}/90 text-white`}
              >
                Femmes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {inscription.status !== "validated" && (
          <>
            <Separator className="my-1" />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Modifier l&apos;inscription</DialogTitle>
                </DialogHeader>
              </DialogContent>
            </Dialog>
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
