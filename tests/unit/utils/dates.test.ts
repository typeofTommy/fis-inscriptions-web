import { describe, it, expect } from 'vitest'
import {
  getSeasonFromDate,
  getCurrentSeason,
  getSeasonsFromInscriptions,
} from '@/app/lib/dates'
import type { Inscription } from '@/app/types'

describe('Date utilities', () => {
  describe('getSeasonFromDate', () => {
    it('should return correct season for January date', () => {
      expect(getSeasonFromDate('2024-01-15')).toBe('2023-2024')
    })

    it('should return correct season for September date', () => {
      expect(getSeasonFromDate('2024-09-15')).toBe('2024-2025')
    })

    it('should return correct season for July date (end of season)', () => {
      expect(getSeasonFromDate('2024-07-15')).toBe('2023-2024')
    })

    it('should return correct season for August date (start of new season)', () => {
      expect(getSeasonFromDate('2024-08-15')).toBe('2024-2025')
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15')
      expect(getSeasonFromDate(date)).toBe('2023-2024')
    })
  })

  describe('getCurrentSeason', () => {
    it('should return current season string', () => {
      const season = getCurrentSeason()
      expect(season).toMatch(/^\d{4}-\d{4}$/)
    })

    it('should return season based on current date logic', () => {
      const now = new Date()
      const expectedSeason = getSeasonFromDate(now)
      expect(getCurrentSeason()).toBe(expectedSeason)
    })
  })

  describe('getSeasonsFromInscriptions', () => {
    const mockInscriptions: Inscription[] = [
      {
        id: 1,
        codex: 1234,
        gender: 'M',
        raceDiscipline: 'AL',
        raceLevel: 'FIS',
        eventName: 'Winter Event',
        startDate: '2024-01-15',
        endDate: '2024-01-17',
        venue: 'Test Venue',
        country: 'FRA',
        status: 'open',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        deletedAt: null
      },
      {
        id: 2,
        codex: 5678,
        gender: 'F',
        raceDiscipline: 'SL',
        raceLevel: 'NC',
        eventName: 'Summer Event',
        startDate: '2024-09-15',
        endDate: '2024-09-17',
        venue: 'Another Venue',
        country: 'SUI',
        status: 'validated',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        deletedAt: null
      }
    ]

    it('should extract unique seasons from inscriptions', () => {
      const seasons = getSeasonsFromInscriptions(mockInscriptions)
      expect(seasons).toContain('2023-2024')
      expect(seasons).toContain('2024-2025')
      expect(seasons).toHaveLength(2)
    })

    it('should sort seasons in descending order', () => {
      const seasons = getSeasonsFromInscriptions(mockInscriptions)
      expect(seasons[0]).toBe('2024-2025')
      expect(seasons[1]).toBe('2023-2024')
    })

    it('should handle empty array', () => {
      const seasons = getSeasonsFromInscriptions([])
      expect(seasons).toEqual([])
    })

    it('should handle inscriptions from same season', () => {
      const sameSeasonInscriptions = [
        { ...mockInscriptions[0], startDate: '2024-01-15' },
        { ...mockInscriptions[0], startDate: '2024-02-15' },
        { ...mockInscriptions[0], startDate: '2024-03-15' },
      ]
      const seasons = getSeasonsFromInscriptions(sameSeasonInscriptions)
      expect(seasons).toEqual(['2023-2024'])
    })
  })
})