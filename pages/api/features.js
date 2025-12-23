import { createSpotifyClient } from '../../lib/spotify'

// Note: Spotify deprecated the Audio Features API in November 2024
// This endpoint returns placeholder data as a fallback
export default async function handler (req, res) {
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)

  try {
    const data = await spotify.tracks.audioFeatures(req.query.id)
    res.status(200).json(data)
  } catch (error) {
    // console.warn('Audio Features API error (likely deprecated):', error.message)

    // Return placeholder data since Spotify deprecated this endpoint
    // Users need Extended Quota Mode for access
    const placeholderFeatures = {
      id: req.query.id,
      danceability: 0.5,
      energy: 0.5,
      key: 0,
      loudness: -10,
      mode: 1,
      speechiness: 0.1,
      acousticness: 0.5,
      instrumentalness: 0.1,
      liveness: 0.2,
      valence: 0.5,
      tempo: 120,
      duration_ms: 200000,
      time_signature: 4,
      _isPlaceholder: true,
      _message:
        'Audio Features API is deprecated. Apply for Extended Quota Mode at developer.spotify.com'
    }

    res.status(200).json(placeholderFeatures)
  }
}
