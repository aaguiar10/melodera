import spotifyApi, { REDIRECT_URI } from '@/lib/spotify'
import NextAuth from 'next-auth'
import SpotifyProvider from 'next-auth/providers/spotify'

// https://next-auth.js.org/configuration/options
async function refreshAccessToken (token) {
  try {
    spotifyApi.setRefreshToken(token.refreshToken)
    const { body: refreshedToken } = await spotifyApi.refreshAccessToken()
    spotifyApi.setAccessToken(refreshedToken.access_token)
    return {
      ...token,
      accessToken: refreshedToken.access_token,
      accessTokenExpires: Date.now() + refreshedToken.expires_in * 1000,
      refreshToken: refreshedToken.refresh_token ?? token.refreshToken
    }
  } catch (error) {
    console.error(error)
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
      authorization: REDIRECT_URI
    })
    // ...add more providers here
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/'
  },
  logger: {
    error (code, metadata) {
      // handle error when user cancels sign-in
      let message = metadata.message ?? metadata.error.message
      console.error('nextAuthError', { code, message })
    }
  },
  callbacks: {
    async jwt ({ token, user, account }) {
      // initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          accessTokenExpires: account.expires_at * 1000
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
      session.user.accessToken = token.accessToken
      session.user.refreshToken = token.refreshToken
      session.user.username = token.username
      session.expires = token.accessTokenExpires
      return session
    }
  }
}
export default NextAuth(authOptions)
