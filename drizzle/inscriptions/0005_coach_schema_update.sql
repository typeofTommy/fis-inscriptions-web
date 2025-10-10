ALTER TABLE "inscriptionsDB"."inscription_coaches" DROP COLUMN IF EXISTS "name";
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "first_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "last_name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "team" text;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "start_date" text;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "end_date" text;