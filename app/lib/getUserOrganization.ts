import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/app/db/inscriptionsDB';
import { getDbTables } from '@/app/lib/getDbTables';
import { eq } from 'drizzle-orm';

/**
 * Gets the organization code for the current user
 *
 * Phase 1: Always returns 'FFS' (current behavior, rétrocompatible)
 * Phase 2: Will read from user.publicMetadata.organizationCode
 * Phase 3: Could add email domain mapping (e.g., @rfedi.es -> 'RFEDI')
 */
export async function getUserOrganizationCode(): Promise<string> {
  try {
    const user = await currentUser();
    if (!user) {
      // No user logged in, default to FFS (maintains current behavior)
      return 'FFS';
    }

    // Phase 1: Always FFS to maintain rétrocompatibilité
    // Phase 2: Uncomment this line when ready for multi-org
    // return (user.publicMetadata?.organizationCode as string) || 'FFS';

    return 'FFS';
  } catch (error) {
    console.warn('Error getting user organization, defaulting to FFS:', error);
    return 'FFS';
  }
}

/**
 * Gets the full organization config for a given organization code
 * Server-side only function
 */
export async function getOrganization(code: string = 'FFS') {
  try {
    const { organizations } = getDbTables();

    const organization = await db
      .select()
      .from(organizations)
      .where(eq(organizations.code, code))
      .limit(1);

    if (!organization || organization.length === 0) {
      return null;
    }

    return organization[0];
  } catch (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
}

/**
 * Sync version for use in API routes that don't support async contexts
 * For now, always returns 'FFS' to maintain current behavior
 *
 * TODO: In Phase 2, this could read from request headers or auth context
 */
export function getUserOrganizationCodeSync(): string {
  // Phase 1: Always FFS to maintain current behavior
  return 'FFS';
}