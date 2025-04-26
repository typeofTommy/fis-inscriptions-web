CREATE TYPE "inscriptionsDB"."sexes" AS ENUM('M', 'F');--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "last_race_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "codex_data" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" DROP COLUMN "codex_numbers";--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" DROP COLUMN "disciplines";--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" DROP COLUMN "race_levels";