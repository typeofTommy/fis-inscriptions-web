ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "men_status" "inscriptionsDB"."status";--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "women_status" "inscriptionsDB"."status";--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "men_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "women_email_sent_at" timestamp;