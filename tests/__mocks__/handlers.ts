import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock FIS API authentication
  http.post('https://api.fis-ski.com/oauth/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
    })
  }),

  // Mock FIS API find by codex
  http.get('https://api.fis-ski.com/competitions/find-by-codex/:discipline/:codex', ({ params }) => {
    const { codex, discipline } = params
    if (codex === '99999') {
      return new HttpResponse(null, { status: 404, statusText: 'Not Found' })
    }
    if (codex === '55555') {
      // Return response without eventId for testing
      return HttpResponse.json({
        disciplineCode: discipline?.toString().toUpperCase(),
        name: `Competition ${codex}`,
      })
    }
    if (codex === '77777') {
      // Return valid codex response but events API will fail
      return HttpResponse.json({
        eventId: parseInt(codex as string),
        disciplineCode: discipline?.toString().toUpperCase(),
        name: `Competition ${codex}`,
      })
    }
    return HttpResponse.json({
      eventId: parseInt(codex as string),
      disciplineCode: discipline?.toString().toUpperCase(),
      name: `Competition ${codex}`,
    })
  }),

  // Mock FIS API events
  http.get('https://api.fis-ski.com/events/:discipline/:eventId', ({ params }) => {
    const { eventId, discipline } = params
    if (eventId === '77777') {
      return new HttpResponse('Internal Server Error', { status: 500 })
    }
    return HttpResponse.json({
      id: parseInt(eventId as string),
      name: `Event ${eventId}`,
      place: 'Chamonix',
      placeNationCode: 'FRA',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      genderCodes: ['M', 'W'],
      competitions: [
        { codex: parseInt(eventId as string), name: 'Slalom' },
        { codex: parseInt(eventId as string) + 1, name: 'Giant Slalom' },
      ],
    })
  }),

  // Mock FIS API competition by codex (legacy)
  http.get('https://api.fis-ski.com/competitions/:codex', ({ params }) => {
    const { codex } = params
    return HttpResponse.json({
      id: parseInt(codex as string),
      name: `Competition ${codex}`,
      place: 'Test Location',
      placeNationCode: 'FRA',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      genderCodes: ['M', 'W'],
      disciplines: ['SL', 'GS'],
    })
  }),

  // Mock Resend email API
  http.post('https://api.resend.com/emails', () => {
    return HttpResponse.json({
      id: 'mock-email-id',
      from: 'test@example.com',
      to: ['pmartin@ffs.fr'],
      created_at: new Date().toISOString(),
    })
  }),

  // Mock Clerk user API
  http.get('https://api.clerk.com/v1/users/:userId', ({ params }) => {
    const { userId } = params
    return HttpResponse.json({
      id: userId,
      username: 'testuser',
      emailAddresses: [
        {
          emailAddress: 'test@example.com',
        },
      ],
    })
  }),
]