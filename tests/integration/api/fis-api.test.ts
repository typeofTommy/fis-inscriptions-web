import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock environment variables
vi.mock('@/app/lib/fisAuth', () => ({
  getFisToken: vi.fn().mockResolvedValue({
    access_token: 'mock-access-token',
    token_type: 'Bearer',
    expires_in: 3600,
  }),
}))

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import after mocks
const { GET } = await import('@/app/api/fis-api/codex/competition-by-codex/route')
const { getFisToken } = await import('@/app/lib/fisAuth')

describe('/api/fis-api/codex/competition-by-codex', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment variables for each test
    process.env.FIS_API_KEY = 'test-api-key'
  })

  describe('GET /api/fis-api/codex/competition-by-codex', () => {
    it('should return competition data for valid codex', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'AL',
        name: 'Test Competition',
      }

      const mockEventResponse = {
        id: 12345,
        name: 'Test Competition',
        place: 'Chamonix',
        placeNationCode: 'FRA',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        genderCodes: ['M', 'W'],
        competitions: [
          { codex: 12345, name: 'Slalom' },
          { codex: 12346, name: 'Giant Slalom' },
        ],
      }

      // Mock the fetch calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCodexResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEventResponse),
        })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345&disciplineCode=AL'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockEventResponse)
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(getFisToken).toHaveBeenCalledOnce()
    })

    it('should return 400 for missing codex parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing codex')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should use default discipline code AL when not provided', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'AL',
      }

      const mockEventResponse = {
        id: 12345,
        name: 'Test Competition',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCodexResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEventResponse),
        })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      await GET(request)

      // Verify the first call uses default 'AL' discipline code
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        'https://api.fis-ski.com/competitions/find-by-codex/AL/12345',
        expect.objectContaining({
          headers: expect.objectContaining({
            'x-api-key': 'test-api-key',
          }),
        })
      )
    })

    it('should handle FIS codex API errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=99999'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should handle missing eventId in codex response', async () => {
      const mockCodexResponse = {
        // No eventId
        disciplineCode: 'AL',
        name: 'Test Competition',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCodexResponse),
      })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No eventId found for codex')
    })

    it('should handle FIS token errors', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'AL',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCodexResponse),
      })

      // Mock token error
      ;(getFisToken as any).mockRejectedValueOnce(new Error('Token error'))

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Token error')
    })

    it('should handle FIS event API errors with detailed error response', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'AL',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCodexResponse),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('FIS API error (events)')
      expect(data.eventId).toBe(12345)
      expect(data.disciplineCode).toBe('AL')
      expect(data.url).toContain('https://api.fis-ski.com/events/al/12345')
      expect(data.fisCodexData).toEqual(mockCodexResponse)
      expect(data.fisError).toBe('Internal Server Error')
    })

    it('should use discipline code from codex response when available', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'SL', // Different from request parameter
      }

      const mockEventResponse = {
        id: 12345,
        name: 'Slalom Competition',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCodexResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEventResponse),
        })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345&disciplineCode=AL'
      )

      await GET(request)

      // Verify the second call uses the discipline code from codex response
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        'https://api.fis-ski.com/events/sl/12345',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer mock-access-token',
          }),
        })
      )
    })

    it('should include proper headers in FIS API calls', async () => {
      const mockCodexResponse = {
        eventId: 12345,
        disciplineCode: 'AL',
      }

      const mockEventResponse = {
        id: 12345,
        name: 'Test Competition',
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCodexResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockEventResponse),
        })

      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      await GET(request)

      // Check first call headers (codex lookup)
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          headers: {
            'x-api-key': 'test-api-key',
            Accept: 'application/json',
            'X-CSRF-TOKEN': '',
          },
        })
      )

      // Check second call headers (event data)
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer mock-access-token',
            Accept: 'application/json',
            'X-CSRF-TOKEN': '',
          },
        })
      )
    })
  })
})