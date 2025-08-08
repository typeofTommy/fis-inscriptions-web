"use client";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import Link from "next/link";
import {format, parseISO} from "date-fns";
import {Inscription} from "@/app/types";
import type {CompetitionItem} from "@/app/types";
import Image from "next/image";
import {useCountryInfo} from "@/hooks/useCountryInfo";
import {
  colorBadgePerDiscipline,
  colorBadgePerRaceLevel,
  colorBadgePerGender,
} from "@/app/lib/colorMappers";
import {Loader2} from "lucide-react";
import {useQuery} from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  validated: "bg-blue-100 text-blue-800 border-blue-200",
  email_sent: "bg-orange-100 text-orange-800 border-orange-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const CompetitorCountCell = ({inscriptionId}: {inscriptionId: number}) => {
  const {data, isLoading, isError} = useQuery({
    queryKey: ["inscription-competitors-all", inscriptionId],
    queryFn: async () => {
      const res = await fetch(
        `/api/inscriptions/${inscriptionId}/competitors/all`
      );
      if (!res.ok)
        throw new Error("Erreur lors du chargement des compétiteurs");
      return res.json();
    },
  });
  if (isLoading)
    return <Loader2 className="w-4 h-4 animate-spin inline-block" />;
  if (isError) return <span>-</span>;
  return <span>{Array.isArray(data) ? data.length : "-"}</span>;
};

const CountryDisplay = ({country}: {country: string}) => {
  const {flagUrl, countryLabel} = useCountryInfo(country);
  return (
    <span className="flex items-center gap-1">
      {flagUrl && (
        <Image
          src={flagUrl}
          alt={countryLabel}
          className="inline-block w-4 h-3 object-cover border border-gray-200 rounded"
          loading="lazy"
          width={16}
          height={12}
        />
      )}
      <span className="text-xs truncate">{countryLabel}</span>
    </span>
  );
};

const BadgeList = ({
  items,
  colorMap,
  maxDisplay = 2,
}: {
  items: string[];
  colorMap: Record<string, string>;
  maxDisplay?: number;
}) => {
  const visibleItems = items.slice(0, maxDisplay);
  const hiddenCount = items.length - maxDisplay;

  return (
    <div className="flex gap-1 flex-wrap">
      {visibleItems.map((item) => (
        <Badge
          key={item}
          className={`${colorMap[item] || "bg-gray-300"} text-xs`}
        >
          {item}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
};

export function InscriptionCard({inscription}: {inscription: Inscription}) {
  const country =
    inscription.eventData.placeNationCode ||
    inscription.eventData.organiserNationCode ||
    "Non renseigné";

  const disciplines = Array.from(
    new Set((inscription.eventData.competitions ?? []).map((c) => c.eventCode))
  ).filter(Boolean);

  const raceLevels = Array.from(
    new Set(
      (inscription.eventData.competitions ?? []).map(
        (c: CompetitionItem) => c.categoryCode
      )
    )
  ).filter(Boolean);

  const sexes = ["M", "W"].filter((sex) =>
    (inscription.eventData.competitions ?? []).some(
      (c: CompetitionItem) => c.genderCode === sex
    )
  );

  const codexes = Array.from(
    new Set(
      (inscription.eventData.competitions ?? []).map(
        (c: CompetitionItem) => c.codex
      )
    )
  );

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        {/* Ligne 1: Date, Station, Pays, Bouton */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm">
                {format(
                  parseISO(inscription.eventData.startDate),
                  "dd/MM/yyyy"
                )}
              </span>
              <div className="flex flex-col gap-1">
                <Badge
                  className={
                    statusColors[inscription.status] || "bg-gray-200 text-xs"
                  }
                >
                  {inscription.status === "open"
                    ? "Ouverte"
                    : inscription.status === "validated"
                      ? "Validée"
                      : inscription.status === "email_sent"
                        ? "Email envoyé"
                        : inscription.status === "cancelled"
                          ? "Course annulée"
                          : inscription.status}
                </Badge>
                {inscription.status === "email_sent" && inscription.emailSentAt && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(inscription.emailSentAt), "dd/MM/yyyy HH:mm")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="font-medium truncate">
                {inscription.eventData.place?.[0]?.toUpperCase() +
                  inscription.eventData.place?.slice(1) || "Non renseigné"}
              </span>
              <CountryDisplay country={country} />
            </div>
          </div>
          <Link href={`/inscriptions/${inscription.id}`}>
            <Button
              size="sm"
              className="bg-[#3d7cf2] hover:bg-[#2c5dd9] text-white text-xs px-2 py-1 ml-2"
            >
              Détails
            </Button>
          </Link>
        </div>

        {/* Ligne 2: Disciplines et Race Levels */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Disc:</span>
            <BadgeList
              items={disciplines}
              colorMap={colorBadgePerDiscipline}
              maxDisplay={2}
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-600 text-xs">Niv:</span>
            <BadgeList
              items={raceLevels}
              colorMap={colorBadgePerRaceLevel}
              maxDisplay={2}
            />
          </div>
        </div>

        {/* Ligne 3: Sexe, Codex, Compétiteurs */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Sexe:</span>
            <div className="flex gap-1">
              {sexes.map((sex) => (
                <Badge
                  key={sex}
                  variant="outline"
                  className={`${
                    colorBadgePerGender[sex === "M" ? "M" : "W"] || ""
                  } text-white text-xs px-1 py-0`}
                >
                  {sex}
                </Badge>
              ))}
            </div>
          </div>
          {codexes.length > 0 && (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <span className="text-gray-600">Codex:</span>
              <div className="flex gap-1 flex-wrap">
                {codexes.slice(0, 2).map((codex, i) => (
                  <Badge
                    key={`${codex}-${i}`}
                    variant="outline"
                    className="text-xs px-1 py-0"
                  >
                    {codex}
                  </Badge>
                ))}
                {codexes.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{codexes.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Compét:</span>
            <CompetitorCountCell inscriptionId={inscription.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
