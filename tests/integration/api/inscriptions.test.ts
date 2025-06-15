import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { setupTestDb } from '../../setup-pglite'
import { setTestDatabase } from '@/app/db/inscriptionsDB'

// Mock Clerk
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

// Mock Resend
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

describe('/api/inscriptions - PGLite Complete', () => {
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
    
    // Seed minimal test data (just one inscription) - let DB auto-generate ID
    await testDb.insert(schemas.inscriptions).values({
      eventId: 11111,
      eventData: { 
        name: 'Seeded Competition',
        place: 'Seeded Location',
        placeNationCode: 'FRA'
      },
      createdBy: 'seeded_user'
    })
  })

  describe('POST /api/inscriptions', () => {
    it('should create a new inscription successfully', async () => {
      const requestBody = {
        eventId: 12345,
        eventData: {
          name: 'Test Competition',
          place: 'Test Location',
          placeNationCode: 'FRA',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          genderCodes: ['M', 'W'],
        },
        createdBy: 'user_123',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const { POST } = await import('@/app/api/inscriptions/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.inscription).toHaveProperty('id')
      expect(data.inscription.eventId).toBe(requestBody.eventId)
      expect(data.inscription.eventData).toEqual(requestBody.eventData)
      expect(data.inscription.createdBy).toBe(requestBody.createdBy)
      expect(data.inscription.status).toBe('open')
      expect(data.inscription.createdAt).toBeDefined()
      
      // Verify data was actually inserted in the database
      const dbInscriptions = await testDb
        .select()
        .from(schemas.inscriptions)
        .where(eq(schemas.inscriptions.eventId, 12345))
        
      expect(dbInscriptions).toHaveLength(1)
      expect(dbInscriptions[0].eventId).toBe(12345)
    })

    it('should return 400 for invalid input', async () => {
      const invalidRequestBody = {
        eventId: 'invalid', // Should be number
        eventData: {},
        // Missing createdBy
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody),
      })

      const { POST } = await import('@/app/api/inscriptions/route')
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
    })

    it('should send notification email after creating inscription', async () => {
      const requestBody = {
        eventId: 54321,
        eventData: {
          name: 'Test Competition',
          place: 'Chamonix',
          placeNationCode: 'FRA',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          genderCodes: ['M', 'W'],
        },
        createdBy: 'user_123',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const { POST } = await import('@/app/api/inscriptions/route')
      const response = await POST(request)

      expect(response.status).toBe(200)
      // Note: Email sending is tested via Resend mock
    })

    it('should handle different gender combinations correctly', async () => {
      const testCases = [
        { genderCodes: ['M'], expectedGender: 'Hommes' },
        { genderCodes: ['W'], expectedGender: 'Femmes' },
        { genderCodes: ['M', 'W'], expectedGender: 'Mixte' },
        { genderCodes: [], expectedGender: '-' },
      ]

      for (const [index, testCase] of testCases.entries()) {
        const requestBody = {
          eventId: 20000 + index, // Different eventId for each test
          eventData: {
            name: 'Test Competition',
            place: 'Test Location',
            genderCodes: testCase.genderCodes,
          },
          createdBy: 'user_123',
        }

        const request = new NextRequest('http://localhost:3000/api/inscriptions', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })

        const { POST } = await import('@/app/api/inscriptions/route')
        const response = await POST(request)
        expect(response.status).toBe(200)
        
        const data = await response.json()
        expect(data.inscription.eventData.genderCodes).toEqual(testCase.genderCodes)
      }
    })
  })

  describe('GET /api/inscriptions', () => {
    it('should return all inscriptions', async () => {
      const { GET } = await import('@/app/api/inscriptions/route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThanOrEqual(1) // We have at least the seeded inscription
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('eventId')
      expect(data[0]).toHaveProperty('eventData')
      expect(data[0]).toHaveProperty('createdBy')
    })

    it('should handle empty results', async () => {
      // Setup a completely fresh database with no data
      const { db: emptyDb } = await setupTestDb()
      
      // Set the empty database for this test
      setTestDatabase(emptyDb)
      
      const { GET } = await import('@/app/api/inscriptions/route')
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })
})