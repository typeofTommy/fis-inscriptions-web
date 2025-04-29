import {Discipline, RaceLevel, Sex} from "@/app/types";
import {
  serial,
  text,
  pgSchema,
  date,
  timestamp,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

export const inscriptionsSchema = pgSchema("inscriptionsDB");

export const sexes = inscriptionsSchema.enum("sexes", ["M", "F"]);
export const inscriptionStatus = inscriptionsSchema.enum("status", [
  "open",
  "validated",
]);

export const disciplines = inscriptionsSchema.enum("disciplines", [
  "SL",
  "GS",
  "SG",
  "DH",
  "AC",
]);

export const raceLevels = inscriptionsSchema.enum("race_levels", [
  "FIS",
  "CIT",
  "NJR",
  "NJC",
  "NC",
  "SAC",
  "ANC",
  "ENL",
]);

export const inscriptions = inscriptionsSchema.table("inscriptions", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  country: text("country").notNull(),
  location: text("location").notNull(),
  eventLink: text("event_link").notNull(),
  firstRaceDate: date("first_race_date").notNull(),
  lastRaceDate: date("last_race_date").notNull(),
  codexData: jsonb("codex_data")
    .$type<
      {
        number: string;
        discipline: Discipline[number];
        sex: Sex[number];
        raceLevel: RaceLevel[number];
      }[]
    >()
    .notNull(),
  status: inscriptionStatus("status").notNull().default("open"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
});

export const stations = inscriptionsSchema.table("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inscriptionCompetitors = inscriptionsSchema.table(
  "inscription_competitors",
  {
    id: serial("id").primaryKey(),
    inscriptionId: integer("inscription_id")
      .notNull()
      .references(() => inscriptions.id, {
        onDelete: "cascade",
      }),
    competitorId: integer("competitor_id")
      .notNull()
      .references(() => competitors.competitorid, {
        onDelete: "cascade",
      }),
    codexNumber: text("codex_number").notNull(),
  }
);

export const competitors = inscriptionsSchema.table("competitors", {
  listid: integer("listid"),
  listname: text("listname"),
  listpublished: integer("listpublished"),
  published: integer("published"),
  sectorcode: text("sectorcode"),
  status: text("status"),
  competitorid: integer("competitorid").primaryKey(),
  fiscode: text("fiscode"),
  lastname: text("lastname"),
  firstname: text("firstname"),
  nationcode: text("nationcode"),
  gender: text("gender"),
  birthdate: text("birthdate"),
  skiclub: text("skiclub"),
  nationalcode: text("nationalcode"),
  competitorname: text("competitorname"),
  birthyear: integer("birthyear"),
  calculationdate: text("calculationdate"),
  dhpoints: text("dhpoints"),
  dhpos: text("dhpos"),
  dhsta: text("dhsta"),
  slpoints: text("slpoints"),
  slpos: text("slpos"),
  slsta: text("slsta"),
  gspoints: text("gspoints"),
  gspos: text("gspos"),
  gssta: text("gssta"),
  sgpoints: text("sgpoints"),
  sgpos: text("sgpos"),
  sgsta: text("sgsta"),
  acpoints: text("acpoints"),
  acpos: text("acpos"),
  acsta: text("acsta"),
});
