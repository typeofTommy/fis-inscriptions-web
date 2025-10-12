-- Update contacts structure to support gender-specific responsible_for_entry
-- This migration restructures the contacts JSONB field to have separate men/women contacts

UPDATE public.organizations
SET contacts = jsonb_build_object(
  'responsible_for_entry', jsonb_build_object(
    'address', COALESCE(contacts->'responsible_for_entry'->>'address', 'FFS - 50 avenue des Marquisats - 74000 ANNECY'),
    'men', jsonb_build_object(
      'name', 'Philippe MARTIN',
      'phone', '+33 666 49 28 99',
      'email', 'pmartin@ffs.fr'
    ),
    'women', jsonb_build_object(
      'name', 'Jean-Michel Agnellet',
      'phone', '+33 788 04 56 50',
      'email', 'jmagnellet@orange.fr'
    )
  ),
  'signature', contacts->'signature'
)
WHERE code = 'FFS'
AND (
  contacts->'responsible_for_entry'->>'name' IS NOT NULL
  OR contacts->'responsible_for_entry' IS NULL
);