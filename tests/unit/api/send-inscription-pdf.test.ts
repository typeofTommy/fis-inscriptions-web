import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock Resend
const mockResendSend = vi.fn()
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mockResendSend
    }
  }))
}))

// Mock database
const mockDbSelect = vi.fn()
vi.mock('@/app/db/inscriptionsDB', () => ({
  db: {
    select: mockDbSelect,
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([])
      })
    })
  }
}))

// Mock drizzle
vi.mock('drizzle-orm', () => ({
  eq: vi.fn()
}))

// Mock date-fns to avoid import issues
vi.mock('date-fns', () => ({
  format: vi.fn().mockReturnValue('01/01/2024')
}))

describe('PDF Email API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test-api-key'
    process.env.RESEND_FROM_EMAIL = 'test@example.com'
  })

  it('should return 400 for missing required fields', async () => {
    // Mock request.formData() to return missing fields
    const mockFormData = new Map([
      ['to', '["test@example.com"]'],
      ['inscriptionId', '1']
      // Missing pdf and subject
    ])

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request

    const { POST } = await import('@/app/api/send-inscription-pdf/route')
    
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields: pdf, to, inscriptionId, subject')
  })

  it('should return 400 for invalid JSON recipients', async () => {
    const mockPdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    const mockFormData = new Map([
      ['pdf', mockPdfFile],
      ['to', 'invalid-json'],
      ['inscriptionId', '1'],
      ['subject', 'Test Subject']
    ])

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request

    const { POST } = await import('@/app/api/send-inscription-pdf/route')
    
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid \'to\' field: must be a JSON array of emails.')
  })

  it('should return 404 for non-existent inscription', async () => {
    const mockPdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    
    const mockFormData = new Map([
      ['pdf', mockPdfFile],
      ['to', '["test@example.com"]'],
      ['inscriptionId', '999'],
      ['subject', 'Test Subject']
    ])

    // Mock database to return empty result
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]) // Empty array = not found
        })
      })
    })

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request

    const { POST } = await import('@/app/api/send-inscription-pdf/route')
    
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Inscription not found')
  })

  it('should return 500 when email sending fails', async () => {
    const mockPdfFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    }
    
    const mockFormData = new Map([
      ['pdf', mockPdfFile],
      ['to', '["test@example.com"]'],
      ['inscriptionId', '1'],
      ['subject', 'Test Subject'],
      ['gender', 'M']
    ])

    // Mock database to return inscription
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            eventData: {
              startDate: '2024-04-11',
              endDate: '2024-04-12',
              place: 'Test Place',
              placeNationCode: 'ITA'
            }
          }])
        })
      })
    })

    // Mock Resend to fail
    mockResendSend.mockResolvedValue({
      data: null,
      error: { message: 'Email service error' }
    })

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request

    const { POST } = await import('@/app/api/send-inscription-pdf/route')
    
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to send email')
    expect(data.details).toEqual({ message: 'Email service error' })
  })

  it('should send email successfully', async () => {
    const mockPdfFile = {
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
    }
    
    const mockFormData = new Map([
      ['pdf', mockPdfFile],
      ['to', '["test@example.com"]'],
      ['inscriptionId', '1'],
      ['subject', 'Test Subject'],
      ['gender', 'M']
    ])

    // Mock database to return inscription
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{
            eventData: {
              startDate: '2024-04-11',
              endDate: '2024-04-12',
              place: 'Test Place',
              placeNationCode: 'ITA'
            }
          }])
        })
      })
    })

    // Mock Resend to succeed
    mockResendSend.mockResolvedValue({
      data: { id: 'email-123' },
      error: null
    })

    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request

    const { POST } = await import('@/app/api/send-inscription-pdf/route')
    
    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe('Email sent successfully!')
    expect(data.emailId).toBe('email-123')

    // Verify email was sent with correct parameters
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'test@example.com',
        to: ['test@example.com'],
        subject: expect.stringContaining('French 🇫🇷 MEN entries'),
        html: expect.stringContaining('Dear Ski Friend'),
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('Test Place'),
            content: expect.any(Buffer)
          })
        ])
      })
    )
  })
})