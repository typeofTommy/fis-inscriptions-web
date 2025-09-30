-- Add cancelled status to the enum (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'cancelled'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'inscriptionsDB'))
    ) THEN
        ALTER TYPE "inscriptionsDB"."status" ADD VALUE 'cancelled';
    END IF;
END$$;