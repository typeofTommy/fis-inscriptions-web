import {InscriptionDetails} from "./InscriptionDetails";
import {CodexTabs} from "./CodexTabs";

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
      <CodexTabs inscriptionId={resolvedParams.id} />
    </div>
  );
}
