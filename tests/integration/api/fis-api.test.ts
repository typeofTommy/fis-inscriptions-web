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
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345&disciplineCode=AL'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(12345)
      expect(data.name).toBe('Event 12345')
      expect(data.place).toBe('Chamonix')
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
    })

    it('should use default discipline code AL when not provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(12345)
    })

    it('should handle FIS codex API errors', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=99999'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Not Found')
    })

    it('should handle missing eventId in codex response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=55555'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No eventId found for codex')
    })

    it('should handle FIS token errors', async () => {
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
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=77777'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('FIS API error (events)')
      expect(data.eventId).toBe(77777)
      expect(data.disciplineCode).toBe('AL')
      expect(data.url).toContain('https://api.fis-ski.com/events/al/77777')
      expect(data.fisError).toBe('Internal Server Error')
    })

    it('should use discipline code from codex response when available', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345&disciplineCode=AL'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(12345)
    })

    it('should include proper headers in FIS API calls', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/fis-api/codex/competition-by-codex?codex=12345'
      )

      const response = await GET(request)
      
      expect(response.status).toBe(200)
    })
  })
})