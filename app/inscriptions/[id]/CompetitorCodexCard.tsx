"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { InscriptionCompetitor } from "@/app/types";
import { format } from "date-fns";

interface CompetitorCodexCardProps {
  competitor: InscriptionCompetitor;
  permissionToEdit: boolean;
  inscriptionStatus: string;
  onManageRegistrations: (competitorId: number) => void;
}

export function CompetitorCodexCard({
  competitor,
  permissionToEdit,
  inscriptionStatus,
  onManageRegistrations,
}: CompetitorCodexCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Ligne 1: Nom + Actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base text-slate-800 truncate">
              {competitor.lastname} {competitor.firstname}
            </h3>
            <p className="text-sm text-slate-600 truncate">{competitor.skiclub}</p>
          </div>
          {permissionToEdit && (
            <Button
              variant="ghost"
              size="sm"
              title="Gérer les inscriptions"
              className="cursor-pointer ml-2 h-8 w-8 p-0"
              disabled={inscriptionStatus !== "open"}
              onClick={() => onManageRegistrations(competitor.competitorid)}
            >
              <Settings className="w-4 h-4 text-slate-500" />
            </Button>
          )}
        </div>

        {/* Ligne 2: Informations */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Genre:</span>
            <Badge
              variant="outline"
              className={`ml-1 text-xs px-1.5 py-0.5 ${
                competitor.gender === "M" 
                  ? "bg-blue-100 text-blue-700 border-blue-300" 
                  : "bg-pink-100 text-pink-700 border-pink-300"
              }`}
            >
              {competitor.gender === "M" ? "Homme" : "Femme"}
            </Badge>
          </div>
          <div>
            <span className="text-gray-600">Points:</span>
            <span className="ml-1 font-medium">
              {competitor.points !== null && competitor.points !== undefined 
                ? competitor.points 
                : "999"}
            </span>
          </div>
        </div>

        {/* Ligne 3: Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
          <div>
            <span className="text-gray-600">Né(e) le:</span>
            <p className="text-xs text-slate-700">
              {competitor.birthdate 
                ? format(new Date(competitor.birthdate), "dd/MM/yyyy")
                : "Non renseigné"}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Ajouté le:</span>
            <p className="text-xs text-slate-700">
              {competitor.createdAt 
                ? format(new Date(competitor.createdAt), "dd/MM/yyyy")
                : "Non renseigné"}
            </p>
          </div>
        </div>

        {/* Ligne 4: Email si disponible */}
        {competitor.addedByEmail && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-600 text-xs">Ajouté par:</span>
            <p className="text-xs text-slate-600 truncate">{competitor.addedByEmail}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}