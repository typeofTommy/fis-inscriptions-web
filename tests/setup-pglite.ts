import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import path from 'path'
import fs from 'fs'

/**
 * Manual migration function to work around PGlite multi-statement bug
 * Splits SQL by statement-breakpoint and executes each statement separately
 */
async function applyMigrations(pg: PGlite, migrationsFolder: string) {
  const migrationFiles = fs.readdirSync(migrationsFolder)
    .filter(file => file.endsWith('.sql'))
    .sort()

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsFolder, file)
    const sql = fs.readFileSync(filePath, 'utf-8')

    // Split by statement-breakpoint and filter out empty statements
    const statements = sql
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    // Execute each statement separately using PGlite's query method (not child_process)
    for (const statement of statements) {
      if (statement.trim()) {
        await pg.query(statement)
      }
    }
  }
}

/**
 * Creates a fresh in-memory PostgreSQL database for testing
 * Each test gets a completely isolated database instance
 */
export async function setupTestDb() {
  // Create fresh in-memory PostgreSQL instance
  const pg = new PGlite()
  const db = drizzle(pg)

  // Apply database schema using custom migration function
  const migrationsFolder = path.join(process.cwd(), 'drizzle/inscriptions')
  await applyMigrations(pg, migrationsFolder)

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