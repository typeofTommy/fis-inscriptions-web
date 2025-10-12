-- Add email_templates column to organizations table (if not exists)
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email_templates JSONB DEFAULT '{}'::jsonb NOT NULL;

-- Update FFS organization with current email templates (only if not already set)
UPDATE public.organizations
SET email_templates = '{
  "inscription_pdf": {
    "subject_prefix": "French 🇫🇷",
    "contact_email": {
      "men": "pmartin@ffs.fr",
      "women": "jmagnellet@orange.fr"
    },
    "signature_urls": {
      "men": "https://i.imgur.com/tSwmL0f.png",
      "women": "https://i.imgur.com/ISeoDQp.jpeg"
    }
  },
  "new_inscription": {
    "recipients": ["pmartin@ffs.fr"]
  },
  "daily_recap": {
    "recipients": ["pmartin@ffs.fr", "dchastan@ffs.fr"],
    "cc": []
  }
}'::jsonb
WHERE code = 'FFS' AND (email_templates = '{}'::jsonb OR email_templates IS NULL);