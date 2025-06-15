import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { setupTestDb } from '../../setup-pglite'
import { setTestDatabase } from '@/app/db/inscriptionsDB'

// Mock Clerk authentication
vi.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      getUser: vi.fn().mockResolvedValue({
        id: 'user_123',
        username: 'testuser',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      }),
    },
  },
}))

// Mock Resend for inscriptions
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        id: 'mock-email-id',
        from: 'test@example.com',
        to: ['pmartin@ffs.fr'],
        created_at: new Date().toISOString(),
      }),
    },
  })),
}))

// No database mocking - using PGLite integration tests

describe('Soft Delete Integration Tests', () => {
  let testDb: any
  let schemas: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup fresh database for each test
    const { db } = await setupTestDb()
    testDb = db
    
    // Set the test database for API routes to use
    setTestDatabase(db)
    
    // Import schemas
    const schemaModule = await import('@/drizzle/schemaInscriptions')
    schemas = schemaModule


    // Create comprehensive test data
    await testDb.insert(schemas.inscriptions).values([
      {
        id: 1,
        eventId: 12345,
        eventData: {
          name: 'Test Competition 1',
          place: 'Test Location 1',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          competitions: [
            { codex: 12345, eventCode: 'SL', genderCode: 'M' },
            { codex: 12346, eventCode: 'GS', genderCode: 'M' }
          ]
        },
        createdBy: 'user_123',
        status: 'open'
      },
      {
        id: 2,
        eventId: 67890,
        eventData: {
          name: 'Test Competition 2',
          place: 'Test Location 2',
          startDate: '2024-02-15',
          endDate: '2024-02-17',
          competitions: [
            { codex: 54321, eventCode: 'DH', genderCode: 'W' }
          ]
        },
        createdBy: 'user_456',
        status: 'open'
      }
    ])

    await testDb.insert(schemas.competitors).values([
      {
        competitorid: 1,
        fiscode: 'FRA12345',
        lastname: 'MARTIN',
        firstname: 'Pierre',
        nationcode: 'FRA',
        gender: 'M',
        birthdate: '1995-01-01',
        skiclub: 'Club des Alpes',
        acpoints: '25.50'
      },
      {
        competitorid: 2,
        fiscode: 'FRA67890',
        lastname: 'DUBOIS',
        firstname: 'Marie',
        nationcode: 'FRA',
        gender: 'W',
        birthdate: '1998-07-22',
        skiclub: 'Ski Club Alpin',
        acpoints: '18.75'
      }
    ])

    await testDb.insert(schemas.inscriptionCompetitors).values([
      {
        inscriptionId: 1,
        competitorId: 1,
        codexNumber: '12345',
        addedBy: 'user_123'
      },
      {
        inscriptionId: 1,
        competitorId: 1,
        codexNumber: '12346',
        addedBy: 'user_123'
      },
      {
        inscriptionId: 2,
        competitorId: 2,
        codexNumber: '54321',
        addedBy: 'user_456'
      }
    ])

  })

  describe('GET /api/inscriptions - Home Page Inscriptions', () => {
    it('should not return deleted inscriptions', async () => {
      const { GET } = await import('@/app/api/inscriptions/route')

      // First, verify we have inscriptions
      const response1 = await GET()
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.length).toBe(2)
      expect(data1.some((i: any) => i.id === 1)).toBe(true)
      expect(data1.some((i: any) => i.id === 2)).toBe(true)

      // Soft delete one inscription
      await testDb
        .update(schemas.inscriptions)
        .set({ deletedAt: new Date() })
        .where(eq(schemas.inscriptions.id, 1))

      // Now verify it's not returned
      const response2 = await GET()
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.length).toBe(1)
      expect(data2.some((i: any) => i.id === 1)).toBe(false)
      expect(data2.some((i: any) => i.id === 2)).toBe(true)
    })
  })

  describe('GET /api/competitors/with-inscriptions', () => {
    it('should not return competitors with all deleted inscription links', async () => {
      const { GET } = await import('@/app/api/competitors/with-inscriptions/route')

      // First, verify male competitor appears
      const request1 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
      const response1 = await GET(request1)
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.some((c: any) => c.competitorid === 1)).toBe(true)

      // Soft delete all inscription links for competitor 1
      await testDb
        .update(schemas.inscriptionCompetitors)
        .set({ deletedAt: new Date() })
        .where(eq(schemas.inscriptionCompetitors.competitorId, 1))

      // Now verify the competitor no longer appears
      const request2 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
      const response2 = await GET(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2.some((c: any) => c.competitorid === 1)).toBe(false)
    })
  })

  describe('GET /api/competitors/[id]/inscriptions', () => {
    it('should not return deleted inscription links', async () => {
      const { GET } = await import('@/app/api/competitors/[id]/inscriptions/route')

      // First, verify the competitor has inscriptions
      const response1 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(Array.isArray(data1)).toBe(true)
      expect(data1.length).toBeGreaterThan(0)

      // Soft delete all inscription competitor links
      await testDb
        .update(schemas.inscriptionCompetitors)
        .set({ deletedAt: new Date() })
        .where(eq(schemas.inscriptionCompetitors.competitorId, 1))

      // Now verify the inscriptions are no longer returned
      const response2 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2).toEqual([])
    })

    it('should not return inscriptions that are themselves deleted', async () => {
      const { GET } = await import('@/app/api/competitors/[id]/inscriptions/route')

      // First, verify the competitor has inscriptions
      const response1 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(data1.length).toBeGreaterThan(0)

      // Soft delete the inscription itself (not just the link)
      await testDb
        .update(schemas.inscriptions)
        .set({ deletedAt: new Date() })
        .where(eq(schemas.inscriptions.id, 1))

      // Now verify the inscriptions are no longer returned
      const response2 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      expect(data2).toEqual([])
    })
  })

  describe('GET /api/inscriptions/[id]/competitors/all', () => {
    it('should not return deleted inscription competitor links', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/all/route')

      // First, verify the inscription has competitors
      const response1 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data1 = await response1.json()

      expect(response1.status).toBe(200)
      expect(Array.isArray(data1)).toBe(true)
      expect(data1.length).toBeGreaterThan(0)

      // Soft delete some inscription competitor links
      await testDb
        .update(schemas.inscriptionCompetitors)
        .set({ deletedAt: new Date() })
        .where(
          and(
            eq(schemas.inscriptionCompetitors.inscriptionId, 1),
            eq(schemas.inscriptionCompetitors.codexNumber, '12345')
          )
        )

      // Now verify the competitor still appears but with fewer codex numbers
      const response2 = await GET({} as NextRequest, { params: Promise.resolve({ id: '1' }) })
      const data2 = await response2.json()

      expect(response2.status).toBe(200)
      // The competitor should still be there but with fewer codex numbers
      expect(data2.length).toBe(data1.length)
      // But the competitor should have fewer codex numbers
      const competitor1Before = data1.find((c: any) => c.competitorid === 1)
      const competitor1After = data2.find((c: any) => c.competitorid === 1)
      expect(competitor1After.codexNumbers.length).toBeLessThan(competitor1Before.codexNumbers.length)
    })
  })

  describe('Complete Integration Test', () => {
    it('should ensure deleted events do not appear anywhere in the system', async () => {
      // Test all relevant endpoints
      const { GET: getInscriptions } = await import('@/app/api/inscriptions/route')
      const { GET: getCompetitorsWithInscriptions } = await import('@/app/api/competitors/with-inscriptions/route')
      const { GET: getCompetitorInscriptions } = await import('@/app/api/competitors/[id]/inscriptions/route')

      // Verify initial state
      const inscriptionsResponse = await getInscriptions()
      const inscriptionsData = await inscriptionsResponse.json()
      expect(inscriptionsData.length).toBe(2)

      const maleCompetitorsRequest = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
      const maleCompetitorsResponse = await getCompetitorsWithInscriptions(maleCompetitorsRequest)
      const maleCompetitorsData = await maleCompetitorsResponse.json()
      expect(maleCompetitorsData.some((c: any) => c.competitorid === 1)).toBe(true)

      const competitorInscriptionsResponse = await getCompetitorInscriptions({} as Request, { params: Promise.resolve({ id: '1' }) })
      const competitorInscriptionsData = await competitorInscriptionsResponse.json()
      expect(competitorInscriptionsData.length).toBeGreaterThan(0)

      // Soft delete inscription ID 1
      await testDb
        .update(schemas.inscriptions)
        .set({ deletedAt: new Date() })
        .where(eq(schemas.inscriptions.id, 1))

      // Verify inscription no longer appears in home page
      const inscriptionsResponse2 = await getInscriptions()
      const inscriptionsData2 = await inscriptionsResponse2.json()
      expect(inscriptionsData2.length).toBe(1)
      expect(inscriptionsData2.some((i: any) => i.id === 1)).toBe(false)

      // Verify competitor inscriptions are updated
      const competitorInscriptionsResponse2 = await getCompetitorInscriptions({} as Request, { params: Promise.resolve({ id: '1' }) })
      const competitorInscriptionsData2 = await competitorInscriptionsResponse2.json()
      expect(competitorInscriptionsData2.length).toBe(0) // Should be empty since inscription 1 was deleted

      // Note: The competitor should still appear in with-inscriptions if they have other active inscriptions
      // In this case, competitor 1 only had inscriptions in event 1, so they should not appear
      const maleCompetitorsRequest2 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
      const maleCompetitorsResponse2 = await getCompetitorsWithInscriptions(maleCompetitorsRequest2)
      const maleCompetitorsData2 = await maleCompetitorsResponse2.json()
      expect(maleCompetitorsData2.some((c: any) => c.competitorid === 1)).toBe(false)
    })
  })
})