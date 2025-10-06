import {
  serial,
  text,
  jsonb,
  timestamp,
  pgTable,
} from "drizzle-orm/pg-core";

// Table in public schema for organization configs
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // "FFS", "RFEDI", etc.
  name: text("name").notNull(), // "Fédération Française de Ski"
  country: text("country").notNull(), // "FRA", "ESP", etc.
  baseUrl: text("base_url").notNull(), // "https://www.inscriptions-fis-etranger.fr"
  fromEmail: text("from_email").notNull(), // "Inscriptions FIS Etranger <noreply@inscriptions-fis-etranger.fr>"
  logo: text("logo"), // URL to logo
  emails: jsonb("emails").$type<{
    all_races: Array<{email: string, name: string, reason: string}>,
    women: Array<{email: string, name: string, reason: string}>,
    men: Array<{email: string, name: string, reason: string}>
  }>().notNull(),
  contacts: jsonb("contacts").$type<{
    responsible_for_entry: {
      address: string,
      men: {
        name: string,
        phone: string,
        email: string
      },
      women: {
        name: string,
        phone: string,
        email: string
      }
    },
    signature: {
      name: string,
      title: string
    }
  }>().notNull(),
  emailTemplates: jsonb("email_templates").$type<{
    inscription_pdf?: {
      subject_prefix: string,
      contact_email: {
        men: string,
        women: string
      },
      signature_urls: {
        men: string,
        women: string
      }
    },
    new_inscription?: {
      recipients: string[]
    },
    daily_recap?: {
      recipients: string[],
      cc: string[]
    },
    contact_inscription?: {
      recipients: string[]
    },
    event_data_updated?: {
      recipients: string[]
    }
  }>().default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});