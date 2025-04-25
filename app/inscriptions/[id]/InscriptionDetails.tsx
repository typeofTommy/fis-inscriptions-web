"use client";

import {inscriptions} from "@/drizzle/schemaInscriptions";
import {useQuery} from "@tanstack/react-query";
import {
  Loader2,
  MapPinIcon,
  CalendarIcon,
  HashIcon,
  ActivityIcon,
  LinkIcon,
} from "lucide-react";
import {Badge} from "@/components/ui/badge";

interface InscriptionDetailsProps {
  id: string;
}

async function fetchInscription(
  id: string
): Promise<typeof inscriptions.$inferSelect> {
  const response = await fetch(`/api/inscriptions/${id}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération de l&apos;inscription");
  }
  return response.json();
}

export const InscriptionDetails = ({id}: InscriptionDetailsProps) => {
  const {
    data: inscription,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inscription", id],
    queryFn: () => fetchInscription(id),
  });

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-medium text-slate-800 mb-4">
            Détails de l&apos;inscription
          </h1>

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
                  {new Date(inscription.firstRaceDate).toLocaleDateString(
                    "fr-FR"
                  )}
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
                  {inscription.location} ({inscription.country})
                </p>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <HashIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Codex</p>
                <div className="flex gap-2 flex-wrap">
                  {inscription.codexNumbers?.map((codex, index) => (
                    <Badge
                      key={index}
                      className="bg-sky-100 hover:bg-sky-200 text-sky-700 border-0 rounded-md font-medium px-3 py-1 text-sm"
                    >
                      {codex}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <ActivityIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Disciplines
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Array.isArray(inscription.disciplines) &&
                    inscription.disciplines.map((discipline, index) => (
                      <Badge
                        key={index}
                        className="bg-sky-100 hover:bg-sky-200 text-sky-700 border-0 rounded-md font-medium px-3 py-1 text-sm"
                      >
                        {discipline}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <ActivityIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  Niveaux
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Array.isArray(inscription.raceLevels) &&
                    inscription.raceLevels.map((level, index) => (
                      <Badge
                        key={index}
                        className="bg-sky-100 hover:bg-sky-200 text-sky-700 border-0 rounded-md font-medium px-3 py-1 text-sm"
                      >
                        {level}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center mr-4">
                <LinkIcon className="h-6 w-6 text-sky-500" />
              </div>
              <div>
                <a
                  href={inscription.eventLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 hover:text-sky-800 text-base font-medium"
                >
                  Lien de l&apos;événement
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end justify-end pr-4 mb-4 text-sm text-slate-500">
          <p>
            Demande formulée le{" "}
            {new Date(inscription.createdAt).toLocaleDateString("fr-FR")} par{" "}
            {inscription.fullName}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6"></main>
    </div>
  );
};
