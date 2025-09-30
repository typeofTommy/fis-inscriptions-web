DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coach_gender' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'inscriptionsDB')) THEN
        CREATE TYPE "inscriptionsDB"."coach_gender" AS ENUM('M', 'W', 'BOTH');
    END IF;
END$$;--> statement-breakpoint
ALTER TABLE "inscriptionsDB"."inscription_coaches" ADD COLUMN IF NOT EXISTS "gender" "inscriptionsDB"."coach_gender" DEFAULT 'BOTH' NOT NULL;