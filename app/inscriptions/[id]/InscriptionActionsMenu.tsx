"use client";

import {useMutation, useQueryClient, useQuery} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {useState} from "react";
import {Zap, Loader2, RefreshCw} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Inscription} from "@/app/types";
import {colorBadgePerGender} from "@/app/lib/colorMappers";
import {UpdateEventDataModal} from "./UpdateEventDataModal";

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
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const queryClient = useQueryClient();
  const router = useRouter();

  const statusMutation = useMutation({
    mutationFn: async (status: "open" | "validated" | "email_sent") => {
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

  const {
    data: competitors = [],
    isLoading: isLoadingCompetitors,
    refetch: refetchCompetitorsAll,
  } = useQuery({
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

  const handleStatusChange = () => {
    if (!selectedStatus || selectedStatus === inscription.status) {
      setStatusDialogOpen(false);
      setSelectedStatus("");
      return;
    }
    statusMutation.mutate(
      selectedStatus as "open" | "validated" | "email_sent"
    );
    setStatusDialogOpen(false);
    setSelectedStatus("");
    setPopoverOpen(false);
  };

  const statusLabels = {
    open: "En cours (ouvert)",
    validated: "Clôturé (validé)",
    email_sent: "Email envoyé",
  };

  const isMixteEvent =
    inscription.eventData.genderCodes &&
    inscription.eventData.genderCodes.length > 1;

  const hasNoMen = !competitors.some((c: {gender: string}) => c.gender === "M");
  const hasNoWomen = !competitors.some(
    (c: {gender: string}) => c.gender === "W"
  );

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
    <Popover
      open={popoverOpen}
      onOpenChange={(open) => {
        if (open) {
          refetchCompetitorsAll();
        }
        setPopoverOpen(open);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="bg-emerald-600 hover:bg-emerald-700 text-white hover:text-white shadow-md flex items-center gap-2 w-24 cursor-pointer"
        >
          <Zap className="w-4 h-4" />
          Actions
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 flex flex-col gap-1 items-start text-left">
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={() => {
            setSelectedStatus("");
            setStatusDialogOpen(true);
            setPopoverOpen(false);
          }}
          disabled={statusMutation.isPending || readonly}
        >
          Changer le statut
        </Button>
        <Button
          variant="ghost"
          className="justify-start w-full cursor-pointer"
          onClick={handleGeneratePDF}
          disabled={
            readonly || isLoadingCompetitors || competitors.length === 0
          }
        >
          {isLoadingCompetitors && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Générer PDF
        </Button>

        {!readonly && (
          <Button
            variant="ghost"
            className="justify-start w-full cursor-pointer flex items-center gap-2"
            onClick={() => {
              setUpdateModalOpen(true);
              setPopoverOpen(false);
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Mettre à jour les données
          </Button>
        )}

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
              {hasNoMen ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          className={`${colorBadgePerGender.M} text-white cursor-not-allowed opacity-60`}
                          disabled
                          style={{pointerEvents: "none"}}
                        >
                          Hommes
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aucun homme inscrit. PDF non générable.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  onClick={() => handleGenderSelectedAndGeneratePDF("M")}
                  className={`cursor-pointer ${colorBadgePerGender.M} hover:${colorBadgePerGender.M}/90 text-white`}
                >
                  Hommes
                </Button>
              )}
              {hasNoWomen ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0}>
                        <Button
                          className={`${colorBadgePerGender.W} text-white cursor-not-allowed opacity-60`}
                          disabled
                          style={{pointerEvents: "none"}}
                        >
                          Femmes
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Aucune femme inscrite. PDF non générable.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <Button
                  onClick={() => handleGenderSelectedAndGeneratePDF("W")}
                  className={`cursor-pointer ${colorBadgePerGender.W} hover:${colorBadgePerGender.W}/90 text-white`}
                >
                  Femmes
                </Button>
              )}
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

      <UpdateEventDataModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        inscription={inscription}
      />

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Changer le statut de l&apos;inscription</DialogTitle>
            <DialogDescription>
              Statut actuel :{" "}
              <strong>
                {statusLabels[inscription.status as keyof typeof statusLabels]}
              </strong>
              <br />
              Sélectionnez le nouveau statut souhaité.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="cursor-pointer">
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open" className="cursor-pointer">
                  {statusLabels.open}
                </SelectItem>
                <SelectItem value="validated" className="cursor-pointer">
                  {statusLabels.validated}
                </SelectItem>
                <SelectItem value="email_sent" className="cursor-pointer">
                  {statusLabels.email_sent}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setStatusDialogOpen(false);
                setSelectedStatus("");
              }}
              className="cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={
                !selectedStatus ||
                selectedStatus === inscription.status ||
                statusMutation.isPending
              }
              className="cursor-pointer"
            >
              {statusMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Popover>
  );
}
