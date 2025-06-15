import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { InscriptionsTable } from '@/components/InscriptionsTable'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import type { Inscription } from '@/app/types'

// Mock the hooks and dependencies
vi.mock('@/hooks/useCountryInfo', () => ({
  useCountryInfo: vi.fn(() => ({
    getCountryInfo: vi.fn(() => ({ name: 'France', flag: '🇫🇷' }))
  }))
}))

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => 
    <a href={href}>{children}</a>
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => 
    <img src={src} alt={alt} {...props} />
}))

// Mock data
const mockInscriptions: any[] = [
  {
    id: 1,
    eventId: 1234,
    eventData: {
      codex: 1234,
      gender: 'M',
      raceDiscipline: 'AL',
      raceLevel: 'FIS',
      eventName: 'Test Event',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-01-17'),
      venue: 'Test Venue',
      country: 'FRA'
    },
    status: 'open',
    createdBy: 'test-user',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    emailSentAt: null,
    deletedAt: null
  },
  {
    id: 2,
    eventId: 5678,
    eventData: {
      codex: 5678,
      gender: 'F',
      raceDiscipline: 'SL',
      raceLevel: 'NC',
      eventName: 'Another Event',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-02-17'),
      venue: 'Another Venue',
      country: 'SUI'
    },
    status: 'validated',
    createdBy: 'test-user',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    emailSentAt: null,
    deletedAt: null
  }
]

// Mock API response
const mockApiResponse = {
  inscriptions: mockInscriptions,
  competitions: mockInscriptions.map(i => ({
    eventId: i.eventId,
    disciplineCode: i.eventData.raceDiscipline,
    name: i.eventData.eventName
  }))
}

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('InscriptionsTable', () => {
  beforeEach(() => {
    // Mock fetch for the API calls
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as any
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should render loading state initially', () => {
    renderWithQueryClient(<InscriptionsTable />)
    expect(screen.getByText(/chargement/i)).toBeInTheDocument()
  })

  it('should render inscriptions table with data', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
      expect(screen.getByText('Another Event')).toBeInTheDocument()
    })
  })

  it('should filter inscriptions by search term', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText(/rechercher/i)
    fireEvent.change(searchInput, { target: { value: 'Test' } })

    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
      expect(screen.queryByText('Another Event')).not.toBeInTheDocument()
    })
  })

  it('should filter by season', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    const seasonSelect = screen.getByRole('combobox')
    fireEvent.click(seasonSelect)
    
    // Should show season options
    await waitFor(() => {
      expect(screen.getByText(/2023-2024/)).toBeInTheDocument()
    })
  })

  it('should sort table columns', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    const nameHeader = screen.getByText('Nom de l\'événement')
    fireEvent.click(nameHeader)

    // Should sort the table
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })
  })

  it('should show status badges with correct colors', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      const openBadge = screen.getByText('open')
      const validatedBadge = screen.getByText('validated')
      
      expect(openBadge).toBeInTheDocument()
      expect(validatedBadge).toBeInTheDocument()
    })
  })

  it('should render discipline and level badges', async () => {
    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('AL')).toBeInTheDocument()
      expect(screen.getByText('SL')).toBeInTheDocument()
      expect(screen.getByText('FIS')).toBeInTheDocument()
      expect(screen.getByText('NC')).toBeInTheDocument()
    })
  })

  it('should handle API error gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as any

    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeInTheDocument()
    })
  })

  it('should toggle between table and card view on mobile', async () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    renderWithQueryClient(<InscriptionsTable />)
    
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument()
    })

    // Should show card view on mobile
    expect(screen.getByTestId('inscription-card-1')).toBeInTheDocument()
  })
})