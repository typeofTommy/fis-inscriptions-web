import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create a flexible mock db function
const createMockQuery = (resolvedValue: any) => ({
  from: vi.fn(() => ({
    where: vi.fn(() => ({
      limit: vi.fn().mockResolvedValue(resolvedValue),
    })),
  })),
  where: vi.fn().mockResolvedValue(resolvedValue),
})

// Mock the database first
const mockDb = {
  select: vi.fn(() => createMockQuery([])),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  execute: vi.fn(),
}

vi.mock('@/app/db/inscriptionsDB', () => ({
  db: mockDb,
}))

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

vi.mock('@clerk/nextjs/server', () => ({
  getAuth: vi.fn().mockReturnValue({ userId: 'user_123' }),
}))

// Mock soft delete functions
vi.mock('@/lib/soft-delete', () => ({
  selectNotDeleted: vi.fn((table, condition) => condition),
  softDelete: vi.fn().mockResolvedValue({ deleted: 1 }),
}))

// Import after mocks
const { GET, PUT, DELETE } = await import('@/app/api/inscriptions/[id]/competitors/route')

const mockCompetitors = [
  {
    competitorid: 1,
    fiscode: 'FRA12345',
    lastname: 'MARTIN',
    firstname: 'Pierre',
    nationcode: 'FRA',
    gender: 'M',
    birthdate: '1995-03-15',
    skiclub: 'Club des Neiges',
    points: '25.50',
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
    points: '18.75',
  },
]

const mockInscriptionCompetitors = [
  {
    competitorId: 1,
    codexNumber: '12345',
    addedBy: 'user_123',
  },
  {
    competitorId: 2,
    codexNumber: '12345',
    addedBy: 'user_456',
  },
]

const mockInscription = {
  eventData: {
    competitions: [
      { codex: 12345, name: 'Slalom Test' },
      { codex: 12346, name: 'Giant Slalom Test' },
    ],
  },
}

describe('/api/inscriptions/[id]/competitors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/inscriptions/[id]/competitors', () => {
    it('should return competitors for a specific codex', async () => {
      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockInscriptionCompetitors),
      }
      const mockCompetitorsQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCompetitors),
      }

      mockDb.select
        .mockReturnValueOnce(mockSelectQuery) // For inscription_competitors
        .mockReturnValueOnce(mockCompetitorsQuery) // For competitors

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?codexNumber=12345&discipline=SL'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(mockDb.select).toHaveBeenCalledTimes(2)
    })

    it('should return empty array when no competitors found for codex', async () => {
      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]), // No competitors found
      }

      mockDb.select.mockReturnValue(mockSelectQuery)

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?codexNumber=12345'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return all codex competitors when no codexNumber specified', async () => {
      const mockInscriptionQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockInscription]),
      }
      const mockCompetitorsLinkQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockInscriptionCompetitors),
      }
      const mockCompetitorsQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCompetitors),
      }

      mockDb.select
        .mockReturnValueOnce(mockInscriptionQuery) // For inscription eventData
        .mockReturnValue(mockCompetitorsLinkQuery) // For inscription_competitors
        .mockReturnValue(mockCompetitorsQuery) // For competitors

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors')

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return competitor codex list when competitorId specified', async () => {
      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ codexNumber: '12345' }]),
      }
      const mockInscriptionQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockInscription]),
      }

      mockDb.select
        .mockReturnValueOnce(mockSelectQuery) // For competitor codex numbers
        .mockReturnValueOnce(mockInscriptionQuery) // For inscription eventData

      const request = new NextRequest(
        'http://localhost:3000/api/inscriptions/1/competitors?competitorId=1'
      )

      const response = await GET(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    it('should return 400 for missing inscription id', async () => {
      const request = new NextRequest('http://localhost:3000/api/inscriptions//competitors')

      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing parameters')
    })

    it('should filter points by discipline correctly', async () => {
      const mockSelectQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockInscriptionCompetitors),
      }
      const mockCompetitorsQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockCompetitors),
      }

      mockDb.select
        .mockReturnValueOnce(mockSelectQuery)
        .mockReturnValueOnce(mockCompetitorsQuery)

      const disciplines = ['SL', 'GS', 'SG', 'DH']
      
      for (const discipline of disciplines) {
        vi.clearAllMocks()
        mockDb.select
          .mockReturnValueOnce(mockSelectQuery)
          .mockReturnValueOnce(mockCompetitorsQuery)

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
      // Mock both inscription and competitor to exist
      mockDb.select
        .mockReturnValueOnce(createMockQuery([{ id: 1 }])) // Inscription exists
        .mockReturnValueOnce(createMockQuery([{ competitorid: 1 }])) // Competitor exists
      
      mockDb.insert.mockReturnThis()
      mockDb.values.mockResolvedValue([])

      const requestBody = {
        competitorId: 1,
        codexNumbers: [12345, 12346],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Competitor registrations updated successfully')
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should return 400 for invalid JSON body', async () => {
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
      // Mock inscription not found
      mockDb.select.mockReturnValue(createMockQuery([]))

      const requestBody = {
        competitorId: 1,
        codexNumbers: [12345],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/999/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Inscription not found')
    })

    it('should return 404 for non-existent competitor', async () => {
      // Mock inscription exists but competitor doesn't
      mockDb.select
        .mockReturnValueOnce(createMockQuery([{ id: 1 }])) // Inscription exists
        .mockReturnValueOnce(createMockQuery([])) // Competitor not found

      const requestBody = {
        competitorId: 999,
        codexNumbers: [12345],
      }

      const request = new NextRequest('http://localhost:3000/api/inscriptions/1/competitors', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Competitor not found')
    })
  })

  describe('DELETE /api/inscriptions/[id]/competitors', () => {
    it('should delete competitor from specific codex', async () => {
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
      const requestBody = {
        competitorId: 1,
        // No codexNumbers - should delete from all
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
      const requestBody = {
        competitorId: 1,
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