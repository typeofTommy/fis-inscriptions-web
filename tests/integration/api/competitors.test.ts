import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { setupTestDb, seedTestData } from '../../setup-pglite'
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

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn().mockReturnValue({ userId: 'user_123' }),
}))

// Mock soft delete functions - use actual implementation
vi.mock('@/lib/soft-delete', async () => {
  const actual = await vi.importActual('@/lib/soft-delete')
  return actual
})

// No database mocking - using PGLite integration tests

// Extended test data seeding function
async function seedExtendedTestData(db: any) {
  const schemas = await seedTestData(db)
  
  // Add more competitors for comprehensive testing
  await db.insert(schemas.competitors).values([
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

  // Add inscription-competitor links
  await db.insert(schemas.inscriptionCompetitors).values([
    {
      inscriptionId: 1,
      competitorId: 1,
      codexNumber: '12345',
      addedBy: 'user_123'
    },
    {
      inscriptionId: 1,
      competitorId: 2,
      codexNumber: '12345', 
      addedBy: 'user_456'
    }
  ])

  return schemas
}

describe('/api/inscriptions/[id]/competitors - PGLite Complete', () => {
  let testDb: any
  let schemas: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup fresh database for each test
    const { db } = await setupTestDb()
    testDb = db
    
    // Set the test database for API routes to use
    setTestDatabase(db)
    
    // Seed extended test data
    schemas = await seedExtendedTestData(db)
  })

  describe('GET /api/inscriptions/[id]/competitors', () => {
    it('should return competitors for a specific codex', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?codexNumber=12345'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2) // We have 2 competitors for codex 12345
      expect(data[0]).toHaveProperty('competitorid')
      expect(data[0]).toHaveProperty('fiscode')
      expect(data[0]).toHaveProperty('addedByEmail')
    })

    it('should return empty array when no competitors found for codex', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?codexNumber=99999'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return all codex competitors when no codexNumber specified', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      // Should return structure with codexNumber and competitors array
      expect(data[0]).toHaveProperty('codexNumber')
      expect(data[0]).toHaveProperty('competitors')
    })

    it('should return competitor codex list when competitorId specified', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?competitorId=1'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      // Should return the codex entries where this competitor is registered
    })

    it('should return 400 for missing inscription id', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions//competitors')

      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing parameters')
    })

    it('should filter points by discipline correctly', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/competitors/route')

      // Test different disciplines
      for (const discipline of ['SL', 'GS', 'SG', 'DH']) {
        const request = new NextRequest(
          `http://localhost:3000/api/inscriptions/1/competitors?codexNumber=12345&discipline=${discipline}`
        )

        const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
        expect(response.status).toBe(200)
      }
    })
  })

  describe('PUT /api/inscriptions/[id]/competitors', () => {
    it('should update competitor registrations successfully', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        codexNumbers: [12345, 12346],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Competitor registrations updated successfully')

      // Verify data was actually inserted in the database
      const registrations = await testDb
        .select()
        .from(schemas.inscriptionCompetitors)
        .where(eq(schemas.inscriptionCompetitors.competitorId, 1))

      expect(registrations.length).toBeGreaterThan(0)
    })

    it('should return 400 for invalid JSON body', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: 'invalid json',
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 for missing required fields', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        // Missing codexNumbers
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('competitorId and codexNumbers array are required')
    })

    it('should return 400 for invalid codexNumbers format', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        codexNumbers: ['invalid', 'format'], // Should be numbers
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('codexNumbers must be an array of numbers')
    })

    it('should return 404 for non-existent inscription', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        codexNumbers: [12345],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/999/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Inscription not found')
    })

    it('should return 404 for non-existent competitor', async () => {
      const { PUT } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 999, // Non-existent competitor
        codexNumbers: [12345],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Competitor not found')
    })
  })

  describe('DELETE /api/inscriptions/[id]/competitors', () => {
    it('should delete competitor from specific codex', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        codexNumbers: ['12345'],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deleted).toBeDefined()
    })

    it('should delete competitor from all codex when codexNumbers not provided', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deleted).toBeDefined()
    })

    it('should return 400 for missing competitorId', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        // Missing competitorId
        codexNumbers: ['12345'],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing competitorId')
    })

    it('should return 400 for invalid JSON body', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'DELETE',
        body: 'invalid json',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 for missing inscription id', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

      const requestBody = {
        competitorId: 1,
        codexNumbers: ['12345'],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions//competitors', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing inscriptionId')
    })
  })
})

describe('/api/competitors/with-inscriptions - Soft Delete Tests', () => {
  let testDb: any
  let schemas: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup fresh database for each test
    const { db } = await setupTestDb()
    testDb = db
    
    // Set the test database for API routes to use
    setTestDatabase(db)
    
    // Seed extended test data
    schemas = await seedExtendedTestData(db)
  })

  it('should not include competitors with all deleted inscription links', async () => {
    const { GET } = await import('@/app/api/competitors/with-inscriptions/route')

    // First, verify the competitor appears in the list
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

    // Now verify the competitor no longer appears in the list
    const request2 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
    const response2 = await GET(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.some((c: any) => c.competitorid === 1)).toBe(false)
    
    // But competitor 2 (female) should still appear in the female list
    const request3 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=W')
    const response3 = await GET(request3)
    const data3 = await response3.json()

    expect(response3.status).toBe(200)
    expect(data3.some((c: any) => c.competitorid === 2)).toBe(true)
  })

  it('should handle partial deletion of inscription links correctly', async () => {
    const { GET } = await import('@/app/api/competitors/with-inscriptions/route')

    // Add another inscription link for competitor 1
    await testDb.insert(schemas.inscriptionCompetitors).values({
      inscriptionId: 1,
      competitorId: 1,
      codexNumber: '12347',
      addedBy: 'user_123'
    })

    // Verify competitor appears initially
    const request1 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
    const response1 = await GET(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.some((c: any) => c.competitorid === 1)).toBe(true)

    // Soft delete only one inscription link
    await testDb
      .update(schemas.inscriptionCompetitors)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schemas.inscriptionCompetitors.competitorId, 1),
          eq(schemas.inscriptionCompetitors.codexNumber, '12345')
        )
      )

    // Competitor should still appear (has remaining non-deleted links)
    const request2 = new NextRequest('http://localhost:3000/api/competitors/with-inscriptions?gender=M')
    const response2 = await GET(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.some((c: any) => c.competitorid === 1)).toBe(true)
  })
})

describe('/api/competitors/[id]/inscriptions - Soft Delete Tests', () => {
  let testDb: any
  let schemas: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Setup fresh database for each test
    const { db } = await setupTestDb()
    testDb = db
    
    // Set the test database for API routes to use
    setTestDatabase(db)
    
    // Seed extended test data
    schemas = await seedExtendedTestData(db)
  })

  it('should not return deleted inscription links', async () => {
    const { GET } = await import('@/app/api/competitors/[id]/inscriptions/route')

    // First, verify the competitor has inscriptions
    const response1 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(Array.isArray(data1)).toBe(true)
    expect(data1.length).toBeGreaterThan(0)

    // Soft delete the inscription competitor link
    await testDb
      .update(schemas.inscriptionCompetitors)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schemas.inscriptionCompetitors.competitorId, 1),
          eq(schemas.inscriptionCompetitors.inscriptionId, 1)
        )
      )

    // Now verify the inscriptions are no longer returned
    const response2 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2).toEqual([])
  })

  it('should not return inscriptions that are themselves deleted', async () => {
    const { GET } = await import('@/app/api/competitors/[id]/inscriptions/route')

    // First, verify the competitor has inscriptions
    const response1 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.length).toBeGreaterThan(0)

    // Soft delete the inscription itself (not just the link)
    await testDb
      .update(schemas.inscriptions)
      .set({ deletedAt: new Date() })
      .where(eq(schemas.inscriptions.id, 1))

    // Now verify the inscriptions are no longer returned
    const response2 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2).toEqual([])
  })

  it('should handle mixed deleted and non-deleted states correctly', async () => {
    const { GET } = await import('@/app/api/competitors/[id]/inscriptions/route')

    // Add another inscription for the same competitor
    await testDb.insert(schemas.inscriptions).values({
      id: 2,
      eventId: 67890,
      eventData: { 
        name: 'Second Competition',
        place: 'Another Location',
        startDate: '2024-02-01',
        endDate: '2024-02-03',
        competitions: [{ codex: 54321, name: 'Second GS' }]
      },
      createdBy: 'user_456'
    })

    await testDb.insert(schemas.inscriptionCompetitors).values({
      inscriptionId: 2,
      competitorId: 1,
      codexNumber: '54321',
      addedBy: 'user_456'
    })

    // Verify competitor has 2 inscriptions
    const response1 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.length).toBe(2)

    // Soft delete only the first inscription
    await testDb
      .update(schemas.inscriptions)
      .set({ deletedAt: new Date() })
      .where(eq(schemas.inscriptions.id, 1))

    // Now verify only the second inscription is returned
    const response2 = await GET({} as Request, { params: Promise.resolve({ id: '1' }) })
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.length).toBe(1)
    expect(data2[0].inscriptionId).toBe(2)
  })
})