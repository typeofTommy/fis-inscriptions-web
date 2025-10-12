-- Add base_url and from_email columns to organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS base_url TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS from_email TEXT;

-- Update FFS organization with base URL and from email
UPDATE public.organizations
SET
  base_url = COALESCE(base_url, 'https://www.inscriptions-fis-etranger.fr'),
  from_email = COALESCE(from_email, 'Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>')
WHERE code = 'FFS';

-- Make columns NOT NULL after setting values
ALTER TABLE public.organizations ALTER COLUMN base_url SET NOT NULL;
ALTER TABLE public.organizations ALTER COLUMN from_email SET NOT NULL;