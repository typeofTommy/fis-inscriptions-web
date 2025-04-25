CREATE SCHEMA "inscriptionsDB";
--> statement-breakpoint
CREATE TYPE "inscriptionsDB"."disciplines" AS ENUM('SL', 'GS', 'SG', 'DH', 'AC');--> statement-breakpoint
CREATE TYPE "inscriptionsDB"."race_levels" AS ENUM('FIS', 'CIT', 'NJR', 'NJC', 'NC', 'SAC', 'ANC', 'ENL');--> statement-breakpoint
CREATE TABLE "inscriptionsDB"."inscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"country" text NOT NULL,
	"location" text NOT NULL,
	"event_link" text NOT NULL,
	"codex_numbers" text[] NOT NULL,
	"first_race_date" date NOT NULL,
	"disciplines" "inscriptionsDB"."disciplines"[] NOT NULL,
	"race_levels" "inscriptionsDB"."race_levels"[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "my_schema"."inscriptions" CASCADE;--> statement-breakpoint
DROP TYPE "my_schema"."disciplines";--> statement-breakpoint
DROP TYPE "my_schema"."race_levels";--> statement-breakpoint
DROP SCHEMA "my_schema";
