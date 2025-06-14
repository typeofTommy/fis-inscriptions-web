import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './__mocks__/handlers'

// Setup MSW server
const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' })
})

// Clean up after each test
afterEach(() => {
  server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
  server.close()
})

// Mock environment variables
process.env.RESEND_API_KEY = 'test-key'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
process.env.FIS_CLIENT_ID = 'test-client-id'
process.env.FIS_CLIENT_SECRET = 'test-client-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'