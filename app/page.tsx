"use client";
import {useState} from "react";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {InscriptionsTable} from "@/components/InscriptionsTable";
import {CompetitorEventsTab} from "@/components/CompetitorEventsTab";
import {useTranslations} from "next-intl";

export default function Home() {
  const [tab, setTab] = useState("inscriptions");
  const t = useTranslations("navigation");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="inscriptions" className="cursor-pointer">
          {t("inscriptions")}
        </TabsTrigger>
        <TabsTrigger value="competitors" className="cursor-pointer">
          {t("competitors")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="inscriptions">
        <InscriptionsTable />
      </TabsContent>
      <TabsContent value="competitors">
        <CompetitorEventsTab />
      </TabsContent>
    </Tabs>
  );
}
