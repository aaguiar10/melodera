import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Remove all occurrences of tracks from a playlist
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const data = await spotify.playlists.removeItemsFromPlaylist(
      req.query.playlist,
      { tracks: [{ uri: 'spotify:track:' + req.query.track }] }
    )
    res.status(200).json(data)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
