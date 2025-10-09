import {
  inscriptions,
  inscriptionCompetitors,
  inscriptionCoaches,
  competitors,
  inscriptionStatus,
  coachGender
} from "../../drizzle/schemaInscriptions";
import { organizations } from "../../drizzle/schemaOrganizations";

export type DbTables = {
  inscriptions: typeof inscriptions;
  inscriptionCompetitors: typeof inscriptionCompetitors;
  inscriptionCoaches: typeof inscriptionCoaches;
  competitors: typeof competitors;
  inscriptionStatus: typeof inscriptionStatus;
  coachGender: typeof coachGender;
  organizations: typeof organizations;
};

// Phase 1: Return FFS schema (renamed from inscriptionsDB)
// Phase 2: Will add logic to return RFEDI schema for Spanish users
export const getDbTables = (): DbTables => {
  return {
    inscriptions,
    inscriptionCompetitors,
    inscriptionCoaches,
    competitors,
    inscriptionStatus,
    coachGender,
    organizations,
  };
};

// Async version for future use if needed
export const getDbTablesAsync = async (): Promise<DbTables> => {
  return getDbTables();
};