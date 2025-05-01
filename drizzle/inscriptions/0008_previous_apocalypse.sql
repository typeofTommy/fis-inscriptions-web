ALTER TABLE "inscriptionsDB"."inscription_competitors" DROP CONSTRAINT "inscription_competitors_inscription_id_inscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" DROP CONSTRAINT "inscription_competitors_competitor_id_competitors_competitorid_fk";
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD COLUMN "location" integer;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" ADD CONSTRAINT "inscription_competitors_inscription_id_inscriptions_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "inscriptionsDB"."inscriptions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_competitors" ADD CONSTRAINT "inscription_competitors_competitor_id_competitors_competitorid_fk" FOREIGN KEY ("competitor_id") REFERENCES "inscriptionsDB"."competitors"("competitorid") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" ADD CONSTRAINT "inscriptions_location_stations_id_fk" FOREIGN KEY ("location") REFERENCES "inscriptionsDB"."stations"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscriptions" DROP COLUMN "country";