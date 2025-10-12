-- Create organizations table in public schema
CREATE TABLE IF NOT EXISTS public.organizations (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"logo" text,
	"emails" jsonb NOT NULL,
	"contacts" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "organizations_code_unique" UNIQUE("code")
);

-- Insert FFS data (only if not exists)
INSERT INTO public.organizations ("code", "name", "country", "emails", "contacts")
SELECT
	'FFS',
	'Fédération Française de Ski',
	'FRA',
	'{"all_races": [{"email": "pmartin@ffs.fr", "name": "P. Martin", "reason": "Automatique FFS"}, {"email": "jmagnellet@orange.fr", "name": "J.M Agnellet", "reason": "Automatique FFS"}, {"email": "dchastan@ffs.fr", "name": "D. Chastan", "reason": "Automatique FFS"}, {"email": "mbeauregard@ffs.fr", "name": "M. Beauregard", "reason": "Automatique FFS"}], "women": [{"email": "lionelpellicier@gmail.com", "name": "L. Pellicier", "reason": "Courses Femmes"}], "men": []}'::jsonb,
	'{"responsible_for_entry": {"name": "David CHASTAN", "address": "FFS - 50 avenue des Marquisats - 74000 ANNECY", "phone": "+33 4 50 51 40 34", "email": "dchastan@ffs.fr"}, "signature": {"name": "David CHASTAN", "title": "Directeur Sportif Coupe du Monde"}}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.organizations WHERE "code" = 'FFS');