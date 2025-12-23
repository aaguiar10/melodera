import { createSpotifyClient } from '../../../../../lib/spotify'
export default async function handler (req, res) {
  // Start/Resume a User's Playback
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    await spotify.player.startResumePlayback(
      req.query.device_id,
      undefined,
      [`spotify:track:${req.query.track_id}`],
      undefined,
      0
    )
    res.status(200).end()
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
