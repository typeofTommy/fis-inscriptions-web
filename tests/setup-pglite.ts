import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import path from 'path'

/**
 * Creates a fresh in-memory PostgreSQL database for testing
 * Each test gets a completely isolated database instance
 */
export async function setupTestDb() {
  // Create fresh in-memory PostgreSQL instance
  const pg = new PGlite()
  const db = drizzle(pg)
  
  // Apply database schema using Drizzle migrations
  const migrationsFolder = path.join(process.cwd(), 'drizzle/inscriptions')
  await migrate(db, { migrationsFolder })
  
  return { db, pg }
}

/**
 * Helper to seed test data for specific test scenarios
 */
export async function seedTestData(db: any) {
  // Import schemas
  const { inscriptions, competitors, inscriptionCompetitors } = await import('@/drizzle/schemaInscriptions')
  
  // Seed basic test data
  await db.insert(inscriptions).values({
    id: 1,
    eventId: 12345,
    eventData: {
      competitions: [
        { codex: 12345, name: 'Test Slalom' },
        { codex: 12346, name: 'Test Giant Slalom' }
      ]
    },
    createdBy: 'user_123',
    createdAt: new Date()
  })
  
  await db.insert(competitors).values({
    competitorid: 1,
    fiscode: 'FRA12345',
    lastname: 'TEST',
    firstname: 'User',
    nationcode: 'FRA',
    gender: 'M',
    birthdate: '1990-01-01',
    skiclub: 'Test Club',
    acpoints: '25.50'
  })
  
  return { inscriptions, competitors, inscriptionCompetitors }
}