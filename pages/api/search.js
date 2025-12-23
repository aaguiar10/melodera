import { createSpotifyClient } from '../../lib/spotify'

export default async function handler (req, res) {
  // Search tracks, artists, albums, playlists
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)

  const limit = 10
  const offset = parseInt(req.query.offset) || 0

  try {
    if (req.query.type) {
      // Search for a specific type
      const types = [req.query.type]
      const data = await spotify.search(
        req.query.query,
        types,
        undefined,
        limit,
        offset
      )
      res.status(200).json(data)
    } else {
      // Search all types
      const data = await spotify.search(
        req.query.query,
        ['track', 'artist', 'album', 'playlist'],
        undefined,
        limit,
        offset
      )
      res.status(200).json(data)
    }
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
