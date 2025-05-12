"use client";

import {Loader2, MapPinIcon, CalendarIcon, LinkIcon} from "lucide-react";
import {InscriptionActionsMenu} from "./InscriptionActionsMenu";
import {usePermissionToEdit} from "./usePermissionToEdit";
import {useInscription} from "../form/api";
import {parseLocalDate} from "@/app/lib/dates";

interface InscriptionDetailsProps {
  id: string;
}

export const InscriptionDetails = ({id}: InscriptionDetailsProps) => {
  const {data: inscription, isLoading, error} = useInscription(id);

  const permissionToEdit = usePermissionToEdit(inscription);

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
            {permissionToEdit && inscription && (
              <InscriptionActionsMenu
                inscription={inscription}
                readonly={!permissionToEdit}
              />
            )}
          </div>

          {/* First Row */}
          <div className="flex flex-wrap justify-around items-start gap-x-12 gap-y-6">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Date de la 1ère course
                </p>
                <p className="text-base font-medium text-slate-800">
                  {parseLocalDate(
                    inscription.eventData.startDate
                  )?.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <CalendarIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Date de la dernière course
                </p>
                <p className="text-base font-medium text-slate-800">
                  {parseLocalDate(
                    inscription.eventData.endDate
                  )?.toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <MapPinIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Lieu</p>
                <p className="text-base font-medium text-slate-800">
                  {inscription.eventData.place}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <LinkIcon className="h-6 w-6 text-sky-500" />
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
    </div>
  );
};
