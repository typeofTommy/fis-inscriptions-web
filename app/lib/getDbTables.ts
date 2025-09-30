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

// Phase 1: Return current schema (inscriptionsDB) - ZERO DOWNTIME
// Phase 2: Will be switched to return new schema (ffs) in a single line change
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