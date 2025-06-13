CREATE TABLE "inscriptionsDB"."inscription_coaches" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscription_id" integer NOT NULL,
	"name" text NOT NULL,
	"added_by" text DEFAULT 'Unknown',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD CONSTRAINT "inscription_coaches_inscription_id_inscriptions_id_fk" FOREIGN KEY ("inscription_id") REFERENCES "inscriptionsDB"."inscriptions"("id") ON DELETE cascade ON UPDATE no action;