import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Transfer a User's Playback
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    await spotify.player.transferPlayback([req.query.device_id])
    res.status(200).end()
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
