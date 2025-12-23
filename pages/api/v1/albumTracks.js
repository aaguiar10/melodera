import { createSpotifyClient } from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get Tracks in an Album
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.albums.tracks(
      req.query.id,
      req.query.market,
      50,
      0
    )
    res.status(200).send(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
