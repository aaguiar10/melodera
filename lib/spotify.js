import { SpotifyApi } from '@spotify/web-api-ts-sdk'

// Create a Spotify API client with a user's access token
export function createSpotifyClient (accessToken) {
  return SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: ''
  })
}
