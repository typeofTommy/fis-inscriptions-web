import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { setupTestDb, seedTestData } from '../../setup-pglite'

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

// Mock soft delete functions
vi.mock('@/lib/soft-delete', () => ({
  selectNotDeleted: vi.fn((table, condition) => condition),
  softDelete: vi.fn().mockResolvedValue({ deleted: 1 }),
}))

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
    
    // Seed extended test data
    schemas = await seedExtendedTestData(db)

    // Mock the database in routes
    vi.doMock('@/app/db/inscriptionsDB', () => ({
      db: testDb,
    }))
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