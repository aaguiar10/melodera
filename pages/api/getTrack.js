import { createSpotifyClient } from '../../lib/spotify'
export default async function handler (req, res) {
  // Get Track Info
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.tracks.get(req.query.id)
    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
