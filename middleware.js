import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware (req) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  // valid token, continue with the request
  if (token || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // invalid token, redirect user to index
  if (
    !token &&
    (pathname.startsWith('/analysis') || pathname.startsWith('/api'))
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
