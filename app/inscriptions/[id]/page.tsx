"use client";

import React from "react";
import {InscriptionDetails} from "./InscriptionDetails";
import {CodexTabs} from "./CodexTabs";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {RecapEvent} from "./RecapEvent";
import {EventDetails} from "@/components/EventDetails";
import {useInscription} from "@/app/inscriptions/form/api";
import {Loader2} from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InscriptionPage({params: paramsPromise}: PageProps) {
  const params = React.use(paramsPromise);

  const {data: inscription, isLoading, error} = useInscription(params.id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-red-600">
        Erreur lors du chargement des détails de l&apos;inscription:{" "}
        {error.message}
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="container mx-auto py-8 text-center text-slate-500">
        Aucune donnée d&apos;inscription trouvée.
      </div>
    );
  }

  const firstCodex = inscription.eventData?.competitions?.[0]?.codex;

  return (
    <div className="container mx-auto py-8">
      <InscriptionDetails id={params.id} />
      <div className="bg-white p-4 mt-6">
        <Tabs defaultValue="recap" className="w-full">
          <TabsList className="inline-flex flex-wrap bg-slate-100 rounded-md border border-slate-200 shadow-sm p-0">
            <TabsTrigger
              value="recap"
              className="px-7 py-2 text-base font-bold transition-colors duration-150 border-none rounded-l-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              Récapitulatif
            </TabsTrigger>
            <TabsTrigger
              value="details_competitors"
              className="px-7 py-2 text-base font-bold transition-colors duration-150 border-none data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              Par codex
            </TabsTrigger>
            <TabsTrigger
              value="details_event"
              className="px-7 py-2 text-base font-bold transition-colors duration-150 border-none rounded-r-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              Détail de l&apos;événement
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recap">
            <RecapEvent inscriptionId={params.id} />
          </TabsContent>
          <TabsContent value="details_competitors">
            <CodexTabs inscriptionId={params.id} />
          </TabsContent>
          <TabsContent value="details_event">
            {firstCodex !== undefined ? (
              <EventDetails codex={firstCodex} />
            ) : (
              <p className="text-slate-500 p-4">
                Aucun détail d&apos;événement spécifique à afficher (pas de
                codex trouvé).
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
