import { createSpotifyClient } from '../../../../lib/spotify'
export default async function handler (req, res) {
  // Create a Playlist
  const accessToken = req.headers?.authorization?.split(' ')[1]
  const spotify = createSpotifyClient(accessToken)
  try {
    const dateString = req.query.timestamp.split(',')[0]
    const title = req.query.title
    const user = await spotify.currentUser.profile()
    const playlist = await spotify.playlists.createPlaylist(user.id, {
      name: `${title} (${dateString})`,
      description: 'Curated by Melodera',
      public: true
    })
    // Add Tracks to the Playlist
    const trackList = req.query.tracks.split(',')
    const result = await spotify.playlists.addItemsToPlaylist(
      playlist.id,
      trackList
    )
    res.status(200).json(result)
  } catch (error) {
    console.error(error)
    res.status(error.status || 500).json({ error: error.message })
  }
}
