import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { setupTestDb, seedTestData } from '../../setup-pglite'
import { setTestDatabase } from '@/app/db/inscriptionsDB'

// Mock Clerk authentication
const mockGetUser = vi.fn().mockResolvedValue({
  id: 'user_123',
  username: 'testuser',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
});

vi.mock('@clerk/clerk-sdk-node', () => ({
  clerkClient: {
    users: {
      getUser: mockGetUser,
    },
  },
}))

const mockGetAuth = vi.fn().mockReturnValue({ userId: 'user_123' });

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: mockGetAuth,
}))

// Import real soft delete functions (no mocking for integration tests)
import { selectNotDeleted, softDelete } from '@/lib/soft-delete'

// Extended test data seeding function
async function seedExtendedTestData(db: any) {
  const schemas = await seedTestData(db)
  
  // Import coach schema
  const { inscriptionCoaches } = await import('@/drizzle/schemaInscriptions')

  // Add test coaches
  await db.insert(inscriptionCoaches).values([
    {
      inscriptionId: 1,
      firstName: 'John',
      lastName: 'Doe',
      team: 'Test Team A',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      addedBy: 'user_123',
      createdAt: new Date(),
    },
    {
      inscriptionId: 1,
      firstName: 'Jane',
      lastName: 'Smith',
      team: 'Test Team B',
      startDate: '2024-01-16',
      endDate: '2024-01-19',
      addedBy: 'user_456',
      createdAt: new Date(),
    }
  ])

  // Update inscription with event dates for validation tests
  await db.update(schemas.inscriptions)
    .set({
      eventData: {
        competitions: [
          { codex: 12345, name: 'Test Slalom' },
          { codex: 12346, name: 'Test Giant Slalom' }
        ],
        startDate: '2024-01-15',
        endDate: '2024-01-25'
      }
    })
    .where(eq(schemas.inscriptions.id, 1))

  return { ...schemas, inscriptionCoaches }
}

describe('/api/inscriptions/[id]/coaches - PGLite Complete', () => {
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

  describe('GET /api/inscriptions/[id]/coaches', () => {
    it('should return coaches for an inscription', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/coaches'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBe(2)
      expect(data[0]).toHaveProperty('id')
      expect(data[0]).toHaveProperty('firstName')
      expect(data[0]).toHaveProperty('lastName')
      expect(data[0]).toHaveProperty('team')
      expect(data[0]).toHaveProperty('startDate')
      expect(data[0]).toHaveProperty('endDate')
      expect(data[0]).toHaveProperty('addedByEmail')
    })

    it('should return empty array when no coaches found', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/999/coaches'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 400 for missing inscription id', async () => {
      const { GET } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions//coaches')

      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing inscriptionId')
    })

    it('should handle clerk user lookup failures gracefully', async () => {
      // Mock clerk to throw error for one user
      mockGetUser.mockRejectedValueOnce(new Error('User not found'))

      const { GET } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/coaches'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('POST /api/inscriptions/[id]/coaches', () => {
    it('should add a new coach successfully', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        team: 'New Team',
        startDate: '2024-01-16',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('id')
      expect(data.firstName).toBe('Michael')
      expect(data.lastName).toBe('Johnson')
      expect(data.team).toBe('New Team')
    })

    it('should return 401 when user is not authenticated', async () => {
      // Mock unauthenticated user
      mockGetAuth.mockReturnValueOnce({ 
        userId: null,
        sessionId: null,
        sessionClaims: null,
        sessionStatus: 'signed-out',
        orgId: null,
        orgRole: null,
        orgSlug: null,
        actor: null,
        sign: null,
        protect: null,
        redirectToSignIn: null,
        redirectToSignUp: null,
        has: null,
      } as any)

      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-16',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 for missing inscription id', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-16',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions//coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing inscriptionId')
    })

    it('should return 400 for invalid JSON body', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 for missing required fields', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        // Missing lastName, startDate, endDate
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('First name, last name, start date and end date are required')
    })

    it('should return 400 for empty string fields', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: '   ',
        lastName: 'Johnson',
        startDate: '2024-01-16',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('First name, last name, start date and end date are required')
    })

    it('should return 404 for non-existent inscription', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-16',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/999/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Inscription not found')
    })

    it('should return 400 for invalid date format', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: 'invalid-date',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid date format')
    })

    it('should return 400 when start date is after end date', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-20',
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Start date must be before end date')
    })

    it('should return 400 when start date is before event start date', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-10', // Before event start (2024-01-15)
        endDate: '2024-01-18',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Start date cannot be before event start date')
    })

    it('should return 400 when end date is after event end date', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: 'Michael',
        lastName: 'Johnson',
        startDate: '2024-01-16',
        endDate: '2024-01-30', // After event end (2024-01-25)
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('End date cannot be after event end date')
    })

    it('should trim whitespace from string fields', async () => {
      const { POST } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        firstName: '  Michael  ',
        lastName: '  Johnson  ',
        team: '  Test Team  ',
        startDate: '  2024-01-16  ',
        endDate: '  2024-01-18  ',
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.firstName).toBe('Michael')
      expect(data.lastName).toBe('Johnson')
      expect(data.team).toBe('Test Team')
    })
  })

  describe('DELETE /api/inscriptions/[id]/coaches', () => {
    it('should delete a coach successfully', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      // First get a coach ID from the database
      const coaches = await testDb
        .select()
        .from(schemas.inscriptionCoaches)
        .where(eq(schemas.inscriptionCoaches.inscriptionId, 1))
        .limit(1)

      const coachId = coaches[0].id

      const requestBody = {
        coachId: coachId,
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.deleted).toBeDefined()
    })

    it('should return 400 for missing inscription id', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        coachId: 1,
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions//coaches', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing inscriptionId')
    })

    it('should return 400 for invalid JSON body', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'DELETE',
        body: 'invalid json',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid JSON body')
    })

    it('should return 400 for missing coachId', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        // Missing coachId
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Coach ID is required')
    })

    it('should return 400 for invalid coachId type', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        coachId: 'invalid', // Should be number
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Coach ID is required')
    })

    it('should return 404 when coach not found', async () => {
      const { DELETE } = await import('@/app/api/inscriptions/[id]/coaches/route')

      const requestBody = {
        coachId: 999, // Non-existent coach
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/coaches', {
        method: 'DELETE',
        body: JSON.stringify(requestBody),
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Coach not found')
    })
  })
})