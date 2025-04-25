CREATE SCHEMA "my_schema";
--> statement-breakpoint
CREATE TYPE "my_schema"."disciplines" AS ENUM('SL', 'GS', 'SG', 'DH', 'AC');--> statement-breakpoint
CREATE TYPE "my_schema"."race_levels" AS ENUM('FIS', 'CIT', 'NJR', 'NJC', 'NC', 'SAC', 'ANC', 'ENL');--> statement-breakpoint
CREATE TABLE "my_schema"."inscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"country" text NOT NULL,
	"location" text NOT NULL,
	"event_link" text NOT NULL,
	"codex_numbers" text[] NOT NULL,
	"first_race_date" date NOT NULL,
	"disciplines" "my_schema"."disciplines"[] NOT NULL,
	"race_levels" "my_schema"."race_levels"[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
