import {
  competitors,
  disciplines,
  inscriptions,
  raceLevels,
  sexes,
  stations,
} from "@/drizzle/schemaInscriptions";

export type Inscription = typeof inscriptions.$inferSelect;
export type Competitor = typeof competitors.$inferSelect;
export type Discipline = typeof disciplines.$inferSelect;
export type RaceLevel = typeof raceLevels.$inferSelect;
export type Sex = typeof sexes.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Country = {
  name: {
    common: string;
  };
  cca2: string;
  flags: {
    svg: string;
    png: string;
  };
};
