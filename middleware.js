// Export NextAuth middleware functionality for use in the application
export { default } from 'next-auth/middleware'

// Define a configuration object for the middleware
// The 'matcher' property is an array of routes that the middleware should apply to
export const config = { matcher: ['/analysis'] }
