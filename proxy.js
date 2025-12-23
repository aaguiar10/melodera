// Export NextAuth middleware functionality for use in the application
import { default as nextAuthMiddleware } from 'next-auth/middleware'

export function proxy (request) {
  return nextAuthMiddleware(request)
}

// Define a configuration object for the proxy
// The 'matcher' property is an array of routes that the proxy should apply to
export const config = { matcher: ['/analysis'] }
