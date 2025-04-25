import {serial, text, pgSchema, date, timestamp} from "drizzle-orm/pg-core";

export const inscriptionsSchema = pgSchema("inscriptionsDB");

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
  codexNumbers: text("codex_numbers").array().notNull(),
  firstRaceDate: date("first_race_date").notNull(),
  disciplines: disciplines("disciplines").array().notNull(),
  raceLevels: raceLevels("race_levels").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
