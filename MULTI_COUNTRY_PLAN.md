# Plan de migration multi-pays (France → France + Espagne)

## Contexte

L'application a été conçue initialement pour l'équipe de France de ski. L'équipe d'Espagne souhaite maintenant l'utiliser également. Ce document détaille les modifications nécessaires pour supporter plusieurs fédérations nationales.

**Architecture retenue:** Multi-tenant avec schemas PostgreSQL séparés

**Stratégie d'implémentation:** Approche progressive

1. **Phase 1:** Abstraction (France uniquement) - Valider l'architecture en prod
2. **Phase 2:** Espagne - Ajouter le second pays une fois l'infra validée

**Avantages:**

- ✅ Coût: 0€ (une seule DB Neon, un seul Vercel, un seul Clerk)
- ✅ Isolation native PostgreSQL (impossible de leak des données entre pays)
- ✅ Pas de filtrage manuel par `countryCode` dans les queries
- ✅ Performance: schemas PostgreSQL = gestion native et rapide
- ✅ Scalable: facile d'ajouter Andorre, Chili, etc.
- ✅ Sécurisé: déploiement progressif sans risque pour la prod actuelle

---

## 🔴 ÉTAPE 0 : BACKUP DE LA BASE DE DONNÉES (CRITIQUE)

**⚠️ À FAIRE AVANT TOUTE MODIFICATION DE LA BASE DE DONNÉES**

### 0.1 Backup via Neon Branching (gratuit, instantané)

```bash
# Créer une branch de sauvegarde
neon branches create backup-before-multi-country --parent main

# En cas de problème, restaurer avec:
# neon branches restore main backup-before-multi-country
```

**Avantages:**

- ✅ Gratuit (limite: 10 branches sur tier gratuit)
- ✅ Instantané (copy-on-write)
- ✅ 7 jours d'historique (Time Travel)

### 0.2 Backup via pg_dump (gratuit, manuel, stockage local)

```bash
# Récupérer la connection string depuis Neon Dashboard
export NEON_CONNECTION_STRING="postgresql://user:pass@host/dbname"

# Dump complet de la DB
pg_dump $NEON_CONNECTION_STRING -Fc -f backup-$(date +%Y%m%d-%H%M%S).dump

# Vérifier que le fichier existe
ls -lh backup-*.dump

# En cas de problème, restaurer avec:
# pg_restore -d $NEON_CONNECTION_STRING backup-YYYYMMDD-HHMMSS.dump
```

**Avantages:**

- ✅ Gratuit
- ✅ Backup local (pas dépendant de Neon)
- ✅ Peut être versionné avec Git LFS ou stocké sur S3

**Fichiers impactés:** Aucun (procédure externe)

**Estimation:** 15-30 minutes

**⚠️ NE PAS PASSER À L'ÉTAPE SUIVANTE SANS AVOIR FAIT LES DEUX BACKUPS**

---

## PHASE 1 : ABSTRACTION (France uniquement)

**Objectif:** Préparer le code pour être multi-pays sans casser la production actuelle

**Principe:** On adapte toute l'architecture pour être multi-pays, mais on ne crée que le schema France. L'Espagne viendra après validation en prod.

---

### 1.1 Table `organizations` (config partagée)

**Problème actuel:**
Toutes les données spécifiques à la France sont hardcodées en dur dans le code :

- Code pays "FRA" dans `app/api/competitors/route.ts:25`
- Emails FFS dans `RecipientManager.tsx:36-49`
- Logos `/ffs_logo.png` et signatures email en dur
- Texte "French 🇫🇷" dans les templates d'email

**Solution:** Table `organizations` dans le schema `public` (partagée entre tous les pays)

```typescript
// drizzle/schemaInscriptions.ts - Schema PUBLIC (partagé)
import {pgTable, serial, text, varchar, jsonb} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", {length: 3}).unique().notNull(),
  name: text("name").notNull(),
  shortName: varchar("short_name", {length: 50}).notNull(),
  flag: varchar("flag", {length: 10}).notNull(),
  logoUrl: text("logo_url").notNull(),
  address: text("address"),
  emailDomain: text("email_domain"),
  emailSignatureMenUrl: text("email_signature_men_url"),
  emailSignatureWomenUrl: text("email_signature_women_url"),
  recipientsJson: jsonb("recipients_json").$type<{
    all: string[];
    men?: string[];
    women?: string[];
  }>(),
  contactsJson: jsonb("contacts_json").$type<{
    men?: {name: string; email: string; phone: string};
    women?: {name: string; email: string; phone: string};
  }>(),
});
```

**Seeder initial (Phase 1 - France uniquement):**

```typescript
// migrations/seed-organizations.ts
await db.insert(organizations).values({
  countryCode: "FRA",
  name: "Fédération Française de Ski",
  shortName: "FFS",
  flag: "🇫🇷",
  logoUrl: "/organizations/FRA/logo.png",
  address: "50 rue des Marquisats, 74000 Annecy",
  emailDomain: "inscriptions-fis-etranger.fr",
  emailSignatureMenUrl: "https://i.imgur.com/tSwmL0f.png",
  emailSignatureWomenUrl: "https://i.imgur.com/ISeoDQp.jpeg",
  recipientsJson: {
    all: ["pmartin@ffs.fr", "dchastan@ffs.fr"],
    men: ["jmagnellet@orange.fr"],
    women: ["lionelpellicier@gmail.com"],
  },
  contactsJson: {
    men: {name: "J.M Agnellet", email: "jmagnellet@orange.fr", phone: "+33..."},
    women: {
      name: "L. Pellicier",
      email: "lionelpellicier@gmail.com",
      phone: "+33...",
    },
  },
});
```

**Fichiers impactés:**

- `drizzle/schemaInscriptions.ts`
- Nouvelle migration `migrations/XXXX_create_organizations.sql`
- Script seeder `scripts/seed-organizations.ts`

**Estimation:** 2-3 heures

---

### 1.2 Schema PostgreSQL `ffs` (migration des données actuelles)

**Objectif:** Déplacer toutes les données actuelles du schema `inscriptionsDB` vers un nouveau schema `ffs`

**Architecture (Phase 1):**

```
public (schema partagé)
├── organizations (config)

ffs (schema France)
├── inscriptions (données migrées depuis inscriptionsDB)
├── inscription_competitors (données migrées)
├── inscription_coaches (données migrées)
├── competitors (données migrées)
```

**Implémentation avec factory functions:**

```typescript
// drizzle/schemaInscriptions.ts
import {
  pgSchema,
  serial,
  integer,
  text,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import type {Competition} from "@/app/types";

// Schema France
export const ffsSchema = pgSchema("ffs");

// Factory function pour éviter la duplication (future ESP)
const createInscriptionsTable = (schema: ReturnType<typeof pgSchema>) =>
  schema.table("inscriptions", {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull(),
    eventData: jsonb("event_data").$type<Competition>().notNull(),
    status: schema
      .enum("status", ["open", "validated", "email_sent", "cancelled"])
      .default("open"),
    menStatus: schema.enum("men_status", [
      "open",
      "validated",
      "email_sent",
      "cancelled",
    ]),
    womenStatus: schema.enum("women_status", [
      "open",
      "validated",
      "email_sent",
      "cancelled",
    ]),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    emailSentAt: timestamp("email_sent_at"),
    menEmailSentAt: timestamp("men_email_sent_at"),
    womenEmailSentAt: timestamp("women_email_sent_at"),
    deletedAt: timestamp("deleted_at"),
  });

// Tables FFS (Phase 1)
export const ffsInscriptions = createInscriptionsTable(ffsSchema);
export const ffsInscriptionCompetitors =
  createInscriptionCompetitorsTable(ffsSchema);
export const ffsInscriptionCoaches = createInscriptionCoachesTable(ffsSchema);
export const ffsCompetitors = createCompetitorsTable(ffsSchema);

// Types unifiés
export type Inscriptions = typeof ffsInscriptions;
export type InscriptionCompetitors = typeof ffsInscriptionCompetitors;
// ... etc
```

**Migration des données:**

```sql
-- migrations/XXXX_create_ffs_schema.sql
CREATE SCHEMA IF NOT EXISTS ffs;

-- Drizzle génèrera automatiquement les CREATE TABLE dans le schema ffs

-- migrations/XXXX_migrate_data_to_ffs.sql
-- Copier toutes les données du schema inscriptionsDB vers ffs
INSERT INTO ffs.inscriptions SELECT * FROM "inscriptionsDB".inscriptions;
INSERT INTO ffs.inscription_competitors SELECT * FROM "inscriptionsDB".inscription_competitors;
INSERT INTO ffs.inscription_coaches SELECT * FROM "inscriptionsDB".inscription_coaches;
INSERT INTO ffs.competitors SELECT * FROM "inscriptionsDB".competitors;

-- IMPORTANT: Ne pas supprimer l'ancien schema tout de suite (garder en backup)
```

**Fichiers impactés:**

- `drizzle/schemaInscriptions.ts` (refactoring complet)
- Nouvelles migrations
- Script de migration des données

**Estimation:** 4-5 heures

---

### 1.3 Helper `getDbTables()` (Phase 1 - retourne toujours `ffs`)

**Objectif:** Créer l'abstraction pour les queries, mais retourner toujours `ffs` pour l'instant

```typescript
// lib/getDbTables.ts
import {
  ffsInscriptions,
  ffsInscriptionCompetitors,
  ffsInscriptionCoaches,
  ffsCompetitors,
} from "@/drizzle/schemaInscriptions";

// Phase 1: Toujours retourner ffs (pas encore de logique Clerk)
export const getDbTables = async () => {
  return {
    inscriptions: ffsInscriptions,
    inscriptionCompetitors: ffsInscriptionCompetitors,
    inscriptionCoaches: ffsInscriptionCoaches,
    competitors: ffsCompetitors,
  };
};

// Version synchrone pour certains cas d'usage
export const getDbTablesSync = () => {
  return {
    inscriptions: ffsInscriptions,
    inscriptionCompetitors: ffsInscriptionCompetitors,
    inscriptionCoaches: ffsInscriptionCoaches,
    competitors: ffsCompetitors,
  };
};
```

**Utilisation dans les API routes:**

```typescript
// app/api/inscriptions/route.ts
import {getDbTables} from "@/lib/getDbTables";

export async function GET(req: NextRequest) {
  const tables = await getDbTables();

  const inscriptions = await db.select().from(tables.inscriptions); // Tape automatiquement sur ffs.inscriptions !

  return NextResponse.json(inscriptions);
}
```

**Remplacer TOUTES les queries directes:**

- `app/api/inscriptions/route.ts`
- `app/api/competitors/route.ts`
- `app/api/coaches/route.ts`
- Tous les fichiers utilisant les tables (~20-30 fichiers)

**Fichiers impactés:**

- `lib/getDbTables.ts` (nouveau)
- ~20 fichiers API routes
- ~10 fichiers composants serveur

**Estimation:** 3-4 heures

---

### 1.4 Internationalisation (i18n) - OBLIGATOIRE

**Pourquoi en Phase 1 ?** L'Espagne ne peut pas utiliser une interface en français !

#### 1.4.1 Installation et configuration next-intl

```bash
pnpm add next-intl
```

```typescript
// next.config.ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

export default withNextIntl({
  // Configuration Next.js existante
});
```

```typescript
// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

#### 1.4.2 Structure des traductions

```
/messages/
  /fr/
    common.json
    inscriptions.json
    competitors.json
    emails.json
  /es/
    common.json
    inscriptions.json
    competitors.json
    emails.json
  /en/
    common.json
    inscriptions.json
    competitors.json
    emails.json
```

#### 1.4.3 Extraction des textes hardcodés

**Exemples de traductions nécessaires:**

```json
// messages/fr/common.json
{
  "navigation": {
    "inscriptions": "Inscriptions",
    "competitors": "Compétiteurs",
    "profile": "Profil"
  },
  "actions": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier"
  }
}

// messages/fr/inscriptions.json
{
  "form": {
    "eventName": "Nom de l'événement",
    "startDate": "Date de début",
    "endDate": "Date de fin",
    "status": "Statut"
  },
  "status": {
    "open": "Ouvert",
    "validated": "Validé",
    "email_sent": "Email envoyé",
    "cancelled": "Annulé"
  }
}
```

**Utilisation dans les composants:**

```typescript
// Avant
<h1>Inscriptions FIS</h1>
<button>Enregistrer</button>

// Après
import { useTranslations } from 'next-intl';

const t = useTranslations();

<h1>{t('inscriptions.title')}</h1>
<button>{t('common.actions.save')}</button>
```

**Fichiers impactés:**

- `next.config.ts`
- `app/[locale]/layout.tsx` (nouveau)
- `messages/` (nouveau dossier complet)
- ~30 composants avec texte hardcodé

**Estimation:** 8-12 heures (extraction + traductions FR/ES/EN)

---

### 1.5 API `/api/config/organization` et Context React

**API route:**

```typescript
// app/api/config/organization/route.ts
import {db} from "@/app/db/inscriptionsDB";
import {organizations} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";

export async function GET() {
  // Phase 1: Toujours retourner FRA (pas encore de logique Clerk)
  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.countryCode, "FRA"))
    .limit(1);

  if (!org[0]) {
    return new NextResponse("Organization not found", {status: 404});
  }

  return NextResponse.json(org[0]);
}
```

**Context React:**

```typescript
// app/contexts/OrganizationContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Organization = {
  countryCode: string;
  name: string;
  shortName: string;
  flag: string;
  logoUrl: string;
  address?: string;
  emailDomain?: string;
  emailSignatureMenUrl?: string;
  emailSignatureWomenUrl?: string;
  recipientsJson?: {
    all: string[];
    men?: string[];
    women?: string[];
  };
  contactsJson?: {
    men?: { name: string; email: string; phone: string };
    women?: { name: string; email: string; phone: string };
  };
};

const OrganizationContext = createContext<Organization | null>(null);

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetch("/api/config/organization")
      .then((res) => res.json())
      .then(setOrg);
  }, []);

  return (
    <OrganizationContext.Provider value={org}>
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
};
```

**Fichiers impactés:**

- `app/api/config/organization/route.ts` (nouveau)
- `app/contexts/OrganizationContext.tsx` (nouveau)
- `app/layout.tsx` (wrapper avec OrganizationProvider)

**Estimation:** 2-3 heures

---

### 1.6 Remplacer les valeurs hardcodées par la config dynamique

#### 1.6.1 Logos et signatures (PDF)

```typescript
// app/inscriptions/[id]/pdf/components/NationalAssociationBlock.tsx
import { useOrganization } from "@/app/contexts/OrganizationContext";

export const NationalAssociationBlock = () => {
  const org = useOrganization();

  return (
    <div>
      <img src={org.logoUrl} alt={org.shortName} />
      <h2>{org.name}</h2>
      {org.address && <p>{org.address}</p>}
    </div>
  );
};
```

#### 1.6.2 Destinataires des emails

```typescript
// app/inscriptions/[id]/pdf/components/RecipientManager.tsx
import {useOrganization} from "@/app/contexts/OrganizationContext";

const RecipientManager = ({gender}: {gender: "M" | "W"}) => {
  const org = useOrganization();

  const predefinedEmails = [
    ...(org.recipientsJson?.all || []),
    ...(gender === "M" ? org.recipientsJson?.men || [] : []),
    ...(gender === "W" ? org.recipientsJson?.women || [] : []),
  ];

  // ... reste du code
};
```

#### 1.6.3 Templates d'email

```typescript
// app/api/send-inscription-pdf/route.ts
import {organizations} from "@/drizzle/schemaInscriptions";

const org = await db
  .select()
  .from(organizations)
  .where(eq(organizations.countryCode, "FRA")) // Phase 1: toujours FRA
  .limit(1);

const emailHtml = `
  <p>Please find attached the ${org[0].name} ${org[0].flag} <b><i>${subjectGender}</i></b> Team entries for the following races:</p>
  ...
  <img src="${isWomen ? org[0].emailSignatureWomenUrl : org[0].emailSignatureMenUrl}" alt="Email Signature" />
`;

const subject = `${org[0].name} ${org[0].flag} ${subjectGender} entries for ${shortDate} ➞ ${place} ${nation}-FIS`;
```

**Fichiers impactés:**

- `app/inscriptions/[id]/pdf/components/NationalAssociationBlock.tsx`
- `app/inscriptions/[id]/pdf/components/CompetitorsTable/TableFooter.tsx`
- `app/inscriptions/[id]/pdf/components/ResponsibleForEntryBlock.tsx`
- `app/inscriptions/[id]/pdf/components/RecipientManager.tsx`
- `app/api/send-inscription-pdf/route.ts`

**Estimation:** 3-4 heures

---

### 1.7 Tests Phase 1

**Adapter les tests existants:**

```typescript
// tests/__mocks__/organization.ts
export const mockOrganization = {
  countryCode: "FRA",
  name: "Fédération Française de Ski",
  shortName: "FFS",
  flag: "🇫🇷",
  logoUrl: "/organizations/FRA/logo.png",
  // ... autres champs
};

// tests/__mocks__/db.ts
import {ffsInscriptions} from "@/drizzle/schemaInscriptions";

export const mockGetDbTables = vi.fn(() => ({
  inscriptions: ffsInscriptions,
  // ...
}));
```

**Fichiers impactés:**

- `tests/__mocks__/organization.ts` (nouveau)
- `tests/__mocks__/db.ts`
- Tous les tests existants (~10 fichiers)

**Estimation:** 3-4 heures

---

## Résumé Phase 1

### Objectifs Phase 1 ✅

- ✅ Architecture multi-pays opérationnelle
- ✅ Schema `ffs` avec toutes les données migrées
- ✅ Code abstrait avec `getDbTables()`
- ✅ i18n complet (FR/ES/EN)
- ✅ Config dynamique via `organizations`
- ✅ Tests adaptés
- ✅ **France continue de fonctionner normalement**

### Temps Phase 1

| Tâche                              | Temps |
| ---------------------------------- | ----- |
| 1.1 Table organizations            | 2-3h  |
| 1.2 Schema ffs + migration données | 4-5h  |
| 1.3 Helper getDbTables()           | 3-4h  |
| 1.4 i18n (next-intl + traductions) | 8-12h |
| 1.5 API config + Context React     | 2-3h  |
| 1.6 Remplacer valeurs hardcodées   | 3-4h  |
| 1.7 Tests                          | 3-4h  |

**Total Phase 1:** 25-35 heures

---

## PHASE 2 : ESPAGNE (après validation Phase 1)

**Objectif:** Ajouter l'Espagne maintenant que l'infrastructure est validée en production

**Principe:** L'architecture étant prête, ajouter l'Espagne devient trivial.

---

### 2.1 Créer schema `rfedi` pour l'Espagne

```typescript
// drizzle/schemaInscriptions.ts (ajout)

// Schema Espagne
export const rfediSchema = pgSchema("rfedi");

// Tables RFEDI (même structure que FFS)
export const rfediInscriptions = createInscriptionsTable(rfediSchema);
export const rfediInscriptionCompetitors =
  createInscriptionCompetitorsTable(rfediSchema);
export const rfediInscriptionCoaches =
  createInscriptionCoachesTable(rfediSchema);
export const rfediCompetitors = createCompetitorsTable(rfediSchema);

// Types unifiés (mise à jour)
export type Inscriptions = typeof ffsInscriptions | typeof rfediInscriptions;
export type InscriptionCompetitors =
  | typeof ffsInscriptionCompetitors
  | typeof rfediInscriptionCompetitors;
```

**Migration:**

```sql
-- migrations/XXXX_create_rfedi_schema.sql
CREATE SCHEMA IF NOT EXISTS rfedi;

-- Drizzle génèrera automatiquement les CREATE TABLE (vides au départ)
```

**Estimation:** 1-2 heures

---

### 2.2 Ajouter données ESP dans `organizations`

```typescript
// Script ou migration
await db.insert(organizations).values({
  countryCode: "ESP",
  name: "Real Federación Española de Deportes de Invierno",
  shortName: "RFEDI",
  flag: "🇪🇸",
  logoUrl: "/organizations/ESP/logo.png",
  address: "...", // À obtenir de la RFEDI
  emailDomain: "...", // À définir
  emailSignatureMenUrl: "...", // À obtenir
  emailSignatureWomenUrl: "...", // À obtenir
  recipientsJson: {
    all: ["...@rfedi.es"], // À obtenir
  },
  contactsJson: {}, // À obtenir
});
```

**Estimation:** 1 heure

---

### 2.3 Clerk : Migration users + Admin ESP + Héritage invitations

#### 2.3.1 Migration users existants → FRA

```typescript
// scripts/migrate-clerk-users.ts
import {clerkClient} from "@clerk/nextjs/server";

const users = await clerkClient.users.getUserList();

for (const user of users) {
  await clerkClient.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...user.publicMetadata,
      country: "FRA", // Par défaut, tous les users actuels sont français
    },
  });
}
```

#### 2.3.2 Créer admin espagnol

```typescript
// Dans Clerk Dashboard ou via script
await clerkClient.users.updateUserMetadata("admin_espagnol_id", {
  publicMetadata: {
    country: "ESP",
    role: "admin",
  },
});
```

#### 2.3.3 Héritage lors des invitations

```typescript
// app/api/invitations/route.ts
import {currentUser} from "@clerk/nextjs/server";

const inviter = await currentUser();
const inviterCountry = inviter.publicMetadata.country as string;

await clerkClient.invitations.createInvitation({
  emailAddress: req.body.email,
  publicMetadata: {
    country: inviterCountry, // L'invité hérite du pays de l'inviteur
  },
});
```

**Estimation:** 2-3 heures

---

### 2.4 Adapter `getDbTables()` pour la logique multi-pays

```typescript
// lib/getDbTables.ts (mise à jour)
import {currentUser} from "@clerk/nextjs/server";
import {
  ffsInscriptions,
  ffsInscriptionCompetitors,
  ffsInscriptionCoaches,
  ffsCompetitors,
  rfediInscriptions,
  rfediInscriptionCompetitors,
  rfediInscriptionCoaches,
  rfediCompetitors,
} from "@/drizzle/schemaInscriptions";

export const getDbTables = async () => {
  const user = await currentUser();
  const country = (user?.publicMetadata?.country as string) || "FRA";

  if (country === "ESP") {
    return {
      inscriptions: rfediInscriptions,
      inscriptionCompetitors: rfediInscriptionCompetitors,
      inscriptionCoaches: rfediInscriptionCoaches,
      competitors: rfediCompetitors,
    };
  }

  return {
    inscriptions: ffsInscriptions,
    inscriptionCompetitors: ffsInscriptionCompetitors,
    inscriptionCoaches: ffsInscriptionCoaches,
    competitors: ffsCompetitors,
  };
};

// Version pour API routes avec header
export const getDbTablesFromRequest = (req: NextRequest) => {
  const country = req.headers.get("x-user-country") || "FRA";

  if (country === "ESP") {
    return {
      inscriptions: rfediInscriptions,
      inscriptionCompetitors: rfediInscriptionCompetitors,
      inscriptionCoaches: rfediInscriptionCoaches,
      competitors: rfediCompetitors,
    };
  }

  return {
    inscriptions: ffsInscriptions,
    inscriptionCompetitors: ffsInscriptionCompetitors,
    inscriptionCoaches: ffsInscriptionCoaches,
    competitors: ffsCompetitors,
  };
};
```

**Estimation:** 1-2 heures

---

### 2.5 Middleware Next.js (injection country dans headers)

```typescript
// middleware.ts
import {authMiddleware} from "@clerk/nextjs";
import {currentUser} from "@clerk/nextjs/server";

export default authMiddleware({
  async afterAuth(auth, req) {
    if (auth.userId) {
      const user = await currentUser();
      const country = (user?.publicMetadata?.country as string) || "FRA";

      // Injecter dans les headers pour les API routes
      req.headers.set("x-user-country", country);
    }
  },
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

**Estimation:** 1-2 heures

---

### 2.6 Adapter API `/api/config/organization` pour la logique multi-pays

```typescript
// app/api/config/organization/route.ts (mise à jour)
import {currentUser} from "@clerk/nextjs/server";
import {db} from "@/app/db/inscriptionsDB";
import {organizations} from "@/drizzle/schemaInscriptions";
import {eq} from "drizzle-orm";

export async function GET() {
  const user = await currentUser();
  const country = (user?.publicMetadata?.country as string) || "FRA";

  const org = await db
    .select()
    .from(organizations)
    .where(eq(organizations.countryCode, country))
    .limit(1);

  if (!org[0]) {
    return new NextResponse("Organization not found", {status: 404});
  }

  return NextResponse.json(org[0]);
}
```

**Estimation:** 30 minutes

---

### 2.7 Cronjob import-competitors multi-schemas

```javascript
// scripts/import-competitors.cjs (mise à jour)
const countries = process.env.IMPORT_COUNTRIES?.split(",") || ["FRA"];

for (const country of countries) {
  console.log(`Importing competitors for ${country}...`);

  const schema = country === "FRA" ? "ffs" : "rfedi";

  // Importer dans le bon schema
  await sql`
    INSERT INTO ${sql.identifier([schema, "competitors"])}
    (competitorid, firstname, lastname, nationcode, ...)
    VALUES (...)
  `;
}
```

**Configuration CI (GitHub Actions):**

```yaml
# .github/workflows/import-competitors.yml
- name: Import competitors
  run: node scripts/import-competitors.cjs
  env:
    IMPORT_COUNTRIES: "FRA,ESP"
```

**Estimation:** 2-3 heures

---

### 2.8 Tests d'isolation schemas

```typescript
// tests/integration/schema-isolation.test.ts
describe("Schema isolation", () => {
  it("should not allow FRA users to access ESP data", async () => {
    // Créer des données dans rfedi schema
    await db.insert(rfediInscriptions).values({
      eventId: 1,
      eventData: mockEvent,
      createdBy: "esp_user",
    });

    // Se connecter en tant que user FRA
    mockCurrentUser({country: "FRA"});

    // Vérifier qu'on ne récupère pas les données ESP
    const tables = await getDbTables();
    const inscriptions = await db.select().from(tables.inscriptions);

    expect(inscriptions).toHaveLength(0);
  });

  it("should allow ESP users to access ESP data", async () => {
    // Créer des données dans rfedi schema
    await db.insert(rfediInscriptions).values({
      eventId: 1,
      eventData: mockEvent,
      createdBy: "esp_user",
    });

    // Se connecter en tant que user ESP
    mockCurrentUser({country: "ESP"});

    // Vérifier qu'on récupère bien les données ESP
    const tables = await getDbTables();
    const inscriptions = await db.select().from(tables.inscriptions);

    expect(inscriptions).toHaveLength(1);
  });
});
```

**Estimation:** 3-4 heures

---

## Résumé Phase 2

### Objectifs Phase 2 ✅

- ✅ Schema `rfedi` créé (structure identique à `ffs`)
- ✅ Données ESP dans `organizations`
- ✅ Clerk : users FRA migrés + admin ESP + héritage invitations
- ✅ `getDbTables()` route automatiquement selon le user
- ✅ Middleware injecte country dans headers
- ✅ API `config/organization` multi-pays
- ✅ Cronjob importe dans les deux schemas
- ✅ Tests d'isolation vérifiés

### Temps Phase 2

| Tâche                           | Temps |
| ------------------------------- | ----- |
| 2.1 Schema rfedi                | 1-2h  |
| 2.2 Données ESP organisations   | 1h    |
| 2.3 Clerk migration + admin ESP | 2-3h  |
| 2.4 getDbTables() multi-pays    | 1-2h  |
| 2.5 Middleware Next.js          | 1-2h  |
| 2.6 API config multi-pays       | 30min |
| 2.7 Cronjob multi-schemas       | 2-3h  |
| 2.8 Tests isolation             | 3-4h  |

**Total Phase 2:** 11-17 heures

---

## TOTAL GÉNÉRAL

### Phase 1 (Abstraction - France)

- **Temps:** 25-35 heures
- **Objectif:** Architecture multi-pays validée en prod avec France
- **Résultat:** France fonctionne normalement, code prêt pour l'Espagne

### Phase 2 (Espagne)

- **Temps:** 11-17 heures
- **Objectif:** Ajouter l'Espagne sur l'infra validée
- **Résultat:** France + Espagne opérationnelles

### TOTAL

- **Temps:** 36-52 heures
- **Prix suggéré:** 3600-5200€
- **Stratégie:** Déploiement progressif sécurisé

---

## Avantages de l'approche progressive

1. **Sécurité:** France continue de fonctionner pendant Phase 1
2. **Validation:** Architecture testée en prod avant d'ajouter ESP
3. **Déploiements:** Possibilité de déployer Phase 1 progressivement
4. **Rollback:** Facile de revenir en arrière si problème
5. **Confiance:** Client voit que ça fonctionne avant de payer plus

---

## Dépendances externes (à obtenir pour Phase 2)

### Espagne (RFEDI)

- **Logos :** Logo principal + signatures email hommes/femmes
- **Contacts :** Emails destinataires (all/men/women) + responsables inscriptions
- **Adresse :** Adresse postale de la fédération
- **Domaine email :** Décider du domaine d'envoi (ex: inscripciones-rfedi.es)

---

## Prochaines étapes

### Phase 1 (Abstraction) - EN COURS

1. ✅ **BACKUP** : Créer branch Neon + pg_dump local
2. 🚧 **Implémenter les étapes de la Phase 1** (EN COURS)
   - ✅ 1.1 Table `organizations` créée et seedée avec FFS
   - ✅ 1.3 Helper `getDbTables()` créé (retourne ancien schema pour l'instant)
   - ✅ 1.3 Toutes les queries directes remplacées par `getDbTables()`
   - ✅ 1.5 API `/api/config/organization` créée
   - ✅ 1.5 Hook `useOrganization` avec TanStack Query créé
   - 🚧 1.6 Remplacement valeurs hardcodées (EN COURS - RecipientManager fait)
   - ⏳ 1.2 Schema `ffs` + migration données (à faire en dernier pour zéro downtime)
   - ⏳ 1.7 Tests adaptés
3. ⏳ Déployer progressivement et valider en prod
4. ⏳ Valider que France fonctionne parfaitement

### Phase 2 (Espagne)

5. ⏳ Obtenir les assets de la RFEDI
6. ⏳ Implémenter les 8 étapes de la Phase 2
7. ⏳ Tests d'isolation complets
8. ⏳ Mise en production avec les deux pays

---

### 🎯 Actions immédiates à finir (session actuelle)

**Finaliser le remplacement des valeurs hardcodées FRA/FFS :**
- [x] `RecipientManager.tsx` - Emails dynamiques depuis organization
- [x] `app/api/competitors/route.ts` - Code pays dynamique depuis organization
- [x] `ResponsibleForEntryBlock.tsx` - Contact responsable depuis organization (+ migration 0014 pour contacts gender-specific)
- [x] `NationalAssociationBlock.tsx` - Logo et nom depuis organization
- [x] `TableFooter.tsx` - Signature depuis organization
- [x] `send-inscription-pdf/route.ts` - baseUrl et fromEmail depuis organization
- [x] `app/api/inscriptions/route.ts` - baseUrl et fromEmail depuis organization
- [x] `app/api/contact-inscription/route.ts` - baseUrl et fromEmail depuis organization
- [x] `scripts/daily-recap.ts` - baseUrl et fromEmail depuis organization

**État actuel :**
- ✅ Migration 0014 : Restructuration contacts pour supporter hommes/femmes séparément
- ✅ Schema `organizations` mis à jour avec `baseUrl`, `fromEmail` et structure contacts gender-specific
- ✅ Toutes les URLs et emails hardcodés remplacés par valeurs dynamiques
- ✅ TypeScript compile sans erreurs

**Prochaines étapes avant déploiement :**
- [ ] Tests manuels complets (création inscription, envoi PDF, emails)
- [ ] Review complète du code avant push en production

**Plus tard :**
1. Créer schema `ffs` et basculer `getDbTables()` (1 ligne à changer)
2. i18n (next-intl)

---

## ⚠️ VALEURS HARDCODÉES À REMPLACER EN PHASE 2

**Ces valeurs "FFS" hardcodées devront devenir dynamiques basées sur l'utilisateur/contexte :**

### Scripts et tâches automatiques
- `scripts/daily-recap.ts:20` - `const organizationCode = "FFS";`
  - **Action Phase 2:** Récupérer l'organization du user ou supporter multi-orgs dans le cron

### API Routes (déjà partiellement dynamiques mais à vérifier)
- `app/api/competitors/route.ts:22` - `eq(organizations.code, "FFS")` si hardcodé
- `app/api/contact-inscription/route.ts` - Emails destinataires en dur (L:100-104)
- `app/api/inscriptions/[id]/event-data/route.ts:65` - Email destinataire en dur `["pmartin@ffs.fr"]`

### Migrations/Seeds
- `drizzle/inscriptions/0011_add_organizations_table.sql` - Seed FFS seulement
- `drizzle/inscriptions/0012_add_email_templates_to_organizations.sql` - Config FFS seulement
- `drizzle/inscriptions/0013_add_base_url_and_from_email.sql` - Config FFS seulement
- `drizzle/inscriptions/0014_update_contacts_structure.sql` - Restructuration contacts pour gender-specific (hommes/femmes)

**Note Phase 2:** Quand on ajoutera l'Espagne, il faudra :
1. Ajouter seed RFEDI dans une nouvelle migration
2. Rendre tous les scripts cron multi-orgs (ou créer un cron par org)
3. Supprimer tous les emails hardcodés et utiliser `org.emailTemplates`

---

**Document créé le:** 2025-09-27
**Dernière mise à jour:** 2025-09-30
**Version:** 3.3 (Migration 0014 : contacts gender-specific + toutes URLs/emails dynamiques)
