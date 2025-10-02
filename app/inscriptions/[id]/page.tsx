"use client";

import React from "react";
import {InscriptionDetails} from "./InscriptionDetails";
import {CodexTabs} from "./CodexTabs";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {RecapEvent} from "./RecapEvent";
import {Coaches} from "./Coaches";
import AddCoachModal from "./AddCoachModal";
import {useInscription} from "@/app/inscriptions/form/api";
import {useTranslations} from "next-intl";

export const dynamic = "force-dynamic";
import {Loader2} from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function InscriptionPage({params: paramsPromise}: PageProps) {
  const t = useTranslations("inscriptionDetail");
  const params = React.use(paramsPromise);

  const {data: inscription, isLoading, error} = useInscription(params.id);

  // Lifted state for gender filter
  const [genderFilter, setGenderFilter] = React.useState<"both" | "M" | "W">(
    "both"
  );

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
        {t("error")} {error.message}
      </div>
    );
  }

  if (!inscription) {
    return (
      <div className="container mx-auto py-8 text-center text-slate-500">
        {t("noData")}
      </div>
    );
  }

  // Calculate isMixedEvent here based on inscription data
  const isMixedEvent =
    !!inscription?.eventData?.genderCodes?.includes("M") &&
    !!inscription?.eventData?.genderCodes?.includes("W");

  return (
    <div className="container mx-auto py-4 md:py-8">
      <InscriptionDetails
        id={params.id}
        genderFilter={genderFilter}
        setGenderFilterAction={setGenderFilter}
        isMixedEvent={isMixedEvent}
      />
      <div className="bg-white p-3 md:p-4 mt-4 md:mt-6">
        <Tabs defaultValue="recap" className="w-full">
          <TabsList className="inline-flex flex-wrap bg-slate-100 rounded-md border border-slate-200 shadow-sm p-0">
            <TabsTrigger
              value="recap"
              className="px-4 md:px-7 py-2 text-sm md:text-base font-bold transition-colors duration-150 border-none rounded-l-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              <span className="md:hidden">{t("tabs.recap")}</span>
              <span className="hidden md:inline">{t("tabs.recapFull")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="details_competitors"
              className="px-4 md:px-7 py-2 text-sm md:text-base font-bold transition-colors duration-150 border-none data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              <span className="md:hidden">{t("tabs.codex")}</span>
              <span className="hidden md:inline">{t("tabs.codexFull")}</span>
            </TabsTrigger>
            <TabsTrigger
              value="coaches"
              className="px-4 md:px-7 py-2 text-sm md:text-base font-bold transition-colors duration-150 border-none rounded-r-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              <span className="md:hidden">{t("tabs.coaches")}</span>
              <span className="hidden md:inline">{t("tabs.coachesFull")}</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recap">
            <RecapEvent inscriptionId={params.id} genderFilter={genderFilter} />
          </TabsContent>
          <TabsContent value="details_competitors">
            <CodexTabs inscriptionId={params.id} genderFilter={genderFilter} />
          </TabsContent>
          <TabsContent value="coaches" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t("coaches.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("coaches.description")}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Coaches.WhatsAppButton inscriptionId={params.id} />
                  {inscription?.status === "open" && (
                    <AddCoachModal
                      inscriptionId={params.id}
                      triggerText={t("coaches.add")}
                      triggerTextMobile={t("coaches.addShort")}
                      eventStartDate={inscription?.eventData?.startDate}
                      eventEndDate={inscription?.eventData?.endDate}
                    />
                  )}
                </div>
              </div>
              <Coaches inscriptionId={params.id} genderFilter={genderFilter} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
