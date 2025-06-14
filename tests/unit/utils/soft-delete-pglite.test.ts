import { describe, it, expect, beforeEach } from 'vitest'
import { eq, and, isNull, not, SQL } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { setupTestDb } from '../../setup-pglite'

// Test-specific soft delete utilities that accept db parameter
const testSoftDelete = async <T extends PgTable>(
  db: any,
  table: T,
  where: SQL | undefined,
  deletedBy?: string
) => {
  const updateData: Record<string, unknown> = {
    deletedAt: new Date(),
  };
  
  if (deletedBy && 'deletedBy' in table) {
    updateData.deletedBy = deletedBy;
  }

  if (!where) {
    throw new Error("Where clause is required for soft delete");
  }
  
  const whereClause = and(where, isNull((table as any).deletedAt));
  if (!whereClause) {
    throw new Error("Invalid where clause for soft delete");
  }

  return await db
    .update(table)
    .set(updateData)
    .where(whereClause)
    .returning();
};

const testSelectNotDeleted = <T extends PgTable>(
  table: T,
  whereClause?: SQL
) => {
  const notDeletedClause = isNull((table as any).deletedAt);
  
  return whereClause 
    ? and(whereClause, notDeletedClause) || notDeletedClause
    : notDeletedClause;
};

describe('Soft Delete Utilities - PGLite Tests', () => {
  let testDb: any
  let schemas: any

  beforeEach(async () => {
    // Setup fresh database for each test
    const { db } = await setupTestDb()
    testDb = db
    
    // Import schemas
    const { inscriptions, competitors, inscriptionCompetitors } = await import('@/drizzle/schemaInscriptions')
    schemas = { inscriptions, competitors, inscriptionCompetitors }

    // Seed test data
    await testDb.insert(inscriptions).values({
      id: 1,
      eventId: 12345,
      eventData: { competitions: [] },
      createdBy: 'user_123',
      createdAt: new Date()
    })

    await testDb.insert(competitors).values({
      competitorid: 1,
      fiscode: 'TEST001',
      lastname: 'Test',
      firstname: 'User',
      nationcode: 'FRA',
      gender: 'M',
      birthdate: '1990-01-01',
      skiclub: 'Test Club'
    })

    await testDb.insert(inscriptionCompetitors).values({
      id: 1,
      inscriptionId: 1,
      competitorId: 1,
      codexNumber: '12345',
      addedBy: 'user_123'
    })
  })

  describe('selectNotDeleted', () => {
    it('should return only non-deleted records', async () => {
      // First, soft delete one record
      await testSoftDelete(
        testDb,
        schemas.inscriptionCompetitors,
        eq(schemas.inscriptionCompetitors.id, 1)
      )

      // Add another record that's not deleted
      await testDb.insert(schemas.inscriptionCompetitors).values({
        id: 2,
        inscriptionId: 1,
        competitorId: 1,
        codexNumber: '12346',
        addedBy: 'user_123'
      })

      // Query using testSelectNotDeleted
      const nonDeletedRecords = await testDb
        .select()
        .from(schemas.inscriptionCompetitors)
        .where(testSelectNotDeleted(schemas.inscriptionCompetitors))

      expect(nonDeletedRecords).toHaveLength(1)
      expect(nonDeletedRecords[0].id).toBe(2)
      expect(nonDeletedRecords[0].deletedAt).toBeNull()
    })

    it('should combine with other conditions', async () => {
      // Add multiple records
      await testDb.insert(schemas.inscriptionCompetitors).values([
        {
          id: 2,
          inscriptionId: 1,
          competitorId: 1,
          codexNumber: '12346',
          addedBy: 'user_123'
        },
        {
          id: 3,
          inscriptionId: 1,
          competitorId: 1,
          codexNumber: '12347',
          addedBy: 'user_456'
        }
      ])

      // Soft delete one record
      await testSoftDelete(
        testDb,
        schemas.inscriptionCompetitors,
        eq(schemas.inscriptionCompetitors.id, 2)
      )

      // Query with combined conditions
      const records = await testDb
        .select()
        .from(schemas.inscriptionCompetitors)
        .where(
          testSelectNotDeleted(
            schemas.inscriptionCompetitors,
            eq(schemas.inscriptionCompetitors.addedBy, 'user_123')
          )
        )

      expect(records).toHaveLength(1)
      expect(records[0].id).toBe(1)
      expect(records[0].addedBy).toBe('user_123')
    })
  })

  describe('softDelete', () => {
    it('should set deletedAt timestamp', async () => {
      const beforeDelete = new Date()
      
      await testSoftDelete(
        testDb,
        schemas.inscriptionCompetitors,
        eq(schemas.inscriptionCompetitors.id, 1)
      )

      const afterDelete = new Date()

      // Check the record was soft deleted
      const deletedRecord = await testDb
        .select()
        .from(schemas.inscriptionCompetitors)
        .where(eq(schemas.inscriptionCompetitors.id, 1))

      expect(deletedRecord).toHaveLength(1)
      expect(deletedRecord[0].deletedAt).toBeInstanceOf(Date)
      expect(deletedRecord[0].deletedAt.getTime()).toBeGreaterThanOrEqual(beforeDelete.getTime())
      expect(deletedRecord[0].deletedAt.getTime()).toBeLessThanOrEqual(afterDelete.getTime())
    })

    it('should handle complex where conditions', async () => {
      // Add more test data
      await testDb.insert(schemas.inscriptionCompetitors).values([
        {
          id: 2,
          inscriptionId: 1,
          competitorId: 1,
          codexNumber: '12346',
          addedBy: 'user_123'
        },
        {
          id: 3,
          inscriptionId: 1,
          competitorId: 1,
          codexNumber: '12347',
          addedBy: 'user_456'
        }
      ])

      // Soft delete with complex condition
      await testSoftDelete(
        testDb,
        schemas.inscriptionCompetitors,
        and(
          eq(schemas.inscriptionCompetitors.inscriptionId, 1),
          eq(schemas.inscriptionCompetitors.addedBy, 'user_123')
        )
      )

      // Check only records matching the condition were deleted
      const allRecords = await testDb
        .select()
        .from(schemas.inscriptionCompetitors)

      const deletedRecords = allRecords.filter(r => r.deletedAt !== null)
      const activeRecords = allRecords.filter(r => r.deletedAt === null)

      expect(deletedRecords).toHaveLength(2) // IDs 1 and 2
      expect(activeRecords).toHaveLength(1) // ID 3
      expect(activeRecords[0].addedBy).toBe('user_456')
    })

    it('should return updated records', async () => {
      const result = await testSoftDelete(
        testDb,
        schemas.inscriptionCompetitors,
        eq(schemas.inscriptionCompetitors.id, 1)
      )

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(1)
      expect(result[0].deletedAt).toBeInstanceOf(Date)
    })
  })
})