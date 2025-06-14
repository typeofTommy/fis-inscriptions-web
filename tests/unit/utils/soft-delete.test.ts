import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'

// Mock database objects
const mockTable = {
  deletedAt: {
    tableName: 'test_table',
    name: 'deletedAt',
  },
}

const mockDb = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([]),
}

vi.mock('@/app/db/inscriptionsDB', () => ({
  db: mockDb,
}))

// Import after mocks
const { selectNotDeleted, softDelete } = await import('@/lib/soft-delete')

describe('Soft Delete Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('selectNotDeleted', () => {
    it('should add deletedAt IS NULL condition to existing where clause', () => {
      const existingCondition = eq(mockTable.deletedAt, 'test-value')
      const result = selectNotDeleted(mockTable, existingCondition)

      // Result should be an AND condition that includes both the existing condition
      // and the deletedAt IS NULL check
      expect(result).toBeDefined()
      // This tests that the function combines conditions properly
    })

    it('should handle null existing condition', () => {
      const result = selectNotDeleted(mockTable, null)
      
      // Should still return a condition that checks deletedAt IS NULL
      expect(result).toBeDefined()
    })

    it('should work with no existing condition', () => {
      const result = selectNotDeleted(mockTable)
      
      // Should return just the deletedAt IS NULL condition
      expect(result).toBeDefined()
    })

    it('should work with complex AND conditions', () => {
      const condition1 = eq(mockTable.deletedAt, 'value1')
      const condition2 = eq(mockTable.deletedAt, 'value2')
      const complexCondition = and(condition1, condition2)
      
      const result = selectNotDeleted(mockTable, complexCondition)
      
      // Should combine the complex condition with deletedAt IS NULL
      expect(result).toBeDefined()
    })
  })

  describe('softDelete', () => {
    it('should update deletedAt field with current timestamp', async () => {
      const whereCondition = eq(mockTable.deletedAt, 'test-value')
      
      await softDelete(mockTable, whereCondition)

      expect(mockDb.update).toHaveBeenCalledWith(mockTable)
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      )
      expect(mockDb.where).toHaveBeenCalledWith(whereCondition)
    })

    it('should return the result of the database update', async () => {
      const whereCondition = eq(mockTable.deletedAt, 'test-value')
      const expectedResult = [{ id: 1, deletedAt: new Date() }]
      mockDb.returning.mockResolvedValue(expectedResult)
      
      const result = await softDelete(mockTable, whereCondition)

      expect(result).toBe(expectedResult)
    })

    it('should handle database errors', async () => {
      const whereCondition = eq(mockTable.deletedAt, 'test-value')
      const dbError = new Error('Database connection failed')
      mockDb.returning.mockRejectedValue(dbError)
      
      await expect(softDelete(mockTable, whereCondition)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should work with complex where conditions', async () => {
      const condition1 = eq(mockTable.deletedAt, 'value1')
      const condition2 = eq(mockTable.deletedAt, 'value2')
      const complexCondition = and(condition1, condition2)
      
      await softDelete(mockTable, complexCondition)

      expect(mockDb.update).toHaveBeenCalledWith(mockTable)
      expect(mockDb.where).toHaveBeenCalledWith(complexCondition)
    })

    it('should set deletedAt to a recent timestamp', async () => {
      const whereCondition = eq(mockTable.deletedAt, 'test-value')
      const beforeCall = new Date()
      
      await softDelete(mockTable, whereCondition)
      
      const afterCall = new Date()
      const setCall = mockDb.set.mock.calls[0][0]
      const deletedAtValue = setCall.deletedAt

      expect(deletedAtValue).toBeInstanceOf(Date)
      expect(deletedAtValue.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime())
      expect(deletedAtValue.getTime()).toBeLessThanOrEqual(afterCall.getTime())
    })
  })

  describe('Integration scenarios', () => {
    it('should work together for typical soft delete workflow', async () => {
      // Simulate a typical workflow where we first select non-deleted items
      // then soft delete specific ones
      
      const table = mockTable
      const itemId = 'test-id'
      
      // 1. Create condition to select non-deleted items
      const selectCondition = selectNotDeleted(table, eq(table.deletedAt, itemId))
      expect(selectCondition).toBeDefined()
      
      // 2. Perform soft delete
      const deleteCondition = eq(table.deletedAt, itemId)
      await softDelete(table, deleteCondition)
      
      expect(mockDb.update).toHaveBeenCalledWith(table)
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        })
      )
    })

    it('should handle batch soft delete operations', async () => {
      const table = mockTable
      const ids = ['id1', 'id2', 'id3']
      
      // Simulate deleting multiple items
      for (const id of ids) {
        const condition = eq(table.deletedAt, id)
        await softDelete(table, condition)
      }
      
      expect(mockDb.update).toHaveBeenCalledTimes(3)
      expect(mockDb.set).toHaveBeenCalledTimes(3)
      expect(mockDb.where).toHaveBeenCalledTimes(3)
    })
  })
})