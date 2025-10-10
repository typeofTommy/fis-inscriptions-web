CREATE SCHEMA "inscriptionsDB";
--> statement-breakpoint
CREATE TYPE "inscriptionsDB"."status" AS ENUM('open', 'validated');
--> statement-breakpoint
CREATE TABLE "inscriptionsDB"."competitors" (
	"listid" integer,
	"listname" text,
	"listpublished" integer,
	"published" integer,
	"sectorcode" text,
	"status" text,
	"competitorid" integer PRIMARY KEY NOT NULL,
	"fiscode" text,
	"lastname" text,
	"firstname" text,
	"nationcode" text,
	"gender" text,
	"birthdate" text,
	"skiclub" text,
	"nationalcode" text,
	"competitorname" text,
	"birthyear" integer,
	"calculationdate" text,
	"dhpoints" text,
	"dhpos" text,
	"dhsta" text,
	"slpoints" text,
	"slpos" text,
	"slsta" text,
	"gspoints" text,
	"gspos" text,
	"gssta" text,
	"sgpoints" text,
	"sgpos" text,
	"sgsta" text,
	"acpoints" text,
	"acpos" text,
	"acsta" text
);
--> statement-breakpoint
CREATE TABLE "inscriptionsDB"."inscription_competitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscription_id" integer NOT NULL,
	"competitor_id" integer NOT NULL,
	"codex_number" text NOT NULL,
	"added_by" text DEFAULT 'Unknown'
);
--> statement-breakpoint
CREATE TABLE "inscriptionsDB"."inscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"event_data" jsonb NOT NULL,
	"status" "inscriptionsDB"."status" DEFAULT 'open',
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" ADD CONSTRAINT "inscription_competitors_inscription_id_inscriptions_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "inscriptionsDB"."inscriptions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" ADD CONSTRAINT "inscription_competitors_competitor_id_competitors_competitorid_fk" FOREIGN KEY ("competitor_id") REFERENCES "inscriptionsDB"."competitors"("competitorid") ON DELETE cascade ON UPDATE no action;