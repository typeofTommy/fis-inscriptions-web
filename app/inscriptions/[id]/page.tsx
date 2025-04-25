import {InscriptionDetails} from "./InscriptionDetails";

interface PageProps {
  params: {
    id: string;
  };
}

export default function InscriptionPage({params}: PageProps) {
  return (
    <div className="container mx-auto py-8">
      <InscriptionDetails id={params.id} />
    </div>
  );
}
