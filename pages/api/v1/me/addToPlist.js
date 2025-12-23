import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Add Tracks to a Playlist
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.playlists.addItemsToPlaylist(
      req.query.playlist,
      ['spotify:track:' + req.query.track]
    )
    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
