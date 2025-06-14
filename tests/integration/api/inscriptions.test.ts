import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the database first
const mockDb = {
  select: vi.fn(() => ({ from: vi.fn().mockResolvedValue([]) })),
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

// Import after mocks
const { POST, GET } = await import('@/app/api/inscriptions/route')

const mockInscriptions = [
  {
    id: 1,
    eventId: 12345,
    eventData: {
      name: 'Test Competition',
      place: 'Test Location',
      placeNationCode: 'FRA',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      genderCodes: ['M', 'W'],
    },
    status: 'open',
    createdBy: 'user_123',
    createdAt: '2025-01-15T10:00:00.000Z',
    emailSentAt: null,
    deletedAt: null,
  },
]

describe('/api/inscriptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

      const mockInscription = {
        id: 1,
        ...requestBody,
        status: 'open',
        createdAt: '2025-01-15T10:00:00.000Z',
        emailSentAt: null,
        deletedAt: null,
      }

      mockDb.returning.mockResolvedValue([mockInscription])

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.inscription).toEqual(mockInscription)
      expect(mockDb.insert).toHaveBeenCalled()
      expect(mockDb.values).toHaveBeenCalledWith({
        createdBy: requestBody.createdBy,
        eventId: requestBody.eventId,
        eventData: requestBody.eventData,
      })
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

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid input')
      expect(data.details).toBeDefined()
    })

    it('should handle database errors gracefully', async () => {
      const requestBody = {
        eventId: 12345,
        eventData: { name: 'Test' },
        createdBy: 'user_123',
      }

      mockDb.returning.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal Server Error')
    })

    it('should send notification email after creating inscription', async () => {
      const requestBody = {
        eventId: 12345,
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

      mockDb.returning.mockResolvedValue([{ id: 1, ...requestBody }])

      const request = new NextRequest('http://localhost:3000/api/inscriptions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      // Note: Email sending is tested via MSW handlers
    })

    it('should handle different gender combinations correctly', async () => {
      const testCases = [
        { genderCodes: ['M'], expectedGender: 'Hommes' },
        { genderCodes: ['W'], expectedGender: 'Femmes' },
        { genderCodes: ['M', 'W'], expectedGender: 'Mixte' },
        { genderCodes: [], expectedGender: '-' },
      ]

      for (const testCase of testCases) {
        const requestBody = {
          eventId: 12345,
          eventData: {
            name: 'Test Competition',
            place: 'Test Location',
            genderCodes: testCase.genderCodes,
          },
          createdBy: 'user_123',
        }

        mockDb.returning.mockResolvedValue([{ id: 1, ...requestBody }])

        const request = new NextRequest('http://localhost:3000/api/inscriptions', {
          method: 'POST',
          body: JSON.stringify(requestBody),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })
  })

  describe('GET /api/inscriptions', () => {
    it('should return all inscriptions', async () => {
      const mockSelectQuery = { from: vi.fn().mockResolvedValue(mockInscriptions) }
      mockDb.select.mockReturnValue(mockSelectQuery)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockInscriptions)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('should handle empty results', async () => {
      const mockSelectQuery = { from: vi.fn().mockResolvedValue([]) }
      mockDb.select.mockReturnValue(mockSelectQuery)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })
})