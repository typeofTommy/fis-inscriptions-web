"use client";

import {Loader2, MapPinIcon, CalendarIcon, InfoIcon} from "lucide-react";
import {InscriptionActionsMenu} from "./InscriptionActionsMenu";
import {usePermissionToEdit} from "./usePermissionToEdit";
import {useInscription} from "../form/api";
import {parseLocalDate} from "@/app/lib/dates";
import {useCountryInfo} from "@/hooks/useCountryInfo";
import Image from "next/image";
import {Button} from "@/components/ui/button";
import React, {useState} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {EventDetails} from "@/components/EventDetails";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {colorBadgePerGender} from "@/app/lib/colorMappers";

interface InscriptionDetailsProps {
  id: string;
  genderFilter: "both" | "M" | "W";
  setGenderFilter: (value: "both" | "M" | "W") => void;
  isMixedEvent: boolean;
}

export const InscriptionDetails = ({
  id,
  genderFilter,
  setGenderFilter,
  isMixedEvent,
}: InscriptionDetailsProps) => {
  const {data: inscription, isLoading, error} = useInscription(id);

  const permissionToEdit = usePermissionToEdit(inscription);

  const countryCode =
    inscription?.eventData.placeNationCode ||
    inscription?.eventData.organiserNationCode;
  const {flagUrl, countryLabel} = useCountryInfo(countryCode);

  const [isEventDetailsModalOpen, setIsEventDetailsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center min-h-[400px] flex items-center justify-center">
        Une erreur est survenue lors de la récupération des données
      </div>
    );
  }

  if (!inscription) {
    return null;
  }

  const firstCodex = inscription.eventData?.competitions?.[0]?.codex;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1
              className="text-2xl font-medium text-slate-800 flex items-center gap-4"
              style={{lineHeight: 1}}
            >
              Détails de l&apos;inscription
              <span
                className={
                  `px-3 py-0.5 rounded-full text-xs font-semibold flex items-center` +
                  (inscription.status === "open"
                    ? " bg-sky-100 text-sky-700 border border-sky-300"
                    : " bg-emerald-100 text-emerald-700 border border-emerald-300")
                }
                style={{minHeight: "2rem"}}
              >
                {inscription.status === "open" ? "Ouverte" : "Clôturée"}
              </span>
            </h1>
            <div className="flex items-center gap-2">
              {firstCodex !== undefined && (
                <Dialog
                  open={isEventDetailsModalOpen}
                  onOpenChange={setIsEventDetailsModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="cursor-pointer bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm"
                    >
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Détail de l&apos;événement
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-screen-2xl">
                    <DialogHeader>
                      <DialogTitle>Détails de l&apos;événement</DialogTitle>
                    </DialogHeader>
                    <EventDetails codex={firstCodex} />
                  </DialogContent>
                </Dialog>
              )}
              {permissionToEdit && inscription && (
                <InscriptionActionsMenu
                  inscription={inscription}
                  readonly={!permissionToEdit}
                />
              )}
            </div>
          </div>

          {/* First Row */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Lieu Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <MapPinIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
                  Lieu
                </p>
                <div className="flex items-center">
                  <p className="text-lg font-semibold text-slate-800">
                    {inscription.eventData.place}
                  </p>
                  {countryCode && countryCode !== "Non renseigné" && (
                    <span className="ml-2 flex items-center text-lg font-semibold text-slate-700">
                      {flagUrl && (
                        <Image
                          src={flagUrl}
                          alt={countryLabel}
                          width={20}
                          height={16}
                          className="mr-1.5 inline-block h-4 w-5 object-cover border border-gray-200 rounded-sm"
                        />
                      )}
                      ({countryLabel})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Période Card */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start">
              <div className="shrink-0 w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider mb-1">
                  Période
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  Du{" "}
                  {parseLocalDate(
                    inscription.eventData.startDate
                  )?.toLocaleDateString("fr-FR")}{" "}
                  au{" "}
                  {parseLocalDate(
                    inscription.eventData.endDate
                  )?.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
          {/* Creator and Date Info */}
          {inscription.createdBy && inscription.createdAt && (
            <p className="text-xs text-slate-400 mt-2 text-right">
              Créé par {inscription.createdBy ?? "Utilisateur inconnu"} le{" "}
              {new Date(inscription.createdAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
      </header>

      {/* Gender Filter - Only show if mixed event */}
      {isMixedEvent && inscription && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-lg font-medium text-slate-700 mb-3">
            Filtrer par genre
          </h2>
          <RadioGroup
            value={genderFilter}
            onValueChange={setGenderFilter}
            className="flex items-center gap-6"
          >
            <div className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="both"
                id="r1"
                className="cursor-pointer h-5 w-5"
              />
              <Label htmlFor="r1" className="cursor-pointer text-base">
                <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1 text-sm">
                  Tous
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="M"
                id="r2"
                className="cursor-pointer h-5 w-5"
              />
              <Label htmlFor="r2" className="cursor-pointer text-base">
                <Badge
                  className={
                    colorBadgePerGender.M + " text-white px-3 py-1 text-sm"
                  }
                >
                  Hommes
                </Badge>
              </Label>
            </div>
            <div className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem
                value="W"
                id="r3"
                className="cursor-pointer h-5 w-5"
              />
              <Label htmlFor="r3" className="cursor-pointer text-base">
                <Badge
                  className={
                    colorBadgePerGender.W + " text-white px-3 py-1 text-sm"
                  }
                >
                  Femmes
                </Badge>
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}
    </div>
  );
};
