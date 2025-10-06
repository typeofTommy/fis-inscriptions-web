-- Add missing email templates for contact_inscription and event_data_updated
-- These templates were previously hardcoded in API routes

-- Add contact_inscription template
UPDATE organizations
SET email_templates = jsonb_set(
  COALESCE(email_templates, '{}'::jsonb),
  '{contact_inscription}',
  '{"recipients": ["pmartin@ffs.fr", "jmagnellet@orange.fr"]}'::jsonb
)
WHERE code = 'FFS'
AND (email_templates->'contact_inscription' IS NULL);

-- Add event_data_updated template
UPDATE organizations
SET email_templates = jsonb_set(
  COALESCE(email_templates, '{}'::jsonb),
  '{event_data_updated}',
  '{"recipients": ["pmartin@ffs.fr"]}'::jsonb
)
WHERE code = 'FFS'
AND (email_templates->'event_data_updated' IS NULL);
