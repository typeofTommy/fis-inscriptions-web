import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

export const inscriptions = pgTable("inscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteName: text("athlete_name").notNull(),
  birthDate: text("birth_date").notNull(),
  status: text("status", {enum: ["PENDING", "APPROVED", "REJECTED"]})
    .notNull()
    .default("PENDING"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
