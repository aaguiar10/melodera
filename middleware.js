import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

export async function middleware (req) {
  // when user is logged in, valid token
  const token = await getToken({ req })
  if (req.nextUrl.pathname.startsWith('/api/auth') || token) {
    return NextResponse.next()
  }

  // invalid token, redirect user to index
  if (
    !token &&
    (req.nextUrl.pathname.startsWith('/analysis') ||
      req.nextUrl.pathname.startsWith('/api'))
  ) {
    return NextResponse.redirect(new URL('/', req.url))
  }
}
