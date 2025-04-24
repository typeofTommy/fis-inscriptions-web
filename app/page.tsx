import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import db from "./db";
import {aCompetitor} from "@/drizzle/schema";

export default async function Home() {
  const competitors = await db.select().from(aCompetitor).limit(10);

  return (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Compétiteurs" />
      </SelectTrigger>
      <SelectContent>
        {competitors.map((competitor) => (
          <SelectItem
            key={competitor.competitorid}
            value={competitor.competitorid.toString()}
          >
            {competitor.firstname} {competitor.lastname}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
