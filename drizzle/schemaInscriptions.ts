import {
  serial,
  text,
  pgSchema,
  date,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const inscriptionsSchema = pgSchema("inscriptionsDB");

export const sexes = inscriptionsSchema.enum("sexes", ["M", "F"]);

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
        discipline: (typeof disciplines.$inferSelect)[number];
        sex: (typeof sexes.$inferSelect)[number];
        raceLevel: (typeof raceLevels.$inferSelect)[number];
      }[]
    >()
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stations = inscriptionsSchema.table("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
