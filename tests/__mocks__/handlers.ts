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

  // Mock FIS API competition by codex
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