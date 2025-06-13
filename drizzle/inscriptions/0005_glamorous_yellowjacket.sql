ALTER TABLE "inscriptionsDB"."inscription_coaches" RENAME COLUMN "name" TO "first_name";--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "team" text;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "start_date" text NOT NULL;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "end_date" text NOT NULL;