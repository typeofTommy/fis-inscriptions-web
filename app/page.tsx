"use client";
import {useState} from "react";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {InscriptionsTable} from "@/components/InscriptionsTable";
import {CompetitorEventsTab} from "@/components/CompetitorEventsTab";

export default function Home() {
  const [tab, setTab] = useState("inscriptions");

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="inscriptions" className="cursor-pointer">
          Inscriptions
        </TabsTrigger>
        <TabsTrigger value="competitors" className="cursor-pointer">
          Compétiteurs
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
