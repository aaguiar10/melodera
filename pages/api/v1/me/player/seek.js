import { createSpotifyClient } from '../../../../../lib/spotify'
export default async function handler (req, res) {
  // Seek To Position In Currently Playing Track
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    await spotify.player.seekToPosition(parseInt(req.query.position_ms))
    res.status(200).end()
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
