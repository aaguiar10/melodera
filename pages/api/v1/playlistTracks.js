import { createSpotifyClient } from '../../../lib/spotify'
export default async function handler (req, res) {
  // Get a Playlist
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.playlists.getPlaylist(
      req.query.id,
      req.query.market
    )
    res.status(200).send(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
