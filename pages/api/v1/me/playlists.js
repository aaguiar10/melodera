import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Get User's Playlists
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.currentUser.playlists.playlists(
      parseInt(req.query.limit) || 10,
      parseInt(req.query.offset) || 0
    )
    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
