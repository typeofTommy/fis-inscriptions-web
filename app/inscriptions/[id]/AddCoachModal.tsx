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
import {useMutation, useQueryClient, useQuery} from "@tanstack/react-query";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface CoachData {
  firstName: string;
  lastName: string;
  team?: string;
  gender: "M" | "W" | "BOTH";
  startDate: string;
  endDate: string;
  whatsappPhone?: string;
}

type PreviousCoach = {
  firstName: string;
  lastName: string;
  team?: string;
  whatsappPhone?: string;
};

const usePreviousCoaches = () => {
  return useQuery<PreviousCoach[]>({
    queryKey: ["previous-coaches"],
    queryFn: async () => {
      const res = await fetch("/api/coaches/previous");
      if (!res.ok) throw new Error("Erreur lors du chargement des coachs précédents");
      return res.json();
    },
  });
};

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
  const [gender, setGender] = useState<"M" | "W" | "BOTH" | undefined>(undefined);
  const [startDate, setStartDate] = useState(eventStartDate || "");
  const [endDate, setEndDate] = useState(eventEndDate || "");
  const [whatsappPhone, setWhatsappPhone] = useState("");

  const {mutate: saveCoach, isPending: saving} = useSaveCoach(inscriptionId);
  const {data: previousCoaches = []} = usePreviousCoaches();

  const handleQuickSelect = (value: string) => {
    if (value === "manual") {
      // Reset pour saisie manuelle
      setFirstName("");
      setLastName("");
      setTeam("");
      setGender(undefined);
      setWhatsappPhone("");
      return;
    }

    const coach = previousCoaches.find(
      (c) => `${c.firstName}-${c.lastName}` === value
    );
    if (coach) {
      setFirstName(coach.firstName);
      setLastName(coach.lastName);
      setTeam(coach.team || "");
      setGender(undefined); // Par défaut car les anciens coaches n'ont pas de genre
      setWhatsappPhone(coach.whatsappPhone || "");
    }
  };

  const isFormValid = useCallback(() => {
    if (!firstName.trim() || !lastName.trim() || !startDate || !endDate || !gender) {
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
  }, [firstName, lastName, startDate, endDate, eventStartDate, eventEndDate, gender]);

  const getDateError = () => {
    if (!startDate || !endDate) return "Les dates sont obligatoires";
    if (startDate > endDate)
      return "Le premier jour doit être avant le dernier jour";
    if (eventStartDate && startDate < eventStartDate)
      return "Le premier jour ne peut pas être avant le début de l'événement";
    if (eventEndDate && endDate > eventEndDate)
      return "Le dernier jour ne peut pas être après la fin de l'événement";
    return null;
  };

  const handleSave = useCallback(() => {
    if (!isFormValid()) return;
    saveCoach(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        team: team.trim() || undefined,
        gender: gender!,
        startDate: startDate,
        endDate: endDate,
        whatsappPhone: whatsappPhone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setFirstName("");
          setLastName("");
          setTeam("");
          setGender(undefined);
          setStartDate(eventStartDate || "");
          setEndDate(eventEndDate || "");
          setWhatsappPhone("");
          setOpen(false);
        },
      }
    );
  }, [firstName, lastName, team, gender, startDate, endDate, whatsappPhone, saveCoach, eventStartDate, eventEndDate, isFormValid]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !saving && isFormValid()) {
        handleSave();
      }
    },
    [handleSave, saving, isFormValid]
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
          setGender(undefined);
          setStartDate(eventStartDate || "");
          setEndDate(eventEndDate || "");
          setWhatsappPhone("");
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
          {previousCoaches.length > 0 && (
            <div className="space-y-2">
              <Label>Sélection rapide</Label>
              <Select onValueChange={handleQuickSelect}>
                <SelectTrigger className="cursor-pointer">
                  <SelectValue placeholder="Choisir un coach précédemment ajouté" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Saisie manuelle</SelectItem>
                  {previousCoaches.map((coach) => (
                    <SelectItem
                      key={`${coach.firstName}-${coach.lastName}`}
                      value={`${coach.firstName}-${coach.lastName}`}
                      className="cursor-pointer"
                    >
                      {coach.lastName} {coach.firstName}{coach.team ? ` (${coach.team})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                Sélectionnez un coach pour pré-remplir les informations, ou choisissez &quot;Saisie manuelle&quot;
              </div>
            </div>
          )}
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
          <div className="space-y-2">
            <Label>Genre *</Label>
            <RadioGroup
              value={gender}
              onValueChange={(value: "M" | "W" | "BOTH") => setGender(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="M" id="gender-m" />
                <Label htmlFor="gender-m" className="cursor-pointer">Homme</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="W" id="gender-w" />
                <Label htmlFor="gender-w" className="cursor-pointer">Femme</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BOTH" id="gender-both" />
                <Label htmlFor="gender-both" className="cursor-pointer">Homme et femme</Label>
              </div>
            </RadioGroup>
            {(!gender && firstName && lastName) && (
              <div className="text-sm text-red-600">Veuillez sélectionner un genre</div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-whatsapp">
              Téléphone WhatsApp (recommandé)
            </Label>
            <div className="text-xs text-gray-500 mb-1">
              Pour créer un groupe WhatsApp avec les coachs automatiquement
            </div>
            <Input
              id="coach-whatsapp"
              placeholder="+33123456789"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              onKeyDown={handleKeyDown}
              type="tel"
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
            <div className="text-sm text-red-600 mt-2">{getDateError()}</div>
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
