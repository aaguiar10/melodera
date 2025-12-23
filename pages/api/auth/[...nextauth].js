import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

// https://next-auth.js.org/configuration/options
async function refreshAccessToken (token) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken
      })
    })

    const refreshedToken = await response.json()

    if (!response.ok) {
      throw refreshedToken
    }

    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpires: Date.now() + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError'
    }
  }
}

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'streaming',
            'user-read-private',
            'user-read-email',
            'user-modify-playback-state',
            'user-read-playback-state',
            'user-read-currently-playing',
            'user-follow-read',
            'user-library-read',
            'user-library-modify',
            'user-top-read',
            'playlist-read-collaborative',
            'playlist-read-private',
            'playlist-modify-public',
            'playlist-modify-private'
          ]
        }
      }
    })
  ],
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/'
  },
  logger: {
    error (code, metadata) {
      // log NextAuth errors
      let message = metadata.message ?? metadata.error.message
      console.error('NextAuthError', { code, message })
    }
  },
  callbacks: {
    async jwt ({ token, account, profile }) {
      // initial sign in
      if (account && profile) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at * 1000,
          profile: profile
        }
      } // return access token if it has not expired
      else if (Date.now() < token.accessTokenExpires) {
        return token
      } else {
        // refresh token since access token expired
        return await refreshAccessToken(token)
      }
    },
    async session ({ session, token }) {
      if (token) {
        session.user.accessToken = token.accessToken
        session.user.profile = {
          id: token.profile.id,
          display_name: token.profile.display_name,
          images: token.profile.images,
          country: token.profile.country,
          product: token.profile.product,
          followersTotal: token.profile.followers.total
        }
        session.expires = token.accessTokenExpires
      }
      return session
    }
  }
}
export default NextAuth(authOptions)
