import {InscriptionDetails} from "./InscriptionDetails";
import {CodexTabs} from "./CodexTabs";
import {Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs";
import {RecapEvent} from "./RecapEvent";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InscriptionPage({params}: PageProps) {
  const resolvedParams = await params;

  return (
    <div className="container mx-auto py-8">
      <InscriptionDetails id={resolvedParams.id} />
      <div className="bg-white p-4 mt-6">
        <Tabs defaultValue="recap" className="w-full">
          <TabsList className="inline-flex bg-slate-100 rounded-md border border-slate-200 shadow-sm p-0">
            <TabsTrigger
              value="recap"
              className="px-7 py-2 text-base font-bold transition-colors duration-150 border-none rounded-l-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              Récapitulatif
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="px-7 py-2 text-base font-bold transition-colors duration-150 border-none rounded-r-md data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-300 data-[state=inactive]:bg-transparent data-[state=inactive]:text-slate-400 data-[state=inactive]:shadow-none cursor-pointer"
            >
              Détail
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recap">
            <RecapEvent inscriptionId={resolvedParams.id} />
          </TabsContent>
          <TabsContent value="details">
            <CodexTabs inscriptionId={resolvedParams.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
