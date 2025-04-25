import {InscriptionDetails} from "./InscriptionDetails";

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
    </div>
  );
}
