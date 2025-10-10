ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" ADD COLUMN "deleted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "deleted_at" timestamp;