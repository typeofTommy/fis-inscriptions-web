import React, {useState, useCallback} from "react";
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
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

interface CoachData {
  firstName: string;
  lastName: string;
  team?: string;
  startDate: string;
  endDate: string;
}

function useSaveCoach(inscriptionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (coachData: CoachData) => {
      const res = await fetch(`/api/inscriptions/${inscriptionId}/coaches`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(coachData),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout du coach");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inscription-coaches", inscriptionId],
      });
    },
  });
}

export default function AddCoachModal({
  inscriptionId,
  triggerText,
  triggerTextMobile,
  eventStartDate,
  eventEndDate,
}: {
  inscriptionId: string;
  triggerText?: string;
  triggerTextMobile?: string;
  eventStartDate?: string;
  eventEndDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [team, setTeam] = useState("");
  const [startDate, setStartDate] = useState(eventStartDate || "");
  const [endDate, setEndDate] = useState(eventEndDate || "");

  const {mutate: saveCoach, isPending: saving} = useSaveCoach(inscriptionId);

  const isFormValid = () => {
    if (!firstName.trim() || !lastName.trim() || !startDate || !endDate) {
      return false;
    }
    
    // Validation des dates
    if (eventStartDate && startDate < eventStartDate) {
      return false;
    }
    
    if (eventEndDate && endDate > eventEndDate) {
      return false;
    }
    
    if (startDate > endDate) {
      return false;
    }
    
    return true;
  };

  const getDateError = () => {
    if (!startDate || !endDate) return "Les dates sont obligatoires";
    if (startDate > endDate) return "Le premier jour doit être avant le dernier jour";
    if (eventStartDate && startDate < eventStartDate) return "Le premier jour ne peut pas être avant le début de l'événement";
    if (eventEndDate && endDate > eventEndDate) return "Le dernier jour ne peut pas être après la fin de l'événement";
    return null;
  };

  const handleSave = useCallback(() => {
    if (!isFormValid()) return;
    saveCoach(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        team: team.trim() || undefined,
        startDate: startDate,
        endDate: endDate,
      },
      {
        onSuccess: () => {
          setFirstName("");
          setLastName("");
          setTeam("");
          setStartDate(eventStartDate || "");
          setEndDate(eventEndDate || "");
          setOpen(false);
        },
      }
    );
  }, [firstName, lastName, team, startDate, endDate, saveCoach]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !saving && isFormValid()) {
        handleSave();
      }
    },
    [handleSave, saving, firstName, lastName, startDate, endDate, eventStartDate, eventEndDate]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setFirstName("");
          setLastName("");
          setTeam("");
          setStartDate(eventStartDate || "");
          setEndDate(eventEndDate || "");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white text-[#3d7cf2] hover:bg-[#f0f7ff] cursor-pointer text-xs md:text-base px-2 md:px-4 py-2"
        >
          <span className="md:hidden">
            {triggerTextMobile || triggerText || "+"}
          </span>
          <span className="hidden md:inline">
            {triggerText || "Ajouter un coach"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un coach</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coach-firstname">Prénom</Label>
              <Input
                id="coach-firstname"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-lastname">Nom</Label>
              <Input
                id="coach-lastname"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-team">Équipe (optionnel)</Label>
            <Input
              id="coach-team"
              placeholder="Nom de l'équipe"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coach-startdate">Premier jour *</Label>
              <Input
                id="coach-startdate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={eventStartDate}
                max={eventEndDate}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coach-enddate">Dernier jour *</Label>
              <Input
                id="coach-enddate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || eventStartDate}
                max={eventEndDate}
                required
              />
            </div>
          </div>
          {getDateError() && (
            <div className="text-sm text-red-600 mt-2">
              {getDateError()}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={!isFormValid() || saving}
            className="cursor-pointer"
          >
            {saving ? "Ajout..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}