import { vi } from 'vitest'

// Mock database functions
export const mockDb = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
  execute: vi.fn(),
}

// Mock inscriptions
export const mockInscriptions = [
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
    createdAt: new Date(),
    emailSentAt: null,
    deletedAt: null,
  },
]

// Mock competitors
export const mockCompetitors = [
  {
    competitorid: 1,
    fiscode: 'FRA12345',
    lastname: 'MARTIN',
    firstname: 'Pierre',
    nationcode: 'FRA',
    gender: 'M',
    birthdate: '1995-03-15',
    skiclub: 'Club des Neiges',
    slpoints: '25.50',
    gspoints: '22.30',
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
    slpoints: '18.75',
    gspoints: '20.10',
  },
]

// Mock inscription competitors
export const mockInscriptionCompetitors = [
  {
    id: 1,
    inscriptionId: 1,
    competitorId: 1,
    codexNumber: '12345',
    addedBy: 'user_123',
    createdAt: new Date(),
    deletedAt: null,
  },
]

// Mock coaches
export const mockCoaches = [
  {
    id: 1,
    inscriptionId: 1,
    firstName: 'Jean',
    lastName: 'COACH',
    team: 'Équipe de France',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    addedBy: 'user_123',
    createdAt: new Date(),
    deletedAt: null,
  },
]