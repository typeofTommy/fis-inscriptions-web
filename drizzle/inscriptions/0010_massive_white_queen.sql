ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN IF NOT EXISTS "men_status" "inscriptionsDB"."status";
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN IF NOT EXISTS "women_status" "inscriptionsDB"."status";
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN IF NOT EXISTS "men_email_sent_at" timestamp;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN IF NOT EXISTS "women_email_sent_at" timestamp;